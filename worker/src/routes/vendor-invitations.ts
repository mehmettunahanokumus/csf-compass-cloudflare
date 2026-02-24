/**
 * Vendor Invitations Routes
 *
 * Endpoints for vendor self-assessment management:
 * - POST /api/vendor-invitations - Send assessment to vendor
 * - GET /api/vendor-invitations/validate/:token - Validate token & load assessment (public)
 * - PATCH /api/vendor-invitations/:token/items/:itemId - Update vendor assessment item (public)
 * - POST /api/vendor-invitations/:token/complete - Mark self-assessment complete (public)
 * - GET /api/vendor-invitations/:organizationAssessmentId/comparison - Get comparison data
 * - GET /api/assessments/:id/invitation - Get invitation for org assessment
 * - POST /api/vendor-invitations/:invitationId/revoke - Revoke magic link token
 */

import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import type { Env } from '../types/env';
import { createDbClient } from '../db/client';
import {
  assessments,
  assessment_items,
  vendor_assessment_invitations,
  csf_subcategories,
  csf_categories,
  csf_functions,
} from '../db/schema';
import { cloneAssessmentForVendor } from '../lib/assessment-cloning';
import {
  generateInvitationToken,
  validateInvitationToken,
  generateSessionToken,
  validateSessionToken,
  generateMagicLink,
} from '../lib/invitation-tokens';
import { checkRateLimit } from '../lib/rate-limiter';
import { logAuditEvent } from '../lib/audit-logger';
import { updateAssessmentScore } from '../lib/scoring';

const app = new Hono<{ Bindings: Env }>();

