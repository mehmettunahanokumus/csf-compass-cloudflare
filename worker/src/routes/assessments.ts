/**
 * Assessments Routes
 *
 * CRUD endpoints for assessment management:
 * - GET /api/assessments - List assessments
 * - POST /api/assessments - Create assessment
 * - GET /api/assessments/:id - Get assessment details
 * - PATCH /api/assessments/:id - Update assessment
 * - DELETE /api/assessments/:id - Delete assessment
 * - GET /api/assessments/:id/items - Get assessment items with subcategories
 * - PATCH /api/assessments/:id/items/:itemId - Update assessment item
 * - POST /api/assessments/:id/calculate-score - Recalculate assessment score
 */

import { Hono } from 'hono';
import { eq, and, desc, inArray } from 'drizzle-orm';
import type { Env } from '../types/env';
import { createDbClient } from '../db/client';
import {
  assessments,
  assessment_items,
  csf_subcategories,
  csf_categories,
  csf_functions,
  wizard_progress,
  vendors,
  evidence_files,
  vendor_assessment_invitations,
  vendor_audit_log,
  ai_analysis_logs,
  gap_recommendations,
  executive_summaries,
} from '../db/schema';
import { updateAssessmentScore, getAssessmentStats } from '../lib/scoring';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /compare?ids=id1,id2
 * Compare two assessments item by item
 */
app.get('/compare', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const idsParam = c.req.query('ids');

    if (!idsParam) {
      return c.json({ error: 'ids query parameter is required (comma-separated)' }, 400);
    }

    const ids = idsParam.split(',').map(id => id.trim()).filter(Boolean);
    if (ids.length < 2) {
      return c.json({ error: 'At least 2 assessment IDs required' }, 400);
    }

    // Get both assessments
    const assessment1 = await db.select().from(assessments).where(eq(assessments.id, ids[0])).limit(1);
    const assessment2 = await db.select().from(assessments).where(eq(assessments.id, ids[1])).limit(1);

    if (!assessment1.length || !assessment2.length) {
      return c.json({ error: 'One or more assessments not found' }, 404);
    }

    // Get items for assessment 1
    const items1 = await db
      .select({
        subcategory_id: assessment_items.subcategory_id,
        status: assessment_items.status,
        notes: assessment_items.notes,
        subcategory_name: csf_subcategories.name,
        category_id: csf_categories.id,
        category_name: csf_categories.name,
        function_id: csf_functions.id,
        function_name: csf_functions.name,
      })
      .from(assessment_items)
      .innerJoin(csf_subcategories, eq(assessment_items.subcategory_id, csf_subcategories.id))
      .innerJoin(csf_categories, eq(csf_subcategories.category_id, csf_categories.id))
      .innerJoin(csf_functions, eq(csf_categories.function_id, csf_functions.id))
      .where(eq(assessment_items.assessment_id, ids[0]));

    // Get items for assessment 2
    const items2 = await db
      .select({
        subcategory_id: assessment_items.subcategory_id,
        status: assessment_items.status,
        notes: assessment_items.notes,
      })
      .from(assessment_items)
      .where(eq(assessment_items.assessment_id, ids[1]));

    // Build comparison
    const items2Map: Record<string, string> = {};
    for (const item of items2) {
      items2Map[item.subcategory_id] = item.status ?? 'not_assessed';
    }

    const statusScore = (s: string | null) => {
      if (s === 'compliant') return 1;
      if (s === 'partial') return 0.5;
      return 0;
    };

    const comparison = items1.map(item => {
      const status1 = item.status ?? 'not_assessed';
      const status2 = items2Map[item.subcategory_id] ?? 'not_assessed';
      const delta = statusScore(status2) - statusScore(status1);

      return {
        subcategory_id: item.subcategory_id,
        subcategory_name: item.subcategory_name,
        category_id: item.category_id,
        category_name: item.category_name,
        function_id: item.function_id,
        function_name: item.function_name,
        assessment1_status: status1,
        assessment2_status: status2,
        delta, // positive = improved, negative = declined, 0 = same
        changed: status1 !== status2,
      };
    });

    const improved = comparison.filter(c => c.delta > 0).length;
    const declined = comparison.filter(c => c.delta < 0).length;
    const unchanged = comparison.filter(c => c.delta === 0).length;

    return c.json({
      assessment1: assessment1[0],
      assessment2: assessment2[0],
      score_delta: (assessment2[0].overall_score ?? 0) - (assessment1[0].overall_score ?? 0),
      summary: { improved, declined, unchanged, total: comparison.length },
      items: comparison,
    });
  } catch (error) {
    console.error('Error comparing assessments:', error);
    return c.json({ error: 'Failed to compare assessments' }, 500);
  }
});

