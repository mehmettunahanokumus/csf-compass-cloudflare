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
import { eq, and, desc } from 'drizzle-orm';
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
} from '../db/schema';
import { updateAssessmentScore, getAssessmentStats } from '../lib/scoring';

const app = new Hono<{ Bindings: Env }>();

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

    return c.json(assessmentList);
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

    // Get all subcategories
    const subcategories = await db.select({ id: csf_subcategories.id }).from(csf_subcategories);

    // Create assessment items using raw SQL to avoid Drizzle expanding all columns
    // Insert in batches to stay under SQLite's 999 variable limit
    const batchSize = 25; // 4 columns × 25 rows = 100 variables (very safe)

    for (let i = 0; i < subcategories.length; i += batchSize) {
      const batch = subcategories.slice(i, i + batchSize);
      const values = batch.map(() => '(?, ?, ?, ?)').join(', ');
      const params: string[] = [];

      batch.forEach((sub) => {
        params.push(crypto.randomUUID(), assessmentId, sub.id, 'not_assessed');
      });

      await c.env.DB.prepare(
        `INSERT INTO assessment_items (id, assessment_id, subcategory_id, status) VALUES ${values}`
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
          priority: csf_subcategories.priority,
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
