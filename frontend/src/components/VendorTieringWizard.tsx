import React, { useState, useEffect } from 'react';
import type { Vendor, TieringQuestion, CriticalityTier } from '../types';
import { vendorsApi } from '../api/vendors';
import { TierBadge } from './TierBadge';
import { T, card } from '../tokens';

interface VendorTieringWizardProps {
  vendorId: string;
  vendorName: string;
  open: boolean;
  onClose: () => void;
  onComplete: (vendor: Vendor) => void;
  existingAnswers?: Record<string, number>;
}

function calculateTier(score: number): CriticalityTier {
  if (score < 25) return 'low';
  if (score < 50) return 'medium';
  if (score < 75) return 'high';
  return 'critical';
}

const TIER_QUESTION_COUNTS: Record<CriticalityTier, number> = {
  low: 30,
  medium: 60,
  high: 95,
  critical: 120,
};

const TIER_COLORS: Record<CriticalityTier, string> = {
  low: '#22C55E',
  medium: '#EAB308',
  high: '#F97316',
  critical: '#EF4444',
};

export const VendorTieringWizard: React.FC<VendorTieringWizardProps> = ({
  vendorId,
  vendorName,
  open,
  onClose,
  onComplete,
  existingAnswers,
}) => {
  const [questions, setQuestions] = useState<TieringQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setLoading(true);
    setError(null);

    vendorsApi
      .getTiering(vendorId)
      .then((data) => {
        setQuestions(data.questions);
        const initial = existingAnswers || data.vendor.tiering_answers || {};
        setAnswers(initial);
      })
      .catch((err) => {
        setError(err?.response?.data?.error || 'Tiering bilgileri yüklenemedi.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, vendorId, existingAnswers]);

  if (!open) return null;

  const answeredCount = Object.keys(answers).length;
  const allAnswered = questions.length > 0 && answeredCount === questions.length;

  // Calculate weighted score
  let weightedScore = 0;
  let totalWeight = 0;
  for (const q of questions) {
    totalWeight += q.weight * 4;
    if (answers[q.id] !== undefined) {
      weightedScore += answers[q.id] * q.weight;
    }
  }
  const normalizedScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
  const tier = calculateTier(normalizedScore);
  const tierColor = TIER_COLORS[tier];

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    setError(null);

    try {
      const updatedVendor = await vendorsApi.submitTiering(vendorId, answers);
      onComplete(updatedVendor);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Tiering kaydedilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const progressPct = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Overlay */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div style={{
        position: 'relative', zIndex: 10,
        width: '100%', maxWidth: 640, maxHeight: '90vh',
        margin: '0 16px',
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 14,
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: T.fontSans, fontSize: 18, fontWeight: 700,
            color: T.textPrimary, margin: 0,
          }}>
            Vendor Kritiklik Değerlendirmesi
          </h2>
          <p style={{
            fontFamily: T.fontSans, fontSize: 13, color: T.textMuted,
            margin: '4px 0 0',
          }}>
            {vendorName} &mdash;{' '}
            <span style={{ fontFamily: T.fontMono, fontWeight: 600 }}>
              {answeredCount}/{questions.length}
            </span>{' '}
            cevaplandı
          </p>
          {/* Progress bar */}
          <div style={{
            marginTop: 10, height: 5, borderRadius: 3,
            background: T.border, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', borderRadius: 3,
              background: T.accent,
              width: `${progressPct}%`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {/* Body */}
        <div style={{
          padding: '20px 24px',
          overflowY: 'auto', flex: 1,
        }}>
          {loading && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '48px 0',
            }}>
              <p style={{ fontFamily: T.fontSans, fontSize: 14, color: T.textMuted }}>
                Yükleniyor...
              </p>
            </div>
          )}

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 8,
              background: T.dangerLight, border: `1px solid ${T.dangerBorder}`,
            }}>
              <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>
                {error}
              </p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Questions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    style={{
                      ...card,
                      padding: '18px 20px',
                    }}
                  >
                    {/* Question header */}
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8,
                      marginBottom: 14,
                    }}>
                      <span style={{
                        fontFamily: T.fontMono, fontSize: 12, fontWeight: 700,
                        color: T.accent,
                        background: T.accentLight,
                        padding: '2px 8px', borderRadius: 6,
                        flexShrink: 0, lineHeight: '20px',
                      }}>
                        {idx + 1}
                      </span>
                      <p style={{
                        fontFamily: T.fontSans, fontSize: 14, fontWeight: 600,
                        color: T.textPrimary, margin: 0, lineHeight: 1.5, flex: 1,
                      }}>
                        {q.question}
                      </p>
                      <span style={{
                        fontFamily: T.fontMono, fontSize: 10, fontWeight: 600,
                        color: T.textMuted,
                        background: T.border,
                        padding: '2px 8px', borderRadius: 10,
                        flexShrink: 0, whiteSpace: 'nowrap',
                      }}>
                        ağırlık: {q.weight}
                      </span>
                    </div>

                    {/* Options - vertical stack */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {q.options.map((opt) => {
                        const isSelected = answers[q.id] === opt.value;
                        return (
                          <label
                            key={opt.value}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '10px 12px', borderRadius: 8,
                              cursor: 'pointer',
                              border: `1px solid ${isSelected ? T.accentBorder : 'transparent'}`,
                              background: isSelected ? T.accentLight : 'transparent',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => {
                              if (!isSelected) {
                                e.currentTarget.style.background = T.accentLight;
                              }
                            }}
                            onMouseLeave={e => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            {/* Custom radio */}
                            <div style={{
                              width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                              border: `2px solid ${isSelected ? T.accent : T.border}`,
                              background: isSelected ? T.accent : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}>
                              {isSelected && (
                                <div style={{
                                  width: 6, height: 6, borderRadius: '50%',
                                  background: '#fff',
                                }} />
                              )}
                            </div>
                            <input
                              type="radio"
                              name={`tiering-${q.id}`}
                              value={opt.value}
                              checked={isSelected}
                              onChange={() => handleAnswer(q.id, opt.value)}
                              style={{ display: 'none' }}
                            />
                            <span style={{
                              fontFamily: T.fontSans, fontSize: 13,
                              color: isSelected ? T.textPrimary : T.textSecondary,
                              fontWeight: isSelected ? 600 : 400,
                              lineHeight: 1.4,
                            }}>
                              {opt.label}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Result preview */}
              {allAnswered && (
                <div style={{
                  marginTop: 24,
                  ...card,
                  padding: '20px 24px',
                  background: T.bg,
                }}>
                  <h3 style={{
                    fontFamily: T.fontSans, fontSize: 14, fontWeight: 700,
                    color: T.textPrimary, margin: '0 0 16px',
                  }}>
                    Değerlendirme Sonucu
                  </h3>

                  {/* Tier + score row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <TierBadge tier={tier} />
                    <span style={{
                      fontFamily: T.fontMono, fontSize: 22, fontWeight: 700,
                      color: tierColor,
                    }}>
                      {normalizedScore}
                    </span>
                    <span style={{ fontFamily: T.fontMono, fontSize: 13, color: T.textMuted }}>
                      / 100
                    </span>
                  </div>

                  {/* Score bar */}
                  <div style={{
                    height: 8, borderRadius: 4,
                    background: T.border, overflow: 'hidden',
                    marginBottom: 16,
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 4,
                      background: tierColor,
                      width: `${normalizedScore}%`,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>

                  {/* Info rows */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary }}>
                        Tahmini değerlendirme sorusu
                      </span>
                      <span style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: 700, color: T.textPrimary }}>
                        ~{TIER_QUESTION_COUNTS[tier]} soru
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary }}>
                        Kanıt yükleme
                      </span>
                      <span style={{
                        fontFamily: T.fontMono, fontSize: 12, fontWeight: 700,
                        padding: '2px 10px', borderRadius: 10,
                        background: (tier === 'high' || tier === 'critical') ? T.dangerLight : T.successLight,
                        color: (tier === 'high' || tier === 'critical') ? T.danger : T.success,
                      }}>
                        {(tier === 'high' || tier === 'critical') ? 'Zorunlu' : 'Opsiyonel'}
                      </span>
                    </div>
                  </div>

                  {/* Evidence warning */}
                  {(tier === 'high' || tier === 'critical') && (
                    <div style={{
                      marginTop: 14, padding: '10px 14px', borderRadius: 8,
                      background: T.warningLight, border: `1px solid ${T.warningBorder}`,
                    }}>
                      <p style={{
                        fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                        color: T.warning, margin: '0 0 2px',
                      }}>
                        Kanıt yükleme zorunlu
                      </p>
                      <p style={{
                        fontFamily: T.fontSans, fontSize: 12,
                        color: T.textMuted, margin: 0,
                      }}>
                        Yüksek ve kritik seviye vendörlar için değerlendirme sırasında kanıt yüklenmesi gereklidir.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '8px 18px', borderRadius: 8,
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
              color: T.textSecondary, background: T.card,
              border: `1px solid ${T.border}`, cursor: 'pointer',
              opacity: submitting ? 0.5 : 1,
            }}
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            style={{
              padding: '8px 20px', borderRadius: 8,
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
              color: '#fff',
              background: (!allAnswered || submitting) ? T.border : T.accent,
              border: 'none',
              cursor: (!allAnswered || submitting) ? 'not-allowed' : 'pointer',
              boxShadow: allAnswered && !submitting ? '0 1px 3px rgba(79,70,229,0.3)' : 'none',
            }}
          >
            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};