/**
 * GET /api/assessments?organization_id=xxx&type=organization
 * List assessments for an organization
 */
app.get('/', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const organizationId = c.req.query('organization_id');
    const type = c.req.query('type'); // organization or vendor

    if (!organizationId) {
      return c.json({ error: 'organization_id is required' }, 400);
    }

    let query = db
      .select()
      .from(assessments)
      .where(eq(assessments.organization_id, organizationId))
      .orderBy(desc(assessments.created_at));

    // Filter by type if provided
    if (type) {
      query = query.where(
        and(
          eq(assessments.organization_id, organizationId),
          eq(assessments.assessment_type, type)
        )
      ) as any;
    }

    const assessmentList = await query;

    // Batch-fetch vendors for all assessments that have a vendor_id
    const vendorIds = [
      ...new Set(
        assessmentList.map(a => a.vendor_id).filter((id): id is string => !!id)
      ),
    ];
    const vendorMap: Record<string, typeof vendors.$inferSelect> = {};
    if (vendorIds.length > 0) {
      const vendorList = await db
        .select()
        .from(vendors)
        .where(inArray(vendors.id, vendorIds));
      for (const v of vendorList) {
        vendorMap[v.id] = v;
      }
    }

    const result = assessmentList.map(a => ({
      ...a,
      vendor: a.vendor_id ? (vendorMap[a.vendor_id] ?? null) : null,
    }));

    return c.json(result);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return c.json({ error: 'Failed to fetch assessments' }, 500);
  }
});

/**
 * POST /api/assessments
 * Create a new assessment
 * Automatically creates 120 assessment items (one per subcategory)
 * Automatically creates 15 wizard progress records
 */
app.post('/', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const body = await c.req.json();

    // Validate required fields
    if (!body.organization_id || !body.name) {
      return c.json({ error: 'organization_id and name are required' }, 400);
    }

    // Validate vendor assessment has vendor_id
    if (body.assessment_type === 'vendor' && !body.vendor_id) {
      return c.json({ error: 'vendor_id is required for vendor assessments' }, 400);
    }

    // Create assessment
    const newAssessment = await db
      .insert(assessments)
      .values({
        organization_id: body.organization_id,
        assessment_type: body.assessment_type || 'organization',
        vendor_id: body.vendor_id,
        template_id: body.template_id,
        name: body.name,
        description: body.description,
        status: body.status || 'draft',
        created_by: body.created_by,
        started_at: body.started_at ? new Date(body.started_at) : undefined,
      })
      .returning();

    const assessmentId = newAssessment[0].id;

    // Determine subcategories and evidence requirement based on assessment type
    let subcategories: { id: string }[];
    let evidenceRequired = 0;

    if (body.assessment_type === 'vendor' && body.vendor_id) {
      // Fetch vendor's criticality level
      const vendorResult = await db
        .select({ criticality_level: vendors.criticality_level })
        .from(vendors)
        .where(eq(vendors.id, body.vendor_id))
        .limit(1);

      const critLevel = vendorResult.length > 0 ? vendorResult[0].criticality_level : 'medium';
      evidenceRequired = ['high', 'critical'].includes(critLevel || '') ? 1 : 0;

      // Fetch subcategories filtered by tier
      const filteredSubs = await c.env.DB.prepare(
        `SELECT id FROM csf_subcategories WHERE CASE min_tier WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 WHEN 'critical' THEN 4 END <= CASE ? WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 WHEN 'critical' THEN 4 END ORDER BY sort_order`
      ).bind(critLevel || 'medium').all();

      subcategories = (filteredSubs.results || []) as { id: string }[];
    } else {
      // Organization assessment: all subcategories, no evidence required
      subcategories = await db.select({ id: csf_subcategories.id }).from(csf_subcategories);
      evidenceRequired = 0;
    }

    // Create assessment items using raw SQL to avoid Drizzle expanding all columns
    // Insert in batches to stay under D1's 100 bound parameter limit
    const batchSize = 19; // 5 columns × 19 rows = 95 variables (safe under 100)

    for (let i = 0; i < subcategories.length; i += batchSize) {
      const batch = subcategories.slice(i, i + batchSize);
      const values = batch.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const params: (string | number)[] = [];

      batch.forEach((sub) => {
        params.push(crypto.randomUUID(), assessmentId, sub.id, 'not_assessed', evidenceRequired);
      });

      await c.env.DB.prepare(
        `INSERT INTO assessment_items (id, assessment_id, subcategory_id, status, evidence_required) VALUES ${values}`
      ).bind(...params).run();
    }

    // Create wizard progress records (15 steps)
    const wizardSteps = [
      { step: 1, name: 'Governance' },
      { step: 2, name: 'Microsoft Entra ID' },
      { step: 3, name: 'Microsoft Defender' },
      { step: 4, name: 'AWS Configuration' },
      { step: 5, name: 'Network Security' },
      { step: 6, name: 'Endpoint Protection' },
      { step: 7, name: 'Data Protection' },
      { step: 8, name: 'Identity & Access Management' },
      { step: 9, name: 'Security Monitoring' },
      { step: 10, name: 'Incident Response' },
      { step: 11, name: 'Backup & Recovery' },
      { step: 12, name: 'Vulnerability Management' },
      { step: 13, name: 'Third-Party Risk' },
      { step: 14, name: 'Security Training' },
      { step: 15, name: 'Business Continuity' },
    ];

    // Create wizard progress using raw SQL
    // SQLite uses 0/1 for boolean, not true/false
    const wizardValues = wizardSteps.map(() => '(?, ?, ?, ?, 0)').join(', ');
    const wizardParams: (string | number)[] = [];

    wizardSteps.forEach((step) => {
      wizardParams.push(crypto.randomUUID(), assessmentId, step.step, step.name);
    });

    await c.env.DB.prepare(
      `INSERT INTO wizard_progress (id, assessment_id, step_number, step_name, is_complete) VALUES ${wizardValues}`
    ).bind(...wizardParams).run();

    return c.json(newAssessment[0], 201);
  } catch (error) {
    console.error('Error creating assessment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    return c.json({
      error: 'Failed to create assessment',
      details: errorMessage
    }, 500);
  }
});

