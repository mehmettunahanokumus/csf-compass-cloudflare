/**
 * ControlItem — Unified CSF control item component
 *
 * Used across: VendorPortal, AssessmentChecklist, AssessmentDetail, AssessmentReport
 *
 * Modes:
 *   interactive — status buttons visible, expand toggle, notes
 *   readonly    — compact display, no buttons
 *
 * statusOptions:
 *   full   — all 5 statuses including not_assessed (org/internal)
 *   vendor — 4 statuses, no not_assessed (vendor must choose)
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Check, Loader2 } from 'lucide-react';
import type { AssessmentItem } from '../../types';
import { T } from '../../tokens';
import {
  statusLabel,
  statusBadgeStyle,
  statusAccentColor,
  statusColorSet,
  getComplianceCriteria,
  getEvidenceRequirements,
  getEvidenceExamples,
  getImplementationGuidance,
  FULL_STATUS_OPTIONS,
  VENDOR_STATUS_OPTIONS,
} from './controlItemHelpers';

// Re-export helpers so consumers can import from one place
export { statusLabel, statusBadgeStyle } from './controlItemHelpers';

export interface ControlItemProps {
  item: AssessmentItem;
  mode?: 'interactive' | 'readonly';
  statusOptions?: 'vendor' | 'full';
  onStatusChange?: (itemId: string, status: string) => void;
  onNotesChange?: (itemId: string, notes: string) => void;
  showNotes?: boolean;
  showGuidance?: boolean;
  expanded?: boolean;
  onToggleExpand?: (itemId: string) => void;
  isSaving?: boolean;
  renderActions?: (item: AssessmentItem) => React.ReactNode;
  renderExtra?: (item: AssessmentItem) => React.ReactNode;
}

export default function ControlItem({
  item,
  mode = 'interactive',
  statusOptions = 'full',
  onStatusChange,
  onNotesChange,
  showNotes = true,
  showGuidance = false,
  expanded = false,
  onToggleExpand,
  isSaving = false,
  renderActions,
  renderExtra,
}: ControlItemProps) {
  const isInteractive = mode === 'interactive';
  const options = statusOptions === 'vendor' ? VENDOR_STATUS_OPTIONS : FULL_STATUS_OPTIONS;
  const status = item.status || 'not_assessed';
  const accentColor = statusAccentColor(status);
  const sc = statusColorSet(status);

  // Internal state for the guidance sub-panel (platforms collapsible)
  const [platformsOpen, setPlatformsOpen] = useState(false);

  const subcategoryId = item.subcategory?.id || '';
  const controlDescription = item.subcategory?.description
    || `This subcategory covers ${subcategoryId || 'this area'}. Gather relevant documentation, screenshots, or audit logs as evidence.`;

  // ── Readonly mode ──────────────────────────────────────────────────────────
  if (!isInteractive) {
    return (
      <div id={`control-${item.id}`} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '9px 14px', borderRadius: 8,
        background: T.card, border: `1px solid ${T.border}`,
        borderLeft: `3px solid ${accentColor}`,
      }}>
        <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.accent, flexShrink: 0, width: 76 }}>
          {subcategoryId}
        </span>
        <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, flex: 1, lineHeight: 1.5 }}>
          {item.subcategory?.name || item.subcategory?.description?.substring(0, 90)}
        </span>
        <span style={{ ...statusBadgeStyle(status), flexShrink: 0 }}>
          {statusLabel(status)}
        </span>
      </div>
    );
  }

  // ── Interactive mode ───────────────────────────────────────────────────────
  const criteria = getComplianceCriteria(subcategoryId);
  const evidenceReq = getEvidenceRequirements(subcategoryId);
  const evidenceExamples = getEvidenceExamples(subcategoryId);
  const guidance = getImplementationGuidance(subcategoryId);

  return (
    <div id={`control-${item.id}`} style={{
      borderRadius: 12,
      border: `1px solid ${expanded ? T.accentBorder : T.border}`,
      borderLeft: `3px solid ${accentColor}`,
      background: T.card,
      overflow: 'hidden',
      transition: 'border-color 0.14s',
    }}>
      {/* ── Header row ── */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.accent }}>
              {subcategoryId}
            </span>
            <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 500, color: T.textPrimary }}>
              {item.subcategory?.name}
            </span>
          </div>
          <p style={{
            fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary,
            margin: 0, lineHeight: 1.6,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden',
          }}>
            {controlDescription}
          </p>
        </div>

        {/* Status badge */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 8px', borderRadius: 999,
            fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.05em', textTransform: 'uppercase' as const,
            background: sc.bg, color: sc.color,
            border: `1px solid ${sc.border}`,
          }}>
            {statusLabel(status)}
          </span>
          {isSaving && (
            <Loader2 size={13} style={{ color: T.accent, animation: 'spin 1s linear infinite' }} />
          )}
        </div>
      </div>

      {/* ── Button row (always visible in interactive mode) ── */}
      <div style={{
        padding: '0 18px 12px',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        {/* Status buttons */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {options.map(({ value, label, bg, color, border }) => {
            const isActive = status === value;
            return (
              <button
                key={value}
                onClick={() => onStatusChange?.(item.id, value)}
                disabled={isSaving}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 12px', borderRadius: 7,
                  fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
                  border: `1.5px solid ${isActive ? border : T.border}`,
                  background: isActive ? bg : T.card,
                  color: isActive ? color : T.textSecondary,
                  cursor: isSaving ? 'wait' : 'pointer',
                  transition: 'all 0.14s',
                  opacity: isSaving ? 0.6 : 1,
                }}
                onMouseEnter={e => {
                  if (!isActive && !isSaving) {
                    const el = e.currentTarget;
                    el.style.borderColor = border;
                    el.style.background = bg;
                    el.style.color = color;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive && !isSaving) {
                    const el = e.currentTarget;
                    el.style.borderColor = T.border;
                    el.style.background = T.card;
                    el.style.color = T.textSecondary;
                  }
                }}
              >
                {isActive && <Check size={11} />}
                {label}
              </button>
            );
          })}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* renderActions slot (evidence, AI, etc.) */}
        {renderActions?.(item)}

        {/* Expand toggle */}
        {onToggleExpand && (
          <button
            onClick={() => onToggleExpand(item.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 6,
              background: expanded ? T.accentLight : 'transparent',
              border: `1px solid ${expanded ? T.accentBorder : T.border}`,
              fontFamily: T.fontSans, fontSize: 11, fontWeight: 500,
              color: expanded ? T.accent : T.textMuted,
              cursor: 'pointer', transition: 'all 0.14s',
            }}
            onMouseEnter={e => { if (!expanded) { e.currentTarget.style.color = T.accent; e.currentTarget.style.background = T.accentLight; } }}
            onMouseLeave={e => { if (!expanded) { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = 'transparent'; } }}
          >
            <ChevronDown
              size={13}
              style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            />
            Details
          </button>
        )}
      </div>

      {/* ── Expand panel ── */}
      {expanded && (
        <div style={{
          borderTop: `1px solid ${T.border}`,
          padding: '14px 18px 16px',
          background: T.bg,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* What's Required section */}
          <div style={{
            padding: 14, borderRadius: 8,
            background: T.card,
            border: `1px solid ${T.border}`,
            borderLeft: `3px solid ${T.accent}`,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {/* Control ID + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, color: T.accent,
                background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                padding: '2px 7px', borderRadius: 4, flexShrink: 0,
              }}>
                {subcategoryId}
              </span>
              <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.textPrimary }}>
                {item.subcategory?.name || subcategoryId}
              </span>
            </div>

            {/* Description */}
            <div>
              <p style={{
                fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.textMuted,
                textTransform: 'uppercase' as const, letterSpacing: '0.07em', margin: '0 0 6px',
              }}>Control Description</p>
              <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.65 }}>
                {controlDescription}
              </p>
            </div>

            {/* Evidence requirements */}
            <div>
              <p style={{
                fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.textMuted,
                textTransform: 'uppercase' as const, letterSpacing: '0.07em', margin: '0 0 8px',
              }}>Required Evidence</p>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {evidenceReq.map((ev, i) => (
                  <li key={i} style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                    {ev}
                  </li>
                ))}
              </ul>
            </div>

            {/* Evidence examples (simpler vendor-friendly list) */}
            <div>
              <p style={{
                fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.textMuted,
                textTransform: 'uppercase' as const, letterSpacing: '0.07em', margin: '0 0 8px',
              }}>Evidence Examples</p>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {evidenceExamples.map((ex, i) => (
                  <li key={i} style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary, lineHeight: 1.6 }}>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>

            {/* Compliance criteria */}
            <div>
              <p style={{
                fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.textMuted,
                textTransform: 'uppercase' as const, letterSpacing: '0.07em', margin: '0 0 8px',
              }}>Compliance Criteria</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { label: 'Compliant', text: criteria.compliant, color: T.success, bg: T.successLight, border: T.successBorder },
                  { label: 'Partial', text: criteria.partial, color: T.warning, bg: T.warningLight, border: T.warningBorder },
                  { label: 'Non-Compliant', text: criteria.non_compliant, color: T.danger, bg: T.dangerLight, border: T.dangerBorder },
                ].map(({ label, text, color, bg, border }) => (
                  <div key={label} style={{
                    display: 'flex', gap: 10, padding: '7px 10px',
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: 6, alignItems: 'flex-start',
                  }}>
                    <span style={{
                      fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                      color, width: 94, flexShrink: 0, paddingTop: 1,
                      textTransform: 'uppercase' as const, letterSpacing: '0.04em',
                    }}>{label}</span>
                    <span style={{
                      fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary, lineHeight: 1.55,
                    }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Implementation Guidance (optional) */}
          {showGuidance && (
            <div style={{
              padding: 14, borderRadius: 8,
              background: T.accentLight,
              border: `1px solid ${T.accentBorder}`,
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15 }}>📘</span>
                <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.accent }}>
                  Implementation Guidance
                </span>
              </div>

              <div>
                <p style={{
                  fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.accent,
                  textTransform: 'uppercase' as const, letterSpacing: '0.07em', margin: '0 0 6px', opacity: 0.8,
                }}>Capability Required</p>
                <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.65 }}>
                  {guidance.capability}
                </p>
              </div>

              <div>
                <p style={{
                  fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.accent,
                  textTransform: 'uppercase' as const, letterSpacing: '0.07em', margin: '0 0 8px', opacity: 0.8,
                }}>Implementation Steps</p>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {guidance.steps.map((step, i) => (
                    <li key={i} style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary, lineHeight: 1.65 }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <button
                  onClick={() => setPlatformsOpen(!platformsOpen)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: 0, background: 'transparent', border: 'none',
                    fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
                    color: T.accent, cursor: 'pointer',
                  }}
                >
                  {platformsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  Platform-specific examples
                </button>

                {platformsOpen && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {guidance.platforms.map((p, i) => (
                      <div key={i} style={{
                        display: 'flex', gap: 10, alignItems: 'flex-start',
                        padding: '6px 10px', borderRadius: 6,
                        background: T.card, border: `1px solid ${T.border}`,
                      }}>
                        <span style={{
                          fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                          color: T.textPrimary, minWidth: 130, flexShrink: 0,
                          textTransform: 'uppercase' as const, letterSpacing: '0.04em', paddingTop: 1,
                        }}>{p.category}</span>
                        <span style={{
                          fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary, lineHeight: 1.55,
                        }}>{p.tools}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes textarea (optional) */}
          {showNotes && (
            <div>
              <label style={{
                display: 'block', fontFamily: T.fontSans, fontSize: 11,
                fontWeight: 600, color: T.textMuted, marginBottom: 5,
                textTransform: 'uppercase' as const, letterSpacing: '0.06em',
              }}>
                Notes <span style={{ fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0 }}>(optional)</span>
              </label>
              <textarea
                value={item.notes || ''}
                onChange={(e) => onNotesChange?.(item.id, e.target.value)}
                placeholder="Add any notes or comments about this control..."
                style={{
                  width: '100%', boxSizing: 'border-box' as const,
                  minHeight: 60, resize: 'vertical' as const,
                  padding: '10px 12px', borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  background: T.card,
                  fontFamily: T.fontSans, fontSize: 13,
                  color: T.textPrimary, lineHeight: 1.6,
                  outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
                onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
              />
            </div>
          )}

          {/* renderExtra slot (AI suggestion banner, etc.) */}
          {renderExtra?.(item)}
        </div>
      )}
    </div>
  );
}
