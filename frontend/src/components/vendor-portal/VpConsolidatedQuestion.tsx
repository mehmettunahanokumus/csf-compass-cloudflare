import { useState, useCallback } from 'react';
import { ChevronDown, Loader2, Info } from 'lucide-react';
import type { ConsolidatedQuestion, MaturityLevelInfo } from '../../types';
import { T, card } from '../../tokens';

// Function colors matching the CSF framework
const FUNCTION_COLORS: Record<string, string> = {
  GV: '#6366f1', // indigo
  ID: '#0ea5e9', // sky
  PR: '#10b981', // emerald
  DE: '#f59e0b', // amber
  RS: '#ef4444', // red
  RC: '#8b5cf6', // violet
};

interface VpConsolidatedQuestionProps {
  question: ConsolidatedQuestion;
  categoryInfo?: {
    id: string;
    name: string;
    name_tr?: string;
    function_id: string;
    function_name: string;
    function_name_tr?: string;
  };
  maturityLevels: MaturityLevelInfo[];
  isSaving: boolean;
  onMaturityChange: (questionId: string, level: number, notes?: string) => void;
}

export default function VpConsolidatedQuestion({
  question,
  categoryInfo,
  maturityLevels,
  isSaving,
  onMaturityChange,
}: VpConsolidatedQuestionProps) {
  const [showGuidance, setShowGuidance] = useState(false);
  const [notes, setNotes] = useState(question.current_notes || '');
  const [notesTimer, setNotesTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const functionId = categoryInfo?.function_id || question.category_id.split('.')[0];
  const functionColor = FUNCTION_COLORS[functionId] || T.accent;
  const isAnswered = question.current_maturity !== null && question.current_maturity !== undefined;

  const handleLevelSelect = useCallback((level: number) => {
    onMaturityChange(question.id, level, notes || undefined);
  }, [question.id, onMaturityChange, notes]);

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
    if (notesTimer) clearTimeout(notesTimer);
    if (question.current_maturity) {
      const timer = setTimeout(() => {
        onMaturityChange(question.id, question.current_maturity!, value || undefined);
      }, 1000);
      setNotesTimer(timer);
    }
  }, [question.id, question.current_maturity, onMaturityChange, notesTimer]);

  return (
    <div
      id={`cq-${question.id}`}
      style={{
        ...card,
        padding: 0,
        overflow: 'hidden',
        marginBottom: 12,
        borderLeft: `3px solid ${functionColor}`,
        transition: 'box-shadow 0.2s',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Category badge row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
            color: functionColor,
            background: `${functionColor}15`,
            borderRadius: 4, padding: '2px 7px',
            letterSpacing: '0.04em',
          }}>
            {question.category_id}
          </span>
          {categoryInfo && (
            <span style={{
              fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
              color: T.textMuted,
            }}>
              {categoryInfo.function_name} &middot; {categoryInfo.name}
            </span>
          )}
          <span style={{
            fontFamily: T.fontMono, fontSize: 9, fontWeight: 600,
            color: T.textFaint,
            marginLeft: 'auto',
          }}>
            {question.subcategory_count} sub-controls
          </span>
          {isSaving && (
            <Loader2 size={12} style={{ color: T.accent, animation: 'spin 1s linear infinite' }} />
          )}
        </div>

        {/* Question text */}
        <p style={{
          fontFamily: T.fontSans, fontSize: 14, fontWeight: 500,
          color: T.textPrimary, lineHeight: 1.6, margin: 0,
        }}>
          {question.question_text}
        </p>

        {/* Guidance toggle */}
        {(question.guidance_text || question.guidance_text_tr) && (
          <button
            onClick={() => setShowGuidance(!showGuidance)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: 0, background: 'none', border: 'none',
              fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
              color: T.accent, cursor: 'pointer',
              alignSelf: 'flex-start',
            }}
          >
            <Info size={12} />
            {showGuidance ? 'Hide guidance' : 'Show guidance'}
            <ChevronDown size={10} style={{
              transition: 'transform 0.2s',
              transform: showGuidance ? 'rotate(180deg)' : 'rotate(0)',
            }} />
          </button>
        )}

        {/* Guidance text */}
        {showGuidance && (
          <div style={{
            padding: '10px 14px', borderRadius: 8,
            background: T.bg, border: `1px solid ${T.borderLight}`,
          }}>
            <p style={{
              fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary,
              lineHeight: 1.7, margin: 0,
            }}>
              {question.guidance_text}
            </p>
          </div>
        )}
      </div>

      {/* Maturity level selector */}
      <div style={{
        padding: '0 20px 16px',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <span style={{
          fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
          textTransform: 'uppercase' as const, letterSpacing: '0.08em',
          color: T.textMuted, marginBottom: 2,
        }}>
          Maturity Level
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {maturityLevels.map((ml) => {
            const isSelected = question.current_maturity === ml.level;
            const levelColor = ml.level <= 1 ? T.danger
              : ml.level === 2 ? T.warning
              : ml.level === 3 ? T.accent
              : ml.level === 4 ? T.success
              : T.success;

            return (
              <button
                key={ml.level}
                onClick={() => handleLevelSelect(ml.level)}
                disabled={isSaving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 8,
                  background: isSelected ? `${levelColor}12` : T.card,
                  border: `1.5px solid ${isSelected ? levelColor : T.borderLight}`,
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  opacity: isSaving ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  if (!isSelected && !isSaving) {
                    e.currentTarget.style.borderColor = `${levelColor}80`;
                    e.currentTarget.style.background = `${levelColor}08`;
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = T.borderLight;
                    e.currentTarget.style.background = T.card;
                  }
                }}
              >
                {/* Level number */}
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isSelected ? levelColor : T.bg,
                  color: isSelected ? '#fff' : T.textMuted,
                  fontFamily: T.fontMono, fontSize: 13, fontWeight: 700,
                  transition: 'all 0.15s',
                }}>
                  {ml.level}
                </div>

                {/* Labels */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                      color: isSelected ? levelColor : T.textPrimary,
                    }}>
                      {ml.name}
                    </span>
                    <span style={{
                      fontFamily: T.fontSans, fontSize: 11,
                      color: T.textMuted,
                    }}>
                      ({ml.name_tr})
                    </span>
                  </div>
                  <p style={{
                    fontFamily: T.fontSans, fontSize: 11,
                    color: T.textSecondary, margin: '2px 0 0',
                    lineHeight: 1.4,
                  }}>
                    {ml.description}
                  </p>
                </div>

                {/* Check indicator */}
                {isSelected && (
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: levelColor, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      {isAnswered && (
        <div style={{
          padding: '0 20px 16px',
        }}>
          <label style={{
            fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase' as const, letterSpacing: '0.08em',
            color: T.textMuted, display: 'block', marginBottom: 6,
          }}>
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add additional information or comments about this area..."
            rows={2}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: `1px solid ${T.borderLight}`, background: T.bg,
              fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary,
              resize: 'vertical', outline: 'none',
              transition: 'border-color 0.15s',
              boxSizing: 'border-box',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
            onBlur={e => { e.currentTarget.style.borderColor = T.borderLight; }}
          />
        </div>
      )}
    </div>
  );
}