/**
 * GET /api/assessments/:id
 * Get assessment details with related data
 */
app.get('/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');

    const assessment = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1);

    if (assessment.length === 0) {
      return c.json({ error: 'Assessment not found' }, 404);
    }

    // Get vendor info if vendor assessment
    let vendorInfo = null;
    if (assessment[0].vendor_id) {
      const vendor = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, assessment[0].vendor_id))
        .limit(1);
      vendorInfo = vendor[0] || null;
    }

    // Get statistics
    const stats = await getAssessmentStats(db, id);

    return c.json({
      ...assessment[0],
      vendor: vendorInfo,
      stats,
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return c.json({ error: 'Failed to fetch assessment' }, 500);
  }
});

/**
 * PATCH /api/assessments/:id
 * Update assessment
 */
app.patch('/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');
    const body = await c.req.json();

    const existing = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Assessment not found' }, 404);
    }

    // Update assessment
    const updated = await db
      .update(assessments)
      .set({
        ...body,
        started_at: body.started_at ? new Date(body.started_at) : undefined,
        completed_at: body.completed_at ? new Date(body.completed_at) : undefined,
        updated_at: new Date(),
      })
      .where(eq(assessments.id, id))
      .returning();

    return c.json(updated[0]);
  } catch (error) {
    console.error('Error updating assessment:', error);
    return c.json({ error: 'Failed to update assessment' }, 500);
  }
});

/**
 * DELETE /api/assessments/:id
 * Delete assessment (cascade deletes items, progress, evidence)
 */
app.delete('/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');

    const existing = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Assessment not found' }, 404);
    }

    // Explicitly delete all related records since D1 does not enforce
    // PRAGMA foreign_keys by default, so ON DELETE CASCADE won't fire.

    // 1. Delete audit logs for invitations linked to this assessment
    const invitations = await db
      .select({ id: vendor_assessment_invitations.id })
      .from(vendor_assessment_invitations)
      .where(eq(vendor_assessment_invitations.organization_assessment_id, id));

    if (invitations.length > 0) {
      const invitationIds = invitations.map(inv => inv.id);
      await db.delete(vendor_audit_log).where(inArray(vendor_audit_log.invitation_id, invitationIds));
    }

    // 2. Delete vendor assessment invitations
    await db.delete(vendor_assessment_invitations).where(eq(vendor_assessment_invitations.organization_assessment_id, id));

    // 3. Delete evidence files
    await db.delete(evidence_files).where(eq(evidence_files.assessment_id, id));

    // 4. Delete AI analysis logs
    await db.delete(ai_analysis_logs).where(eq(ai_analysis_logs.assessment_id, id));

    // 5. Delete gap recommendations
    await db.delete(gap_recommendations).where(eq(gap_recommendations.assessment_id, id));

    // 6. Delete executive summaries
    await db.delete(executive_summaries).where(eq(executive_summaries.assessment_id, id));

    // 7. Delete wizard progress
    await db.delete(wizard_progress).where(eq(wizard_progress.assessment_id, id));

    // 8. Delete assessment items
    await db.delete(assessment_items).where(eq(assessment_items.assessment_id, id));

    // 9. Finally delete the assessment itself
    await db.delete(assessments).where(eq(assessments.id, id));

    return c.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return c.json({ error: 'Failed to delete assessment' }, 500);
  }
});

