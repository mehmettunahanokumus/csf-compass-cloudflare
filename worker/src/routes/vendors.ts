/**
 * Vendors Routes
 *
 * CRUD endpoints for vendor management:
 * - GET /api/vendors - List vendors
 * - POST /api/vendors - Create vendor
 * - GET /api/vendors/:id - Get vendor details
 * - PATCH /api/vendors/:id - Update vendor
 * - DELETE /api/vendors/:id - Delete vendor
 * - GET /api/vendors/:id/stats - Get vendor statistics
 */

import { Hono } from 'hono';
import { eq, and, count, desc, isNull } from 'drizzle-orm';
import type { Env } from '../types/env';
import { createDbClient } from '../db/client';
import { vendors, assessments } from '../db/schema';
import { TIERING_QUESTIONS, calculateTier } from '../lib/tiering';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /api/vendors?organization_id=xxx
 * List all vendors for an organization
 */
app.get('/', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const organizationId = c.req.query('organization_id');

    if (!organizationId) {
      return c.json({ error: 'organization_id is required' }, 400);
    }

    const groupId = c.req.query('group_id');
    const excludeGrouped = c.req.query('exclude_grouped');

    let vendorList;
    if (groupId) {
      vendorList = await db
        .select()
        .from(vendors)
        .where(
          and(
            eq(vendors.organization_id, organizationId),
            eq(vendors.group_id, groupId)
          )
        )
        .orderBy(desc(vendors.created_at));
    } else if (excludeGrouped === 'true') {
      vendorList = await db
        .select()
        .from(vendors)
        .where(
          and(
            eq(vendors.organization_id, organizationId),
            isNull(vendors.group_id)
          )
        )
        .orderBy(desc(vendors.created_at));
    } else {
      vendorList = await db
        .select()
        .from(vendors)
        .where(eq(vendors.organization_id, organizationId))
        .orderBy(desc(vendors.created_at));
    }

    return c.json(vendorList);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return c.json({ error: 'Failed to fetch vendors' }, 500);
  }
});

/**
 * POST /api/vendors
 * Create a new vendor
 */
app.post('/', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const body = await c.req.json();

    // Validate required fields
    if (!body.organization_id || !body.name) {
      return c.json({ error: 'organization_id and name are required' }, 400);
    }

    // Insert vendor
    const newVendor = await db
      .insert(vendors)
      .values({
        organization_id: body.organization_id,
        name: body.name,
        industry: body.industry,
        website: body.website,
        contact_name: body.contact_name,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        criticality_level: body.criticality_level || 'medium',
        vendor_status: body.vendor_status || 'active',
        notes: body.notes,
        group_id: body.group_id,
        created_by: body.created_by,
      })
      .returning();

    return c.json(newVendor[0], 201);
  } catch (error) {
    console.error('Error creating vendor:', error);
    return c.json({ error: 'Failed to create vendor' }, 500);
  }
});

/**
 * GET /api/vendors/:id
 * Get vendor details
 */
app.get('/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');

    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);

    if (vendor.length === 0) {
      return c.json({ error: 'Vendor not found' }, 404);
    }

    return c.json(vendor[0]);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return c.json({ error: 'Failed to fetch vendor' }, 500);
  }
});

/**
 * PATCH /api/vendors/:id
 * Update vendor
 */
app.patch('/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();

    // Check if vendor exists
    const existing = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Vendor not found' }, 404);
    }

    // Update vendor
    const updated = await db
      .update(vendors)
      .set({
        ...body,
        updated_at: new Date(),
      })
      .where(eq(vendors.id, id))
      .returning();

    return c.json(updated[0]);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return c.json({ error: 'Failed to update vendor' }, 500);
  }
});

/**
 * DELETE /api/vendors/:id
 * Delete vendor (cascade deletes assessments)
 */
app.delete('/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');

    // Check if vendor exists
    const existing = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Vendor not found' }, 404);
    }

    // Delete vendor (cascade will handle assessments)
    await db.delete(vendors).where(eq(vendors.id, id));

    return c.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return c.json({ error: 'Failed to delete vendor' }, 500);
  }
});

/**
 * GET /api/vendors/:id/stats
 * Get vendor statistics (assessment count, latest assessment, etc.)
 */
app.get('/:id/stats', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');

    // Check if vendor exists
    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);

    if (vendor.length === 0) {
      return c.json({ error: 'Vendor not found' }, 404);
    }

    // Count assessments
    const assessmentCount = await db
      .select({ count: count() })
      .from(assessments)
      .where(
        and(
          eq(assessments.vendor_id, id),
          eq(assessments.assessment_type, 'vendor')
        )
      );

    // Get latest assessment
    const latestAssessment = await db
      .select()
      .from(assessments)
      .where(
        and(
          eq(assessments.vendor_id, id),
          eq(assessments.assessment_type, 'vendor')
        )
      )
      .orderBy(desc(assessments.created_at))
      .limit(1);

    return c.json({
      vendor: vendor[0],
      totalAssessments: assessmentCount[0].count,
      latestAssessment: latestAssessment[0] || null,
    });
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    return c.json({ error: 'Failed to fetch vendor stats' }, 500);
  }
});

/**
 * GET /api/vendors/:id/tiering
 * Get vendor's tiering info and the tiering questions list
 */
app.get('/:id/tiering', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');

    const vendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);

    if (vendor.length === 0) {
      return c.json({ error: 'Vendor not found' }, 404);
    }

    const v = vendor[0];
    return c.json({
      vendor: {
        id: v.id,
        name: v.name,
        criticality_level: v.criticality_level,
        tiering_score: v.tiering_score,
        tiering_completed_at: v.tiering_completed_at,
        tiering_answers: v.tiering_answers ? JSON.parse(v.tiering_answers as string) : null,
      },
      questions: TIERING_QUESTIONS,
    });
  } catch (error) {
    console.error('Error fetching vendor tiering:', error);
    return c.json({ error: 'Failed to fetch vendor tiering' }, 500);
  }
});

/**
 * POST /api/vendors/:id/tiering
 * Submit tiering questionnaire answers and calculate tier
 */
app.post('/:id/tiering', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();

    // Validate vendor exists
    const existing = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Vendor not found' }, 404);
    }

    // Validate answers
    const answers: Record<string, number> = body.answers;
    if (!answers || typeof answers !== 'object') {
      return c.json({ error: 'answers object is required' }, 400);
    }

    const questionIds = TIERING_QUESTIONS.map(q => q.id);
    const answerKeys = Object.keys(answers);

    if (answerKeys.length !== 6 || !answerKeys.every(k => questionIds.includes(k))) {
      return c.json({ error: 'answers must contain exactly 6 keys matching tiering question IDs' }, 400);
    }

    for (const val of Object.values(answers)) {
      if (typeof val !== 'number' || val < 1 || val > 4) {
        return c.json({ error: 'Each answer value must be a number between 1 and 4' }, 400);
      }
    }

    // Calculate tier
    const { score, tier } = calculateTier(answers);

    // Update vendor
    const updated = await db
      .update(vendors)
      .set({
        criticality_level: tier,
        tiering_score: score,
        tiering_completed_at: new Date(),
        tiering_answers: JSON.stringify(answers),
        updated_at: new Date(),
      })
      .where(eq(vendors.id, id))
      .returning();

    return c.json(updated[0]);
  } catch (error) {
    console.error('Error updating vendor tiering:', error);
    return c.json({ error: 'Failed to update vendor tiering' }, 500);
  }
});

export default app;
