import { ClipboardCheck } from 'lucide-react';
import type { AssessmentItem, CsfFunction, CsfCategory, ConsolidatedQuestion, MaturityLevelInfo } from '../../types';
import { T } from '../../tokens';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import VpFunctionNav from './VpFunctionNav';
import VpCategorySection from './VpCategorySection';
import ControlItem from '../assessment/ControlItem';
import VpConsolidatedQuestion from './VpConsolidatedQuestion';

// ── Legacy (items-based) props ──
interface LegacyProps {
  mode: 'legacy';
  items: AssessmentItem[];
  categories: CsfCategory[];
  expandedItems: Set<string>;
  savingItems: Set<string>;
  onToggleExpand: (itemId: string) => void;
  onStatusChange: (itemId: string, status: string) => void;
  onNotesChange: (itemId: string, notes: string) => void;
}

// ── Consolidated (maturity-based) props ──
interface ConsolidatedProps {
  mode: 'consolidated';
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
  savingQuestions: Set<string>;
  onMaturityChange: (questionId: string, level: number, notes?: string) => void;
}

type VpAssessmentProps = (LegacyProps | ConsolidatedProps) & {
  functions: CsfFunction[];
  selectedFunctionId: string | null;
  onSelectFunction: (id: string) => void;
  onReview: () => void;
};

