/**
 * Assessment Cloning for Vendor Self-Assessments
 *
 * Clones an organization's assessment for vendor to complete independently.
 * Uses batch inserts to avoid SQLite's 999 variable limit.
 */

import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { assessments, assessment_items, csf_subcategories } from '../db/schema';

/**
 * Clone organization's assessment for vendor self-assessment
 *
 * Creates:
 * - New assessment with "[Vendor Response]" prefix
 * - All 106-120 assessment_items with status reset to 'not_assessed'
 * - Wizard progress (15 steps, all incomplete)
 * - Bidirectional linked_assessment_id on both assessments
 *
 * @param db - Drizzle DB client
 * @param d1Binding - Raw D1 binding for batch inserts
 * @param originalAssessmentId - ID of the organization's assessment
 * @param organizationId - Organization ID
 * @returns ID of the cloned vendor self-assessment
 */
export async function cloneAssessmentForVendor(
  db: DrizzleD1Database,
  d1Binding: D1Database,
  originalAssessmentId: string,
  organizationId: string
): Promise<string> {
  // 1. Get original assessment
  const originalAssessment = await db
    .select()
    .from(assessments)
    .where(eq(assessments.id, originalAssessmentId))
    .limit(1);

  if (originalAssessment.length === 0) {
    throw new Error('Original assessment not found');
  }

  const original = originalAssessment[0];

  // 2. Create new assessment with "[Vendor Response]" prefix
  const clonedAssessment = await db
    .insert(assessments)
    .values({
      organization_id: organizationId,
      assessment_type: original.assessment_type,
      vendor_id: original.vendor_id,
      name: `[Vendor Response] ${original.name}`,
      description: original.description,
      status: 'draft', // Fresh start
      overall_score: 0.00, // Recalculated as vendor completes
    })
    .returning();

  const clonedAssessmentId = clonedAssessment[0].id;

  // 3. Clone all assessment_items with status reset to 'not_assessed'
  // Get all subcategories (same as original assessment)
  const subcategories = await db.select({ id: csf_subcategories.id }).from(csf_subcategories);

  // Insert in batches to avoid SQLite's 999 variable limit
  const batchSize = 25; // 4 columns × 25 rows = 100 variables (safe)

  for (let i = 0; i < subcategories.length; i += batchSize) {
    const batch = subcategories.slice(i, i + batchSize);
    const values = batch.map(() => '(?, ?, ?, ?)').join(', ');
    const params: string[] = [];

    batch.forEach((sub) => {
      params.push(
        crypto.randomUUID(),
        clonedAssessmentId,
        sub.id,
        'not_assessed' // Reset status - vendor provides fresh assessment
      );
    });

    await d1Binding.prepare(
      `INSERT INTO assessment_items (id, assessment_id, subcategory_id, status) VALUES ${values}`
    ).bind(...params).run();
  }

  // 4. Create wizard progress (15 steps, all incomplete)
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

  // Create wizard progress using raw SQL (SQLite uses 0/1 for boolean)
  const wizardValues = wizardSteps.map(() => '(?, ?, ?, ?, 0)').join(', ');
  const wizardParams: (string | number)[] = [];

  wizardSteps.forEach((step) => {
    wizardParams.push(crypto.randomUUID(), clonedAssessmentId, step.step, step.name);
  });

  await d1Binding.prepare(
    `INSERT INTO wizard_progress (id, assessment_id, step_number, step_name, is_complete) VALUES ${wizardValues}`
  ).bind(...wizardParams).run();

  // 5. Set bidirectional linked_assessment_id on both assessments
  await db
    .update(assessments)
    .set({ linked_assessment_id: clonedAssessmentId })
    .where(eq(assessments.id, originalAssessmentId));

  await db
    .update(assessments)
    .set({ linked_assessment_id: originalAssessmentId })
    .where(eq(assessments.id, clonedAssessmentId));

  return clonedAssessmentId;
}