// Security headers for all vendor portal responses
const SECURITY_HEADERS = {
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

/**
 * a) POST /api/vendor-invitations
 * Send assessment to vendor
 * Requires organization authentication (DEMO_ORG_ID)
 */
app.post('/', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const body = await c.req.json();

    // Validate required fields
    if (!body.organization_assessment_id || !body.vendor_contact_email) {
      return c.json({ error: 'organization_assessment_id and vendor_contact_email are required' }, 400);
    }

    // Get organization assessment
    const orgAssessment = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, body.organization_assessment_id))
      .limit(1);

    if (orgAssessment.length === 0) {
      return c.json({ error: 'Assessment not found' }, 404);
    }

    const assessment = orgAssessment[0];

    // Verify assessment is a vendor assessment
    if (assessment.assessment_type !== 'vendor') {
      return c.json({ error: 'Can only send vendor assessments to vendors' }, 400);
    }

    if (!assessment.vendor_id) {
      return c.json({ error: 'Assessment must have a vendor_id' }, 400);
    }

    // Clone assessment for vendor self-assessment
    const vendorAssessmentId = await cloneAssessmentForVendor(
      db,
      c.env.DB,
      body.organization_assessment_id,
      assessment.organization_id
    );

    // Generate JWT access token
    const tokenExpiryDays = body.token_expiry_days || 7; // Default 7 days
    const jwtSecret = c.env.JWT_SECRET;

    if (!jwtSecret) {
      return c.json({ error: 'JWT_SECRET not configured' }, 500);
    }

    const invitationId = crypto.randomUUID();
    const accessToken = await generateInvitationToken(
      jwtSecret,
      invitationId,
      vendorAssessmentId,
      body.organization_assessment_id,
      tokenExpiryDays
    );

    const tokenExpiresAt = Date.now() + (tokenExpiryDays * 24 * 60 * 60 * 1000);

    // Create invitation record
    await c.env.DB.prepare(
      `INSERT INTO vendor_assessment_invitations
       (id, organization_assessment_id, vendor_self_assessment_id, vendor_id, organization_id,
        vendor_contact_email, vendor_contact_name, access_token, token_expires_at,
        invitation_status, sent_at, message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      invitationId,
      body.organization_assessment_id,
      vendorAssessmentId,
      assessment.vendor_id,
      assessment.organization_id,
      body.vendor_contact_email,
      body.vendor_contact_name || null,
      accessToken,
      tokenExpiresAt,
      'pending',
      Date.now(),
      body.message || null,
      Date.now(),
      Date.now()
    ).run();

    // Generate magic link
    const baseUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
    const magicLink = generateMagicLink(accessToken, baseUrl);

    return c.json({
      invitation_id: invitationId,
      magic_link: magicLink,
      expires_at: tokenExpiresAt,
      vendor_email: body.vendor_contact_email,
    }, 201);
  } catch (error) {
    console.error('Error sending invitation:', error);
    return c.json({ error: 'Failed to send invitation' }, 500);
  }
});

/**
 * b) GET /api/vendor-invitations/validate/:token
 * Validate token & load vendor assessment (ONE-TIME TOKEN CONSUMPTION)
 * Public endpoint with rate limiting and audit logging
 */
app.get('/validate/:token', async (c) => {
  const token = c.req.param('token');

  try {
    // 1. Check rate limit (10 requests/min per IP)
    const rateLimitResponse = await checkRateLimit(c, 'token_validation');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      return c.json({ error: 'Server configuration error' }, 500, SECURITY_HEADERS);
    }

    // 2. Validate JWT token signature and expiration
    const validationResult = await validateInvitationToken(jwtSecret, token);

    if (!validationResult.valid || !validationResult.payload) {
      return c.json(
        { valid: false, error: validationResult.error || 'Invalid token' },
        401,
        SECURITY_HEADERS
      );
    }

    const { invitationId } = validationResult.payload;

    // 3. Get invitation from database
    const invitationResult = await c.env.DB.prepare(
      'SELECT * FROM vendor_assessment_invitations WHERE id = ?'
    ).bind(invitationId).first();

    if (!invitationResult) {
      await logAuditEvent(c, invitationId, 'token_rejected', { reason: 'invitation_not_found' });
      return c.json({ valid: false, error: 'Invitation not found' }, 404, SECURITY_HEADERS);
    }

    // Check if invitation is revoked
    if (invitationResult.revoked_at) {
      await logAuditEvent(c, invitationId, 'token_rejected', { reason: 'invitation_revoked' });
      return c.json(
        { valid: false, error: 'This invitation has been revoked' },
        403,
        SECURITY_HEADERS
      );
    }

    // 4. Update access tracking (no one-time consumption)
    // Update invitation status and last accessed time
    await c.env.DB.prepare(
      `UPDATE vendor_assessment_invitations
       SET invitation_status = CASE WHEN invitation_status = 'pending' THEN 'accessed' ELSE invitation_status END,
           accessed_at = CASE WHEN accessed_at IS NULL THEN ? ELSE accessed_at END,
           last_accessed_at = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      Date.now(),
      Date.now(),
      Date.now(),
      invitationId
    ).run();

    // Log audit event
    await logAuditEvent(c, invitationId, 'token_validated');

    // Get assessment data
    const db = createDbClient(c.env.DB);
    const assessment = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, invitationResult.vendor_self_assessment_id as string))
      .limit(1);

    return c.json({
      valid: true,
      invitation: invitationResult,
      assessment: assessment[0] || null,
      vendor_contact_name: invitationResult.vendor_contact_name,
    }, 200, SECURITY_HEADERS);
  } catch (error) {
    console.error('Error validating token:', error);
    return c.json({ error: 'Failed to validate token' }, 500, SECURITY_HEADERS);
  }
});

/**
 * GET /api/vendor-invitations/:token/items
 * Get all assessment items for vendor assessment
 * Public endpoint with token-based auth (reusable link)
 */
