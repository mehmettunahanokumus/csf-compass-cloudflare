import { useMemo, useCallback } from 'react';
import { ClipboardCheck } from 'lucide-react';
import type { ConsolidatedQuestion, MaturityLevelInfo, CsfFunction } from '../../types';
import { T } from '../../tokens';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import VpFunctionNav from './VpFunctionNav';
import VpConsolidatedQuestion from './VpConsolidatedQuestion';

interface VpAssessmentProps {
  consolidatedQuestions: ConsolidatedQuestion[];
  categoriesMap: Record<string, {
    id: string;
    name: string;
    name_tr?: string;
    function_id: string;
    function_name: string;
    function_name_tr?: string;
  }>;
  maturityLevels: MaturityLevelInfo[];
  functions: CsfFunction[];
  selectedFunctionId: string | null;
  onSelectFunction: (id: string) => void;
  savingQuestions: Set<string>;
  onMaturityChange: (questionId: string, level: number, notes?: string) => void;
  onReview: () => void;
}

export default function VpAssessment({
  consolidatedQuestions,
  categoriesMap,
  maturityLevels,
  functions,
  selectedFunctionId,
  onSelectFunction,
  savingQuestions,
  onMaturityChange,
  onReview,
}: VpAssessmentProps) {
  const isMobile = useMediaQuery(breakpoints.mobile);

  // Questions for the selected function
  const functionQuestions = useMemo(() => {
    return consolidatedQuestions.filter(q => {
      const cat = categoriesMap[q.category_id];
      return cat?.function_id === selectedFunctionId;
    });
  }, [consolidatedQuestions, categoriesMap, selectedFunctionId]);

  // Progress stats based on consolidated questions
  const totalQuestions = consolidatedQuestions.length;
  const answeredQuestions = consolidatedQuestions.filter(
    q => q.current_maturity !== null && q.current_maturity !== undefined
  ).length;
  const progressPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Build function-level stats for the nav (using consolidated questions)
  const functionStats = useMemo(() => {
    const stats: Record<string, { assessed: number; total: number }> = {};
    for (const fn of functions) {
      stats[fn.id] = { assessed: 0, total: 0 };
    }
    for (const q of consolidatedQuestions) {
      const cat = categoriesMap[q.category_id];
      const fid = cat?.function_id;
      if (fid && stats[fid]) {
        stats[fid].total++;
        if (q.current_maturity !== null && q.current_maturity !== undefined) {
          stats[fid].assessed++;
        }
      }
    }
    return stats;
  }, [consolidatedQuestions, categoriesMap, functions]);

  // Navigate to next unanswered question
  const handleNextUnanswered = useCallback(() => {
    // Find first unanswered in current function
    const unanswered = functionQuestions.find(q => q.current_maturity === null || q.current_maturity === undefined);
    if (unanswered) {
      const el = document.getElementById(`cq-${unanswered.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    // If none in current function, find next function with unanswered
    for (const fn of functions) {
      if (fn.id === selectedFunctionId) continue;
      const fnQuestion = consolidatedQuestions.find(q => {
        const cat = categoriesMap[q.category_id];
        return cat?.function_id === fn.id && (q.current_maturity === null || q.current_maturity === undefined);
      });
      if (fnQuestion) {
        onSelectFunction(fn.id);
        setTimeout(() => {
          const el = document.getElementById(`cq-${fnQuestion.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }
    }
  }, [functionQuestions, functions, consolidatedQuestions, categoriesMap, selectedFunctionId, onSelectFunction]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
    }}>
      {/* Sidebar / mobile tabs */}
      <VpFunctionNav
        functions={functions}
        functionStats={functionStats}
        selectedFunctionId={selectedFunctionId}
        onSelectFunction={onSelectFunction}
        onNextUnanswered={handleNextUnanswered}
        isMobile={isMobile}
      />

      {/* Content area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Consolidated questions */}
        <div style={{ padding: isMobile ? '12px 16px' : '16px 24px', flex: 1 }}>
          {functionQuestions.length === 0 ? (
            <p style={{
              fontFamily: T.fontSans, fontSize: 13, color: T.textMuted,
              textAlign: 'center', padding: '40px 0',
            }}>
              Bu fonksiyonda soru bulunamadi
            </p>
          ) : (
            functionQuestions.map(question => (
              <VpConsolidatedQuestion
                key={question.id}
                question={question}
                categoryInfo={categoriesMap[question.category_id]}
                maturityLevels={maturityLevels}
                isSaving={savingQuestions.has(question.id)}
                onMaturityChange={onMaturityChange}
              />
            ))
          )}
        </div>

        {/* Sticky footer */}
        <div style={{
          position: 'sticky',
          bottom: 0,
          background: T.card,
          borderTop: `1px solid ${T.border}`,
          padding: isMobile ? '10px 16px' : '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          zIndex: 5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: T.fontMono, fontSize: 12, fontWeight: 700,
              color: progressPct < 30 ? T.danger : progressPct < 70 ? T.warning : T.success,
            }}>
              %{progressPct}
            </span>
            <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted }}>
              {answeredQuestions}/{totalQuestions} kategori cevaplandi
            </span>
            <span style={{ fontFamily: T.fontSans, fontSize: 10, color: T.textFaint }}>
              Ilerleme otomatik kaydedilir
            </span>
          </div>
          <button
            onClick={onReview}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 22px', borderRadius: 9,
              background: T.accent, color: '#fff', border: 'none',
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
              transition: 'all 0.14s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          >
            <ClipboardCheck size={15} />
            Incele ve Gonder
          </button>
        </div>
      </div>
    </div>
  );
}
