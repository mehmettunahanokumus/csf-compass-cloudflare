import React, { useState, useEffect } from 'react';
import type { Vendor, TieringQuestion, CriticalityTier } from '../types';
import { vendorsApi } from '../api/vendors';
import { TierBadge } from './TierBadge';

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
        // Use existing answers from props, API response, or start fresh
        const initial = existingAnswers || data.vendor.tiering_answers || {};
        setAnswers(initial);
      })
      .catch((err) => {
        setError(err?.response?.data?.error || 'Tiering bilgileri yuklenemedi.');
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
    totalWeight += q.weight;
    if (answers[q.id] !== undefined) {
      weightedScore += answers[q.id] * q.weight;
    }
  }
  const normalizedScore = totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0;
  const tier = calculateTier(normalizedScore);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl mx-4">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vendor Kritiklik Degerlendirmesi
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {vendorName} &mdash; {answeredCount}/{questions.length} cevaplandi
          </p>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: questions.length > 0 ? `${(answeredCount / questions.length) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Yukleniyor...</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Questions */}
              <div className="space-y-6">
                {questions.map((q, idx) => (
                  <div key={q.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      <span className="text-gray-400 dark:text-gray-500 mr-2">{idx + 1}.</span>
                      {q.question}
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                        (agirlik: {q.weight})
                      </span>
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                            answers[q.id] === opt.value
                              ? 'bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-300 dark:ring-blue-700'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`tiering-${q.id}`}
                            value={opt.value}
                            checked={answers[q.id] === opt.value}
                            onChange={() => handleAnswer(q.id, opt.value)}
                            className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Result preview */}
              {allAnswered && (
                <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-800/50">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    Degerlendirme Sonucu
                  </h3>

                  <div className="flex items-center gap-3 mb-4">
                    <TierBadge tier={tier} />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Skor: {Math.round(normalizedScore)}/100
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        tier === 'low'
                          ? 'bg-emerald-500'
                          : tier === 'medium'
                            ? 'bg-amber-500'
                            : tier === 'high'
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.round(normalizedScore)}%` }}
                    />
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Tahmini degerlendirme sorusu: <strong>~{TIER_QUESTION_COUNTS[tier]}</strong> soru
                  </p>

                  {(tier === 'high' || tier === 'critical') && (
                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-md">
                      <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                        Kanit yukleme zorunlu
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                        Yuksek ve kritik seviye vendorlar icin degerlendirme sirasinda kanit yuklenmesi gereklidir.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Iptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};