app.get('/:token/items', async (c) => {
  const token = c.req.param('token');

  try {
    // Validate JWT token
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      return c.json({ error: 'Server configuration error' }, 500, SECURITY_HEADERS);
    }

    const tokenValidation = await validateInvitationToken(jwtSecret, token);

    if (!tokenValidation.valid || !tokenValidation.payload) {
      return c.json({ error: tokenValidation.error || 'Invalid token' }, 401, SECURITY_HEADERS);
    }

    const invitationId = tokenValidation.payload.invitationId;

    // Get invitation from database
    const invitationResult = await c.env.DB.prepare(
      'SELECT * FROM vendor_assessment_invitations WHERE id = ?'
    ).bind(invitationId).first();

    if (!invitationResult) {
      return c.json({ error: 'Invitation not found' }, 404, SECURITY_HEADERS);
    }

    // Check if revoked
    if (invitationResult.revoked_at) {
      return c.json({ error: 'This invitation has been revoked' }, 403, SECURITY_HEADERS);
    }

    // Get all assessment items with subcategory details
    const db = createDbClient(c.env.DB);
    const items = await db
      .select({
        id: assessment_items.id,
        assessment_id: assessment_items.assessment_id,
        subcategory_id: assessment_items.subcategory_id,
        status: assessment_items.status,
        notes: assessment_items.notes,
        created_at: assessment_items.created_at,
        updated_at: assessment_items.updated_at,
        subcategory: {
          id: csf_subcategories.id,
          name: csf_subcategories.name,
          description: csf_subcategories.description,
          category_id: csf_subcategories.category_id,
        },
        category: {
          id: csf_categories.id,
          name: csf_categories.name,
          function_id: csf_categories.function_id,
        },
        function: {
          id: csf_functions.id,
          name: csf_functions.name,
          description: csf_functions.description,
        }
      })
      .from(assessment_items)
      .leftJoin(csf_subcategories, eq(assessment_items.subcategory_id, csf_subcategories.id))
      .leftJoin(csf_categories, eq(csf_subcategories.category_id, csf_categories.id))
      .leftJoin(csf_functions, eq(csf_categories.function_id, csf_functions.id))
      .where(eq(assessment_items.assessment_id, invitationResult.vendor_self_assessment_id as string));

    // Update last_accessed_at
    await c.env.DB.prepare(
      'UPDATE vendor_assessment_invitations SET last_accessed_at = ?, updated_at = ? WHERE id = ?'
    ).bind(Date.now(), Date.now(), invitationId).run();

    return c.json({ items }, 200, SECURITY_HEADERS);
  } catch (error) {
    console.error('Error fetching items:', error);
    return c.json({ error: 'Failed to fetch assessment items' }, 500, SECURITY_HEADERS);
  }
});

/**
 * c) PATCH /api/vendor-invitations/:token/items/:itemId
 * Update vendor's assessment item
 * Public endpoint with session cookie auth
 */
app.patch('/:token/items/:itemId', async (c) => {
  const token = c.req.param('token');
  const itemId = c.req.param('itemId');

  try {
    // 1. Check rate limit (30 requests/min per IP)
    const rateLimitResponse = await checkRateLimit(c, 'status_update');
    if (rateLimitResponse) {
      await logAuditEvent(c, token, 'rate_limited', { operation: 'status_update' });
      return rateLimitResponse;
    }

    // 2. Validate JWT token
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      return c.json({ error: 'Server configuration error' }, 500, SECURITY_HEADERS);
    }

    const tokenValidation = await validateInvitationToken(jwtSecret, token);

    if (!tokenValidation.valid || !tokenValidation.payload) {
      return c.json({ error: tokenValidation.error || 'Invalid token' }, 401, SECURITY_HEADERS);
    }

    const invitationId = tokenValidation.payload.invitationId;

    // 3. Get invitation from database
    const invitationResult = await c.env.DB.prepare(
      'SELECT * FROM vendor_assessment_invitations WHERE id = ?'
    ).bind(invitationId).first();

    if (!invitationResult) {
      return c.json({ error: 'Invitation not found' }, 404, SECURITY_HEADERS);
    }

    // Check if revoked
    if (invitationResult.revoked_at) {
      return c.json({ error: 'This invitation has been revoked' }, 403, SECURITY_HEADERS);
    }

    // 4. Verify itemId belongs to vendor_self_assessment
    const db = createDbClient(c.env.DB);
    const item = await db
      .select()
      .from(assessment_items)
      .where(
        and(
          eq(assessment_items.id, itemId),
          eq(assessment_items.assessment_id, invitationResult.vendor_self_assessment_id as string)
        )
      )
      .limit(1);

    if (item.length === 0) {
      return c.json({ error: 'Assessment item not found' }, 404, SECURITY_HEADERS);
    }

    // 5. Update assessment_item
    const body = await c.req.json();
    const updateData: Record<string, unknown> = {
      updated_at: new Date(Date.now()),
    };
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updatedItem = await db
      .update(assessment_items)
      .set(updateData)
      .where(eq(assessment_items.id, itemId))
      .returning();

    // 6. Recalculate assessment score
    await updateAssessmentScore(db, invitationResult.vendor_self_assessment_id as string);

    // 7. Update last_accessed_at
    await c.env.DB.prepare(
      'UPDATE vendor_assessment_invitations SET last_accessed_at = ?, updated_at = ? WHERE id = ?'
    ).bind(Date.now(), Date.now(), invitationId).run();

    // 8. Log audit event
    await logAuditEvent(c, invitationId, 'status_updated', {
      item_id: itemId,
      new_status: body.status,
    });

    return c.json(updatedItem[0], 200, SECURITY_HEADERS);
  } catch (error) {
    console.error('Error updating assessment item:', error);
    return c.json({ error: 'Failed to update assessment item' }, 500, SECURITY_HEADERS);
  }
});

