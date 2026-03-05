import { useMemo, useCallback } from 'react';
import { ClipboardCheck } from 'lucide-react';
import type { AssessmentItem, CsfFunction, CsfCategory } from '../../types';
import { T } from '../../tokens';
import { useMediaQuery, breakpoints } from '../../hooks/useMediaQuery';
import VpFunctionNav from './VpFunctionNav';
import VpCategorySection from './VpCategorySection';
import ControlItem from '../assessment/ControlItem';

interface VpAssessmentProps {
  items: AssessmentItem[];
  functions: CsfFunction[];
  categories: CsfCategory[];
  selectedFunctionId: string | null;
  onSelectFunction: (id: string) => void;
  expandedItems: Set<string>;
  savingItems: Set<string>;
  onToggleExpand: (itemId: string) => void;
  onStatusChange: (itemId: string, status: string) => void;
  onNotesChange: (itemId: string, notes: string) => void;
  onReview: () => void;
}

export default function VpAssessment({
  items,
  functions,
  categories,
  selectedFunctionId,
  onSelectFunction,
  expandedItems,
  savingItems,
  onToggleExpand,
  onStatusChange,
  onNotesChange,
  onReview,
}: VpAssessmentProps) {
  const isMobile = useMediaQuery(breakpoints.mobile);

  // Items for the selected function
  const functionItems = useMemo(() => {
    return items.filter(i => i.function?.id === selectedFunctionId);
  }, [items, selectedFunctionId]);

  // Group items by category
  const categoryGroups = useMemo(() => {
    const groups: { category: CsfCategory; items: AssessmentItem[] }[] = [];
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
      groups.push({ category: cat, items: catItems });
    }

    return groups;
  }, [functionItems, categories]);

  // Progress stats
  const totalItems = items.length;
  const assessedItems = items.filter(i => i.status !== 'not_assessed').length;
  const progressPct = totalItems > 0 ? Math.round((assessedItems / totalItems) * 100) : 0;

  // Navigate to next unanswered item
  const handleNextUnanswered = useCallback(() => {
    // Find first unanswered in current function
    const unanswered = functionItems.find(i => i.status === 'not_assessed');
    if (unanswered) {
      const el = document.getElementById(`control-${unanswered.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    // If none in current function, find next function with unanswered
    for (const func of functions) {
      if (func.id === selectedFunctionId) continue;
      const funcUnanswered = items.find(i => i.function?.id === func.id && i.status === 'not_assessed');
      if (funcUnanswered) {
        onSelectFunction(func.id);
        // Scroll after React re-renders
        setTimeout(() => {
          const el = document.getElementById(`control-${funcUnanswered.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        return;
      }
    }
  }, [functionItems, functions, items, selectedFunctionId, onSelectFunction]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
    }}>
      {/* Sidebar / mobile tabs */}
      {isMobile ? (
        <VpFunctionNav
          functions={functions}
          items={items}
          selectedFunctionId={selectedFunctionId}
          onSelectFunction={onSelectFunction}
          onNextUnanswered={handleNextUnanswered}
          isMobile
        />
      ) : (
        <VpFunctionNav
          functions={functions}
          items={items}
          selectedFunctionId={selectedFunctionId}
          onSelectFunction={onSelectFunction}
          onNextUnanswered={handleNextUnanswered}
        />
      )}

      {/* Content area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Category sections */}
        <div style={{ padding: isMobile ? '12px 16px' : '16px 24px', flex: 1 }}>
          {categoryGroups.length === 0 ? (
            <p style={{
              fontFamily: T.fontSans, fontSize: 13, color: T.textMuted,
              textAlign: 'center', padding: '40px 0',
            }}>
              Bu fonksiyonda kontrol bulunamadi
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
              {assessedItems}/{totalItems} degerlendirildi
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
