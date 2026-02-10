/**
 * Assessment Scoring Logic
 *
 * Replaces PostgreSQL stored procedure calculate_assessment_score()
 *
 * Score Calculation:
 * - compliant items: full score (1.0)
 * - partial items: half score (0.5)
 * - non_compliant items: no score (0.0)
 * - not_assessed items: no score (0.0)
 * - not_applicable items: excluded from calculation
 *
 * Formula: (compliant + partial * 0.5) / total * 100
 */

import { eq } from 'drizzle-orm';
import type { DbClient } from '../db/client';
import { assessment_items, assessments } from '../db/schema';

/**
 * Calculate overall score for an assessment
 *
 * @param db - Database client
 * @param assessmentId - Assessment ID
 * @returns Overall score (0-100) or null if no items to score
 */
export async function calculateAssessmentScore(
  db: DbClient,
  assessmentId: string
): Promise<number> {
  // Get all assessment items for this assessment
  const items = await db
    .select({
      status: assessment_items.status,
    })
    .from(assessment_items)
    .where(eq(assessment_items.assessment_id, assessmentId));

  // Filter out not_applicable items
  const scorableItems = items.filter(item => item.status !== 'not_applicable');

  // If no items to score, return 0
  if (scorableItems.length === 0) {
    return 0.00;
  }

  // Count compliant and partial items
  const compliantCount = scorableItems.filter(item => item.status === 'compliant').length;
  const partialCount = scorableItems.filter(item => item.status === 'partial').length;

  // Calculate score: (compliant + partial * 0.5) / total * 100
  const score = ((compliantCount + (partialCount * 0.5)) / scorableItems.length) * 100;

  // Round to 2 decimal places
  return Math.round(score * 100) / 100;
}

/**
 * Update assessment overall score
 *
 * @param db - Database client
 * @param assessmentId - Assessment ID
 * @returns Updated score
 */
export async function updateAssessmentScore(
  db: DbClient,
  assessmentId: string
): Promise<number> {
  const score = await calculateAssessmentScore(db, assessmentId);

  // Update assessment with new score
  await db
    .update(assessments)
    .set({
      overall_score: score,
      updated_at: new Date(),
    })
    .where(eq(assessments.id, assessmentId));

  return score;
}

/**
 * Get assessment completion statistics
 *
 * @param db - Database client
 * @param assessmentId - Assessment ID
 * @returns Statistics object
 */
export async function getAssessmentStats(
  db: DbClient,
  assessmentId: string
) {
  const items = await db
    .select({
      status: assessment_items.status,
    })
    .from(assessment_items)
    .where(eq(assessment_items.assessment_id, assessmentId));

  const total = items.length;
  const compliant = items.filter(item => item.status === 'compliant').length;
  const partial = items.filter(item => item.status === 'partial').length;
  const nonCompliant = items.filter(item => item.status === 'non_compliant').length;
  const notAssessed = items.filter(item => item.status === 'not_assessed').length;
  const notApplicable = items.filter(item => item.status === 'not_applicable').length;

  const assessed = total - notAssessed;
  const completionPercentage = total > 0 ? Math.round((assessed / total) * 100) : 0;

  return {
    total,
    compliant,
    partial,
    nonCompliant,
    notAssessed,
    notApplicable,
    assessed,
    completionPercentage,
  };
}

/**
 * Status mapping for display
 */
export const STATUS_LABELS = {
  compliant: 'Compliant',
  partial: 'Partially Compliant',
  non_compliant: 'Non-Compliant',
  not_assessed: 'Not Assessed',
  not_applicable: 'Not Applicable',
} as const;

/**
 * Status color mapping for UI
 */
export const STATUS_COLORS = {
  compliant: 'green',
  partial: 'yellow',
  non_compliant: 'red',
  not_assessed: 'gray',
  not_applicable: 'blue',
} as const;