/**
 * d) POST /api/vendor-invitations/:token/complete
 * Mark self-assessment complete
 * Public endpoint with session cookie auth
 */
app.post('/:token/complete', async (c) => {
  const token = c.req.param('token');

  try {
    // 1. Check rate limit
    const rateLimitResponse = await checkRateLimit(c, 'token_validation');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Validate JWT token
    const jwtSecret = c.env.JWT_SECRET;
    if (!jwtSecret) {
      return c.json({ error: 'Server configuration error' }, 500, SECURITY_HEADERS);
    }

    const tokenValidation = await validateInvitationToken(jwtSecret, token);

    if (!tokenValidation.valid || !tokenValidation.payload) {
      return c.json({ error: tokenValidation.error || 'Invalid token' }, 401, SECURITY_HEADERS);
    }

    const invitationId = tokenValidation.payload.invitationId;

    // 3. Get invitation
    const invitationResult = await c.env.DB.prepare(
      'SELECT * FROM vendor_assessment_invitations WHERE id = ?'
    ).bind(invitationId).first();

    if (!invitationResult) {
      return c.json({ error: 'Invitation not found' }, 404, SECURITY_HEADERS);
    }

    // Check if revoked
    if (invitationResult.revoked_at) {
      return c.json({ error: 'This invitation has been revoked' }, 403, SECURITY_HEADERS);
    }

    // 4. Update invitation status to 'completed'
    const completedAt = Date.now();

    await c.env.DB.prepare(
      `UPDATE vendor_assessment_invitations
       SET invitation_status = 'completed', completed_at = ?, last_accessed_at = ?, updated_at = ?
       WHERE id = ?`
    ).bind(completedAt, Date.now(), Date.now(), invitationId).run();

    // 5. Update vendor_self_assessment status to 'completed'
    const db = createDbClient(c.env.DB);
    await db
      .update(assessments)
      .set({
        status: 'completed',
        completed_at: new Date(completedAt),
        updated_at: new Date(Date.now()),
      })
      .where(eq(assessments.id, invitationResult.vendor_self_assessment_id as string));

    // 6. Log audit event
    await logAuditEvent(c, invitationId, 'assessment_submitted');

    return c.json({ success: true, completed_at: completedAt }, 200, SECURITY_HEADERS);
  } catch (error) {
    console.error('Error completing assessment:', error);
    return c.json({ error: 'Failed to complete assessment' }, 500, SECURITY_HEADERS);
  }
});

/**
 * e) GET /api/vendor-invitations/:organizationAssessmentId/comparison
 * Get comparison data between org assessment and vendor self-assessment
 * Requires organization authentication
 */