/**
 * GET /api/assessments/:id/items?functionId=GV
 * Get assessment items with subcategory details
 * Optional query param: functionId - Filter by CSF function
 */
app.get('/:id/items', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');
    const functionId = c.req.query('functionId');

    // Verify assessment exists
    const assessment = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1);

    if (assessment.length === 0) {
      return c.json({ error: 'Assessment not found' }, 404);
    }

    // Get assessment items with subcategory, category, and function info
    let query = db
      .select({
        id: assessment_items.id,
        assessment_id: assessment_items.assessment_id,
        subcategory_id: assessment_items.subcategory_id,
        status: assessment_items.status,
        notes: assessment_items.notes,
        evidence_summary: assessment_items.evidence_summary,
        ai_suggested_status: assessment_items.ai_suggested_status,
        ai_confidence_score: assessment_items.ai_confidence_score,
        ai_reasoning: assessment_items.ai_reasoning,
        ai_analyzed_at: assessment_items.ai_analyzed_at,
        created_at: assessment_items.created_at,
        updated_at: assessment_items.updated_at,
        subcategory: {
          id: csf_subcategories.id,
          name: csf_subcategories.name,
          description: csf_subcategories.description,
          name_tr: csf_subcategories.name_tr,
          description_tr: csf_subcategories.description_tr,
          priority: csf_subcategories.priority,
          category_id: csf_subcategories.category_id,
        },
        category: {
          id: csf_categories.id,
          name: csf_categories.name,
          name_tr: csf_categories.name_tr,
          function_id: csf_categories.function_id,
        },
        function: {
          id: csf_functions.id,
          name: csf_functions.name,
          name_tr: csf_functions.name_tr,
        },
      })
      .from(assessment_items)
      .innerJoin(csf_subcategories, eq(assessment_items.subcategory_id, csf_subcategories.id))
      .innerJoin(csf_categories, eq(csf_subcategories.category_id, csf_categories.id))
      .innerJoin(csf_functions, eq(csf_categories.function_id, csf_functions.id))
      .where(eq(assessment_items.assessment_id, id))
      .orderBy(csf_subcategories.sort_order);

    // Filter by function if provided
    if (functionId) {
      query = query.where(
        and(
          eq(assessment_items.assessment_id, id),
          eq(csf_functions.id, functionId)
        )
      ) as any;
    }

    const items = await query;

    return c.json(items);
  } catch (error) {
    console.error('Error fetching assessment items:', error);
    return c.json({ error: 'Failed to fetch assessment items' }, 500);
  }
});

/**
 * PATCH /api/assessments/:id/items/:itemId
 * Update assessment item (status, notes, etc.)
 */
app.patch('/:id/items/:itemId', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const assessmentId = c.req.param('id');
    const itemId = c.req.param('itemId');
    const body = await c.req.json();

    // Check if item exists
    const existing = await db
      .select()
      .from(assessment_items)
      .where(
        and(
          eq(assessment_items.id, itemId),
          eq(assessment_items.assessment_id, assessmentId)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      return c.json({ error: 'Assessment item not found' }, 404);
    }

    // Block editing vendor self-assessment items from the org side
    const parentAssessment = await db
      .select({ assessment_type: assessments.assessment_type })
      .from(assessments)
      .where(eq(assessments.id, assessmentId))
      .limit(1);

    if (parentAssessment.length > 0 && parentAssessment[0].assessment_type === 'vendor') {
      const linkedInvitation = await db
        .select({ id: vendor_assessment_invitations.id })
        .from(vendor_assessment_invitations)
        .where(eq(vendor_assessment_invitations.vendor_self_assessment_id, assessmentId))
        .limit(1);

      if (linkedInvitation.length > 0) {
        return c.json({ error: 'Cannot modify vendor self-assessment responses' }, 403);
      }
    }

    // Update item
    const updated = await db
      .update(assessment_items)
      .set({
        ...body,
        updated_at: new Date(),
      })
      .where(eq(assessment_items.id, itemId))
      .returning();

    // Recalculate assessment score if status changed
    if (body.status) {
      await updateAssessmentScore(db, assessmentId);
    }

    return c.json(updated[0]);
  } catch (error) {
    console.error('Error updating assessment item:', error);
    return c.json({ error: 'Failed to update assessment item' }, 500);
  }
});

/**
 * POST /api/assessments/:id/calculate-score
 * Manually trigger score recalculation
 */
app.post('/:id/calculate-score', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');

    const score = await updateAssessmentScore(db, id);

    return c.json({ score });
  } catch (error) {
    console.error('Error calculating score:', error);
    return c.json({ error: 'Failed to calculate score' }, 500);
  }
});

export default app;