export default function VpAssessment(props: VpAssessmentProps) {
  const { functions, selectedFunctionId, onSelectFunction, onReview } = props;
  const isMobile = useMediaQuery(breakpoints.mobile);

  // ════════════════════════════════════════════════════
  // CONSOLIDATED MODE
  // ════════════════════════════════════════════════════
  if (props.mode === 'consolidated') {
    const { consolidatedQuestions, categoriesMap, maturityLevels, savingQuestions, onMaturityChange } = props;

    const functionQuestions = consolidatedQuestions.filter(q => {
      const cat = categoriesMap[q.category_id];
      return cat?.function_id === selectedFunctionId;
    });

    const totalQuestions = consolidatedQuestions.length;
    const answeredQuestions = consolidatedQuestions.filter(
      q => q.current_maturity !== null && q.current_maturity !== undefined
    ).length;
    const progressPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

    const functionStats: Record<string, { assessed: number; total: number }> = {};
    for (const fn of functions) {
      functionStats[fn.id] = { assessed: 0, total: 0 };
    }
    for (const q of consolidatedQuestions) {
      const cat = categoriesMap[q.category_id];
      const fid = cat?.function_id;
      if (fid && functionStats[fid]) {
        functionStats[fid].total++;
        if (q.current_maturity !== null && q.current_maturity !== undefined) {
          functionStats[fid].assessed++;
        }
      }
    }

    const handleNextUnanswered = () => {
      const unanswered = functionQuestions.find(q => q.current_maturity === null || q.current_maturity === undefined);
      if (unanswered) {
        const el = document.getElementById(`cq-${unanswered.id}`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      }
      for (const fn of functions) {
        if (fn.id === selectedFunctionId) continue;
        const fnQ = consolidatedQuestions.find(q => {
          const cat = categoriesMap[q.category_id];
          return cat?.function_id === fn.id && (q.current_maturity === null || q.current_maturity === undefined);
        });
        if (fnQ) {
          onSelectFunction(fn.id);
          setTimeout(() => {
            const el = document.getElementById(`cq-${fnQ.id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
          return;
        }
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <VpFunctionNav
          functions={functions}
          functionStats={functionStats}
          selectedFunctionId={selectedFunctionId}
          onSelectFunction={onSelectFunction}
          onNextUnanswered={handleNextUnanswered}
          isMobile={isMobile}
        />
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: isMobile ? '12px 16px' : '16px 24px', flex: 1 }}>
            {functionQuestions.length === 0 ? (
              <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '40px 0' }}>
                No questions found in this function
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
          <StickyFooter
            progressPct={progressPct}
            assessedLabel={`${answeredQuestions}/${totalQuestions} categories answered`}
            onReview={onReview}
            isMobile={isMobile}
          />
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  // LEGACY (ITEMS-BASED) MODE
  // ════════════════════════════════════════════════════
  const { items, categories, expandedItems, savingItems, onToggleExpand, onStatusChange, onNotesChange } = props;

  const functionItems = items.filter(i => i.function?.id === selectedFunctionId);

  const categoryGroups: { category: CsfCategory; items: AssessmentItem[] }[] = [];
  const seen = new Set<string>();
  for (const item of functionItems) {
    const catId = item.category?.id;
    if (!catId || seen.has(catId)) continue;
    seen.add(catId);
    const cat = categories.find(c => c.id === catId) || {
      id: catId,
      function_id: item.function?.id || '',
      name: item.category?.name || catId,
      name_tr: item.category?.name_tr,
      sort_order: 0,
    };
    const catItems = functionItems.filter(i => i.category?.id === catId);
    categoryGroups.push({ category: cat, items: catItems });
  }

  const totalItems = items.length;
  const assessedItems = items.filter(i => i.status !== 'not_assessed').length;
  const progressPct = totalItems > 0 ? Math.round((assessedItems / totalItems) * 100) : 0;

  const handleNextUnanswered = () => {
    const unanswered = functionItems.find(i => i.status === 'not_assessed');
    if (unanswered) {
      const el = document.getElementById(`control-${unanswered.id}`);
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    }
    for (const func of functions) {
      if (func.id === selectedFunctionId) continue;
      const funcUnanswered = items.find(i => i.function?.id === func.id && i.status === 'not_assessed');
      if (funcUnanswered) {
        onSelectFunction(func.id);
        setTimeout(() => {
          const el = document.getElementById(`control-${funcUnanswered.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <VpFunctionNav
        functions={functions}
        items={items}
        selectedFunctionId={selectedFunctionId}
        onSelectFunction={onSelectFunction}
        onNextUnanswered={handleNextUnanswered}
        isMobile={isMobile}
      />
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: isMobile ? '12px 16px' : '16px 24px', flex: 1 }}>
          {categoryGroups.length === 0 ? (
            <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '40px 0' }}>
              No controls found in this function
            </p>
          ) : (
            categoryGroups.map(({ category, items: catItems }) => {
              const assessedInCat = catItems.filter(i => i.status !== 'not_assessed').length;
              return (
                <VpCategorySection
                  key={category.id}
                  categoryId={category.id}
                  categoryName={category.name}
                  categoryNameTr={category.name_tr}
                  functionColor={T.accent}
                  items={catItems}
                  assessedCount={assessedInCat}
                  totalCount={catItems.length}
                  defaultExpanded
                  renderItem={(item) => (
                    <ControlItem
                      key={item.id}
                      item={item}
                      mode="interactive"
                      statusOptions="vendor"
                      showNotes={true}
                      showGuidance={false}
                      expanded={expandedItems.has(item.id)}
                      onToggleExpand={onToggleExpand}
                      onStatusChange={onStatusChange}
                      onNotesChange={onNotesChange}
                      isSaving={savingItems.has(item.id)}
                    />
                  )}
                />
              );
            })
          )}
        </div>
        <StickyFooter
          progressPct={progressPct}
          assessedLabel={`${assessedItems}/${totalItems} assessed`}
          onReview={onReview}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

// ── Shared sticky footer ──
function StickyFooter({ progressPct, assessedLabel, onReview, isMobile }: {
  progressPct: number; assessedLabel: string; onReview: () => void; isMobile: boolean;
}) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, background: T.card,
      borderTop: `1px solid ${T.border}`,
      padding: isMobile ? '10px 16px' : '12px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, zIndex: 5,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: T.fontMono, fontSize: 12, fontWeight: 700,
          color: progressPct < 30 ? T.danger : progressPct < 70 ? T.warning : T.success,
        }}>
          %{progressPct}
        </span>
        <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted }}>
          {assessedLabel}
        </span>
        <span style={{ fontFamily: T.fontSans, fontSize: 10, color: T.textFaint }}>
          Progress is saved automatically
        </span>
      </div>
      <button
        onClick={onReview}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '10px 22px', borderRadius: 9,
          background: T.accent, color: '#fff', border: 'none',
          fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(79,70,229,0.25)',
          transition: 'all 0.14s', whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
      >
        <ClipboardCheck size={15} />
        Review & Submit
      </button>
    </div>
  );
}
