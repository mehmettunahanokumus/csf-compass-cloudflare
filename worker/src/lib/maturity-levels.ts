/**
 * Maturity Level Definitions for Consolidated Vendor Questions
 *
 * Maps 5-level maturity scale to assessment_items status values.
 * Used when a vendor answers a consolidated question to expand
 * the maturity level into individual subcategory statuses.
 */

export const MATURITY_LEVELS = [
  {
    level: 1,
    name: 'Initial',
    name_tr: 'Baslangic',
    description: 'Processes are ad hoc, unpredictable, or not defined.',
    description_tr: 'Surecler rastgele, ongorrülemeyen veya tanimlanmamis.',
    status: 'non_compliant' as const,
  },
  {
    level: 2,
    name: 'Developing',
    name_tr: 'Gelismekte',
    description: 'Processes are partially planned and tracked but not consistently applied.',
    description_tr: 'Surecler kismen planlanmis ve izleniyor ancak tutarli bir sekilde uygulanmiyor.',
    status: 'partial' as const,
  },
  {
    level: 3,
    name: 'Defined',
    name_tr: 'Tanimlanmis',
    description: 'Processes are documented, standardized, and integrated into operations.',
    description_tr: 'Surecler belgelenmis, standartlastirilmis ve operasyonlara entegre edilmis.',
    status: 'compliant' as const,
  },
  {
    level: 4,
    name: 'Managed',
    name_tr: 'Yonetilen',
    description: 'Processes are measured, controlled, and continuously monitored.',
    description_tr: 'Surecler olculuyor, kontrol ediliyor ve surekli izleniyor.',
    status: 'compliant' as const,
  },
  {
    level: 5,
    name: 'Optimizing',
    name_tr: 'Optimize',
    description: 'Processes are continuously improved based on quantitative analysis and innovation.',
    description_tr: 'Surecler nicel analize ve yeniliklere dayali olarak surekli iyilestiriliyor.',
    status: 'compliant' as const,
  },
] as const;

export type MaturityLevel = 1 | 2 | 3 | 4 | 5;

/**
 * Get the assessment_items status for a given maturity level
 */
export function maturityToStatus(level: MaturityLevel): 'compliant' | 'partial' | 'non_compliant' {
  const entry = MATURITY_LEVELS.find(m => m.level === level);
  return entry?.status || 'non_compliant';
}

/**
 * Derive maturity level from an assessment_items status
 * Used when loading consolidated view to show current maturity
 */
export function statusToMaturity(status: string): MaturityLevel | null {
  switch (status) {
    case 'compliant': return 3;
    case 'partial': return 2;
    case 'non_compliant': return 1;
    default: return null;
  }
}

/**
 * Tier ordering for filtering
 */
export const TIER_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
