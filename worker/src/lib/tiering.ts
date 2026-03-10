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
    question: 'Bu tedarikçiye olan operasyonel bağımlılığınız nedir?',
    weight: 25,
    options: [
      { label: 'Kritik iş süreçlerinde kullanılıyor, alternatif yok', value: 4 },
      { label: 'Önemli süreçlerde kullanılıyor, kısa vadeli alternatif zor', value: 3 },
      { label: 'Kullanışlı ama 1-2 hafta içinde değiştirilebilir', value: 2 },
      { label: 'Kolayca değiştirilebilir veya opsiyonel', value: 1 },
    ],
  },
  {
    id: 'q2_data_access',
    question: 'Bu tedarikçi hangi tür verilere erişiyor?',
    weight: 25,
    options: [
      { label: 'Kişisel veri, finansal veri veya gizli kurumsal veri', value: 4 },
      { label: 'İç kullanım verileri (operasyonel, proje vb.)', value: 3 },
      { label: 'Yalnızca genel/kamuya açık veriler', value: 2 },
      { label: 'Hiçbir veriye erişimi yok', value: 1 },
    ],
  },
  {
    id: 'q3_system_access',
    question: 'Bu tedarikçinin sistemlerinize erişim seviyesi nedir?',
    weight: 20,
    options: [
      { label: 'Kritik altyapıya veya OT/SCADA sistemlerine erişim var', value: 4 },
      { label: 'Kurumsal ağ veya iç sistemlere erişim var', value: 3 },
      { label: 'Yalnızca belirli uygulamalara sınırlı erişim', value: 2 },
      { label: 'Sistem erişimi yok', value: 1 },
    ],
  },
  {
    id: 'q4_regulatory',
    question: 'Bu tedarikçiyle ilgili mevzuat veya uyumluluk yükümlülüğü var mı?',
    weight: 15,
    options: [
      { label: 'Evet, KVKK / ISO 27001 / sektörel regülasyon kapsamında', value: 4 },
      { label: 'Kısmen — bazı uyumluluk gereksinimleri mevcut', value: 3 },
      { label: 'Hayır ama iç politika gereksinimi var', value: 2 },
      { label: 'Hayır, herhangi bir yükümlülük yok', value: 1 },
    ],
  },
  {
    id: 'q5_incident_impact',
    question: 'Bu tedarikçide bir güvenlik olayı yaşansa iş üzerindeki etkisi ne olur?',
    weight: 10,
    options: [
      { label: 'Kritik iş durması ve/veya veri ihlali riski', value: 4 },
      { label: 'Ciddi operasyonel aksaklık', value: 3 },
      { label: 'Sınırlı etki, kısa sürede çözülebilir', value: 2 },
      { label: 'Minimal veya ihmal edilebilir etki', value: 1 },
    ],
  },
  {
    id: 'q6_contract_value',
    question: 'Bu tedarikçiyle yıllık sözleşme değeri/bütçe büyüklüğü nedir?',
    weight: 5,
    options: [
      { label: '1M TL üzeri', value: 4 },
      { label: '250K - 1M TL', value: 3 },
      { label: '50K - 250K TL', value: 2 },
      { label: '50K TL altı', value: 1 },
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