app.get('/:organizationAssessmentId/comparison', async (c) => {
  const organizationAssessmentId = c.req.param('organizationAssessmentId');

  try {
    const db = createDbClient(c.env.DB);

    // Get org assessment
    const orgAssessment = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, organizationAssessmentId))
      .limit(1);

    if (orgAssessment.length === 0) {
      return c.json({ error: 'Assessment not found' }, 404);
    }

    // Get invitation
    const invitationResult = await c.env.DB.prepare(
      'SELECT * FROM vendor_assessment_invitations WHERE organization_assessment_id = ? LIMIT 1'
    ).bind(organizationAssessmentId).first();

    if (!invitationResult) {
      return c.json({
        organization_assessment: orgAssessment[0],
        vendor_self_assessment: null,
        invitation: null,
        comparison_items: [],
      });
    }

    // Get vendor self-assessment
    const vendorAssessment = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, invitationResult.vendor_self_assessment_id as string))
      .limit(1);

    // Get all items for both assessments with subcategories
    const orgItems = await db
      .select({
        item: assessment_items,
        subcategory: csf_subcategories,
        category: csf_categories,
        function: csf_functions,
      })
      .from(assessment_items)
      .leftJoin(csf_subcategories, eq(assessment_items.subcategory_id, csf_subcategories.id))
      .leftJoin(csf_categories, eq(csf_subcategories.category_id, csf_categories.id))
      .leftJoin(csf_functions, eq(csf_categories.function_id, csf_functions.id))
      .where(eq(assessment_items.assessment_id, organizationAssessmentId));

    const vendorItems = await db
      .select()
      .from(assessment_items)
      .where(eq(assessment_items.assessment_id, invitationResult.vendor_self_assessment_id as string));

    // Build comparison items
    const comparisonItems = orgItems.map((orgItem) => {
      const vendorItem = vendorItems.find(
        (v) => v.subcategory_id === orgItem.item.subcategory_id
      );

      const matches = vendorItem && orgItem.item.status === vendorItem.status;
      const difference = vendorItem
        ? `Org: ${orgItem.item.status}, Vendor: ${vendorItem.status}`
        : null;

      return {
        subcategory_id: orgItem.item.subcategory_id,
        subcategory: orgItem.subcategory,
        category: orgItem.category,
        function: orgItem.function,
        org_item: orgItem.item,
        vendor_item: vendorItem || null,
        matches,
        difference: matches ? null : difference,
      };
    });

    return c.json({
      organization_assessment: orgAssessment[0],
      vendor_self_assessment: vendorAssessment[0] || null,
      invitation: invitationResult,
      comparison_items: comparisonItems,
    });
  } catch (error) {
    console.error('Error fetching comparison:', error);
    return c.json({ error: 'Failed to fetch comparison data' }, 500);
  }
});

/**
 * f) GET /api/assessments/:id/invitation
 * Get invitation for organization assessment
 * Requires organization authentication
 */
app.get('/assessments/:id/invitation', async (c) => {
  const assessmentId = c.req.param('id');

  try {
    const invitationResult = await c.env.DB.prepare(
      'SELECT * FROM vendor_assessment_invitations WHERE organization_assessment_id = ? LIMIT 1'
    ).bind(assessmentId).first();

    if (!invitationResult) {
      return c.json(null);
    }

    return c.json(invitationResult);
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return c.json({ error: 'Failed to fetch invitation' }, 500);
  }
});

/**
 * g) POST /api/vendor-invitations/:invitationId/revoke
 * Revoke magic link token
 * Requires organization authentication
 */
app.post('/:invitationId/revoke', async (c) => {
  const invitationId = c.req.param('invitationId');

  try {
    // Get invitation
    const invitationResult = await c.env.DB.prepare(
      'SELECT * FROM vendor_assessment_invitations WHERE id = ?'
    ).bind(invitationId).first();

    if (!invitationResult) {
      return c.json({ error: 'Invitation not found' }, 404);
    }

    // Check if already revoked
    if (invitationResult.revoked_at) {
      return c.json({ error: 'Invitation already revoked' }, 400);
    }

    // Revoke invitation
    const revokedAt = Date.now();
    const revokedBy = 'DEMO_USER_ID'; // TODO: Replace with actual user ID when auth is implemented

    await c.env.DB.prepare(
      `UPDATE vendor_assessment_invitations
       SET invitation_status = 'revoked', revoked_at = ?, revoked_by = ?,
           session_token = NULL, updated_at = ?
       WHERE id = ?`
    ).bind(revokedAt, revokedBy, Date.now(), invitationId).run();

    // Log audit event
    await logAuditEvent(c, invitationId, 'token_revoked', { revoked_by: revokedBy });

    return c.json({ success: true, revoked_at: revokedAt });
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return c.json({ error: 'Failed to revoke invitation' }, 500);
  }
});

export default app;
