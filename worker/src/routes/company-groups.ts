/**
 * Company Groups Routes
 *
 * CRUD endpoints for company group management:
 * - GET / - List groups
 * - POST / - Create group
 * - GET /:id - Get group details + member vendors
 * - PATCH /:id - Update group
 * - DELETE /:id - Delete group
 * - GET /:id/summary - Group summary with scores per vendor
 */

import { Hono } from 'hono';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { Env } from '../types/env';
import { createDbClient } from '../db/client';
import {
  company_groups,
  vendors,
  assessments,
  assessment_items,
  csf_subcategories,
  csf_categories,
  csf_functions,
} from '../db/schema';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /?organization_id=xxx
 * List all company groups for an organization
 */
app.get('/', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const organizationId = c.req.query('organization_id');

    if (!organizationId) {
      return c.json({ error: 'organization_id is required' }, 400);
    }

    const groups = await db
      .select()
      .from(company_groups)
      .where(eq(company_groups.organization_id, organizationId))
      .orderBy(desc(company_groups.created_at));

    // For each group, get vendor count
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const vendorCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(vendors)
          .where(eq(vendors.group_id, group.id));
        return { ...group, vendor_count: vendorCount[0]?.count ?? 0 };
      })
    );

    return c.json(groupsWithCounts);
  } catch (error) {
    console.error('Error fetching company groups:', error);
    return c.json({ error: 'Failed to fetch company groups' }, 500);
  }
});

/**
 * POST /
 * Create a new company group
 */
app.post('/', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const body = await c.req.json();

    if (!body.organization_id || !body.name) {
      return c.json({ error: 'organization_id and name are required' }, 400);
    }

    const now = new Date();
    const newGroup = await db
      .insert(company_groups)
      .values({
        organization_id: body.organization_id,
        name: body.name,
        description: body.description || null,
        industry: body.industry || null,
        logo_url: body.logo_url || null,
        created_at: now,
        updated_at: now,
      })
      .returning();

    return c.json(newGroup[0], 201);
  } catch (error) {
    console.error('Error creating company group:', error);
    return c.json({ error: 'Failed to create company group' }, 500);
  }
});

/**
 * GET /:id
 * Get company group details with member vendors
 */
app.get('/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const groupId = c.req.param('id');

    const group = await db
      .select()
      .from(company_groups)
      .where(eq(company_groups.id, groupId))
      .limit(1);

    if (!group.length) {
      return c.json({ error: 'Company group not found' }, 404);
    }

    const memberVendors = await db
      .select()
      .from(vendors)
      .where(eq(vendors.group_id, groupId))
      .orderBy(vendors.name);

    return c.json({ ...group[0], vendors: memberVendors });
  } catch (error) {
    console.error('Error fetching company group:', error);
    return c.json({ error: 'Failed to fetch company group' }, 500);
  }
});

/**
 * PATCH /:id
 * Update a company group
 */
app.patch('/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const groupId = c.req.param('id');
    const body = await c.req.json();

    const updated = await db
      .update(company_groups)
      .set({
        name: body.name,
        description: body.description,
        industry: body.industry,
        logo_url: body.logo_url,
        risk_level: body.risk_level,
        primary_contact: body.primary_contact,
        updated_at: new Date(),
      })
      .where(eq(company_groups.id, groupId))
      .returning();

    if (!updated.length) {
      return c.json({ error: 'Company group not found' }, 404);
    }

    return c.json(updated[0]);
  } catch (error) {
    console.error('Error updating company group:', error);
    return c.json({ error: 'Failed to update company group' }, 500);
  }
});

/**
 * DELETE /:id
 * Delete a company group (vendors will have group_id set to null)
 */
app.delete('/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const groupId = c.req.param('id');

    const deleted = await db
      .delete(company_groups)
      .where(eq(company_groups.id, groupId))
      .returning();

    if (!deleted.length) {
      return c.json({ error: 'Company group not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting company group:', error);
    return c.json({ error: 'Failed to delete company group' }, 500);
  }
});

/**
 * GET /:id/summary
 * Get group summary: each vendor's latest assessment score + function breakdown
 */
app.get('/:id/summary', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const groupId = c.req.param('id');

    const group = await db
      .select()
      .from(company_groups)
      .where(eq(company_groups.id, groupId))
      .limit(1);

    if (!group.length) {
      return c.json({ error: 'Company group not found' }, 404);
    }

    const memberVendors = await db
      .select()
      .from(vendors)
      .where(eq(vendors.group_id, groupId))
      .orderBy(vendors.name);

    // Get all CSF functions for column headers
    const csfFunctions = await db
      .select()
      .from(csf_functions)
      .orderBy(csf_functions.sort_order);

    // For each vendor, get latest assessment and function scores
    const vendorSummaries = await Promise.all(
      memberVendors.map(async (vendor) => {
        // Get latest completed assessment for this vendor
        const latestAssessment = await db
          .select()
          .from(assessments)
          .where(
            and(
              eq(assessments.vendor_id, vendor.id),
              eq(assessments.assessment_type, 'vendor')
            )
          )
          .orderBy(desc(assessments.created_at))
          .limit(1);

        if (!latestAssessment.length) {
          return {
            vendor,
            latest_assessment: null,
            function_scores: {},
            overall_score: null,
          };
        }

        const assessment = latestAssessment[0];

        // Get items with function info for this assessment
        const items = await db
          .select({
            status: assessment_items.status,
            function_id: csf_functions.id,
            function_name: csf_functions.name,
          })
          .from(assessment_items)
          .innerJoin(csf_subcategories, eq(assessment_items.subcategory_id, csf_subcategories.id))
          .innerJoin(csf_categories, eq(csf_subcategories.category_id, csf_categories.id))
          .innerJoin(csf_functions, eq(csf_categories.function_id, csf_functions.id))
          .where(eq(assessment_items.assessment_id, assessment.id));

        // Calculate score per function
        const functionScores: Record<string, { score: number; total: number; met: number }> = {};
        for (const item of items) {
          if (!functionScores[item.function_id]) {
            functionScores[item.function_id] = { score: 0, total: 0, met: 0 };
          }
          const fs = functionScores[item.function_id];
          fs.total++;
          if (item.status === 'compliant') fs.met += 1;
          else if (item.status === 'partial') fs.met += 0.5;
        }

        // Convert to percentage
        const functionScoresPct: Record<string, number> = {};
        for (const [fnId, fs] of Object.entries(functionScores)) {
          functionScoresPct[fnId] = fs.total > 0 ? Math.round((fs.met / fs.total) * 100) : 0;
        }

        return {
          vendor,
          latest_assessment: assessment,
          function_scores: functionScoresPct,
          overall_score: assessment.overall_score,
        };
      })
    );

    return c.json({
      group: group[0],
      csf_functions: csfFunctions,
      vendors: vendorSummaries,
    });
  } catch (error) {
    console.error('Error fetching group summary:', error);
    return c.json({ error: 'Failed to fetch group summary' }, 500);
  }
});

export default app;
