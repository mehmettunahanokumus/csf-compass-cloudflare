/**
 * Import Routes
 *
 * Excel import flow (browser-side parsing):
 * - POST /preview - Validate and preview import data
 * - POST /confirm - Execute the import
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Env } from '../types/env';
import { createDbClient } from '../db/client';
import {
  company_groups,
  vendors,
  assessments,
  assessment_items,
  csf_subcategories,
} from '../db/schema';
import { updateAssessmentScore } from '../lib/scoring';

const app = new Hono<{ Bindings: Env }>();

interface ImportItem {
  subcategory_id: string;
  status: string; // compliant, partial, non_compliant, not_assessed
  notes?: string;
}

interface ImportCompany {
  name: string;
  items: ImportItem[];
}

interface ImportPayload {
  organization_id: string;
  group_name: string;
  group_description?: string;
  companies: ImportCompany[];
  assessment_name: string;
  assessment_date?: string; // ISO date string
}

/**
 * POST /preview
 * Validate import data and return preview (no DB writes)
 */
app.post('/preview', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const body: ImportPayload = await c.req.json();

    if (!body.organization_id || !body.group_name || !body.companies?.length) {
      return c.json({ error: 'organization_id, group_name, and companies are required' }, 400);
    }

    // Get all valid subcategory IDs
    const allSubcategories = await db.select({ id: csf_subcategories.id }).from(csf_subcategories);
    const validSubcategoryIds = new Set(allSubcategories.map(s => s.id));

    const preview = {
      group_name: body.group_name,
      company_count: body.companies.length,
      assessment_name: body.assessment_name,
      companies: body.companies.map(company => {
        const validItems = company.items.filter(item => validSubcategoryIds.has(item.subcategory_id));
        const invalidItems = company.items.filter(item => !validSubcategoryIds.has(item.subcategory_id));

        const statusCounts = {
          compliant: validItems.filter(i => i.status === 'compliant').length,
          partial: validItems.filter(i => i.status === 'partial').length,
          non_compliant: validItems.filter(i => i.status === 'non_compliant').length,
          not_assessed: validItems.filter(i => i.status === 'not_assessed').length,
        };

        const metItems = statusCounts.compliant + (statusCounts.partial * 0.5);
        const estimatedScore = validItems.length > 0
          ? Math.round((metItems / validItems.length) * 100)
          : 0;

        return {
          name: company.name,
          valid_items: validItems.length,
          invalid_subcategory_ids: invalidItems.map(i => i.subcategory_id),
          status_counts: statusCounts,
          estimated_score: estimatedScore,
        };
      }),
      warnings: [] as string[],
    };

    return c.json(preview);
  } catch (error) {
    console.error('Error previewing import:', error);
    return c.json({ error: 'Failed to preview import' }, 500);
  }
});

/**
 * POST /confirm
 * Execute the import: create group + vendors + assessments + items
 */
app.post('/confirm', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const body: ImportPayload = await c.req.json();

    if (!body.organization_id || !body.group_name || !body.companies?.length) {
      return c.json({ error: 'organization_id, group_name, and companies are required' }, 400);
    }

    // Get all subcategories for validation
    const allSubcategories = await db.select({ id: csf_subcategories.id }).from(csf_subcategories);
    const validSubcategoryIds = new Set(allSubcategories.map(s => s.id));

    const now = new Date();
    const assessmentDate = body.assessment_date ? new Date(body.assessment_date) : now;

    // 1. Create company group
    const newGroup = await db
      .insert(company_groups)
      .values({
        organization_id: body.organization_id,
        name: body.group_name,
        description: body.group_description || null,
        created_at: now,
        updated_at: now,
      })
      .returning();

    const groupId = newGroup[0].id;
    const results = [];

    // 2. For each company: create vendor + assessment + items
    for (const company of body.companies) {
      // Create vendor
      const newVendor = await db
        .insert(vendors)
        .values({
          organization_id: body.organization_id,
          name: company.name,
          group_id: groupId,
          criticality_level: 'medium',
          vendor_status: 'active',
        })
        .returning();

      const vendorId = newVendor[0].id;

      // Create assessment
      const newAssessment = await db
        .insert(assessments)
        .values({
          organization_id: body.organization_id,
          vendor_id: vendorId,
          assessment_type: 'vendor',
          name: body.assessment_name,
          status: 'completed',
          overall_score: 0,
          started_at: assessmentDate,
          completed_at: assessmentDate,
        })
        .returning();

      const assessmentId = newAssessment[0].id;

      // Filter valid items
      const validItems = company.items.filter(item => validSubcategoryIds.has(item.subcategory_id));

      // Batch insert assessment items (25 per batch - SQLite 999 variable limit)
      const BATCH_SIZE = 25;
      for (let i = 0; i < validItems.length; i += BATCH_SIZE) {
        const batch = validItems.slice(i, i + BATCH_SIZE);
        await db.insert(assessment_items).values(
          batch.map(item => ({
            assessment_id: assessmentId,
            subcategory_id: item.subcategory_id,
            status: item.status,
            notes: item.notes || null,
          }))
        );
      }

      // Calculate and update score
      await updateAssessmentScore(db, assessmentId);

      // Get final assessment with score
      const finalAssessment = await db
        .select()
        .from(assessments)
        .where(eq(assessments.id, assessmentId))
        .limit(1);

      results.push({
        vendor_id: vendorId,
        vendor_name: company.name,
        assessment_id: assessmentId,
        items_imported: validItems.length,
        overall_score: finalAssessment[0]?.overall_score ?? 0,
      });
    }

    return c.json({
      success: true,
      group_id: groupId,
      group_name: body.group_name,
      companies_imported: results.length,
      results,
    }, 201);
  } catch (error) {
    console.error('Error confirming import:', error);
    return c.json({ error: 'Failed to execute import' }, 500);
  }
});

export default app;
