/**
 * Vendor Criticality Tiering
 *
 * 6-question weighted questionnaire to determine vendor criticality tier.
 * Tier determines which CSF subcategories are included in assessments
 * and whether evidence upload is required.
 */

export type CriticalityTier = 'low' | 'medium' | 'high' | 'critical';

export const TIER_ORDER: Record<CriticalityTier, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export interface TieringQuestion {
  id: string;
  question: string;
  weight: number;
  options: Array<{ label: string; value: number }>;
}

export const TIERING_QUESTIONS: TieringQuestion[] = [
  {
    id: 'q1_operational_dependency',
    question: 'What is your operational dependency on this vendor?',
    weight: 25,
    options: [
      { label: 'Used in critical business processes, no alternative available', value: 4 },
      { label: 'Used in important processes, short-term alternative is difficult', value: 3 },
      { label: 'Useful but can be replaced within 1-2 weeks', value: 2 },
      { label: 'Easily replaceable or optional', value: 1 },
    ],
  },
  {
    id: 'q2_data_access',
    question: 'What type of data does this vendor access?',
    weight: 25,
    options: [
      { label: 'Personal data, financial data, or confidential corporate data', value: 4 },
      { label: 'Internal use data (operational, project, etc.)', value: 3 },
      { label: 'Only general/publicly available data', value: 2 },
      { label: 'No data access', value: 1 },
    ],
  },
  {
    id: 'q3_system_access',
    question: 'What level of system access does this vendor have?',
    weight: 20,
    options: [
      { label: 'Access to critical infrastructure or OT/SCADA systems', value: 4 },
      { label: 'Access to corporate network or internal systems', value: 3 },
      { label: 'Limited access to specific applications only', value: 2 },
      { label: 'No system access', value: 1 },
    ],
  },
  {
    id: 'q4_regulatory',
    question: 'Are there regulatory or compliance obligations related to this vendor?',
    weight: 15,
    options: [
      { label: 'Yes, subject to GDPR / ISO 27001 / industry regulations', value: 4 },
      { label: 'Partially — some compliance requirements exist', value: 3 },
      { label: 'No, but internal policy requirements apply', value: 2 },
      { label: 'No obligations whatsoever', value: 1 },
    ],
  },
  {
    id: 'q5_incident_impact',
    question: 'What would be the business impact if this vendor experienced a security incident?',
    weight: 10,
    options: [
      { label: 'Critical business disruption and/or data breach risk', value: 4 },
      { label: 'Significant operational disruption', value: 3 },
      { label: 'Limited impact, can be resolved quickly', value: 2 },
      { label: 'Minimal or negligible impact', value: 1 },
    ],
  },
  {
    id: 'q6_contract_value',
    question: 'What is the annual contract value/budget size with this vendor?',
    weight: 5,
    options: [
      { label: 'Over $1M', value: 4 },
      { label: '$250K - $1M', value: 3 },
      { label: '$50K - $250K', value: 2 },
      { label: 'Under $50K', value: 1 },
    ],
  },
];

export interface TieringResult {
  score: number;
  tier: CriticalityTier;
}

/**
 * Calculate vendor criticality tier from questionnaire answers.
 * Score is normalized to 0-100, then mapped to tier thresholds.
 */
export function calculateTier(answers: Record<string, number>): TieringResult {
  let weightedScore = 0;
  let totalWeight = 0;

  for (const question of TIERING_QUESTIONS) {
    const answer = answers[question.id];
    if (answer !== undefined) {
      weightedScore += answer * question.weight;
      totalWeight += question.weight * 4; // max value per answer is 4
    }
  }

  if (totalWeight === 0) {
    return { score: 0, tier: 'low' };
  }

  const normalizedScore = Math.round((weightedScore / totalWeight) * 100);

  let tier: CriticalityTier;
  if (normalizedScore >= 75) tier = 'critical';
  else if (normalizedScore >= 50) tier = 'high';
  else if (normalizedScore >= 25) tier = 'medium';
  else tier = 'low';

  return { score: normalizedScore, tier };
}
