import { useMemo } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Send,
  Loader2,
  AlertOctagon,
  User,
} from 'lucide-react';
import type { AssessmentItem, CsfFunction, ConsolidatedQuestion, MaturityLevelInfo } from '../../types';
import { T, card } from '../../tokens';

// ── Legacy props ──
interface LegacyReviewProps {
  mode: 'legacy';
  items: AssessmentItem[];
}

// ── Consolidated props ──
interface ConsolidatedReviewProps {
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
}

type VpReviewProps = (LegacyReviewProps | ConsolidatedReviewProps) & {
  functions: CsfFunction[];
  respondentName: string;
  submitting: boolean;
  onSubmit: () => void;
  onGoBack: () => void;
  onGoToItem: (functionId: string) => void;
};

// ── Stat pill ──────────────────────────────────────────────
function StatCard({ icon, label, count, color, bg, border }: {
  icon: React.ReactNode; label: string; count: number; color: string; bg: string; border: string;
}) {
  return (
    <div style={{
      flex: '1 1 0', minWidth: 100, padding: '14px 16px', borderRadius: 10,
      background: bg, border: `1px solid ${border}`,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color }}>{label}</span>
      </div>
      <span style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, color, letterSpacing: '-0.02em' }}>
        {count}
      </span>
    </div>
  );
}

// ── Function breakdown row ─────────────────────────────────
function FunctionRow({ name, assessed, total, color }: {
  name: string; assessed: number; total: number; color: string;
}) {
  const pct = total > 0 ? (assessed / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.textPrimary, width: 100, flexShrink: 0 }}>
        {name}
      </span>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: T.borderLight, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 999, background: color, width: `${pct}%`, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{
        fontFamily: T.fontMono, fontSize: 11, fontWeight: 600,
        color: assessed === total && total > 0 ? T.success : T.textMuted,
        width: 48, textAlign: 'right', flexShrink: 0,
      }}>
        {assessed}/{total}
      </span>
    </div>
  );
}

// ── Maturity badge ──
function MaturityBadge({ level, maturityLevels }: { level: number | null | undefined; maturityLevels: MaturityLevelInfo[] }) {
  if (level === null || level === undefined) {
    return (
      <span style={{
        fontFamily: T.fontMono, fontSize: 10, fontWeight: 600,
        color: T.textMuted, background: T.bg, border: `1px solid ${T.borderLight}`,
        borderRadius: 5, padding: '2px 7px',
      }}>--</span>
    );
  }
  const ml = maturityLevels.find(m => m.level === level);
  const color = level <= 1 ? T.danger : level === 2 ? T.warning : T.success;
  return (
    <span style={{
      fontFamily: T.fontMono, fontSize: 10, fontWeight: 700,
      color, background: `${color}15`, border: `1px solid ${color}30`,
      borderRadius: 5, padding: '2px 7px',
    }}>
      L{level} {ml?.name}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────
export default function VpReview(props: VpReviewProps) {
  const { functions, respondentName, submitting, onSubmit, onGoBack, onGoToItem } = props;

  // ════════════════════════════════════════════
  // CONSOLIDATED MODE
  // ════════════════════════════════════════════
  if (props.mode === 'consolidated') {
    const { consolidatedQuestions, categoriesMap, maturityLevels } = props;
    const totalQuestions = consolidatedQuestions.length;
    const answeredQuestions = consolidatedQuestions.filter(q => q.current_maturity != null).length;
    const unansweredCount = totalQuestions - answeredQuestions;

    const maturityCounts = { high: 0, medium: 0, low: 0, unanswered: 0 };
    for (const q of consolidatedQuestions) {
      if (q.current_maturity == null) maturityCounts.unanswered++;
      else if (q.current_maturity >= 3) maturityCounts.high++;
      else if (q.current_maturity === 2) maturityCounts.medium++;
      else maturityCounts.low++;
    }

    const funcBreakdown = functions.map(func => {
      const funcQs = consolidatedQuestions.filter(q => categoriesMap[q.category_id]?.function_id === func.id);
      return {
        id: func.id,
        name: func.name.replace(/\s*\(.*\)$/, ''),
        assessed: funcQs.filter(q => q.current_maturity != null).length,
        total: funcQs.length,
      };
    });

    const unansweredList = consolidatedQuestions.filter(q => q.current_maturity == null);
    const progressPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

    return (
      <ReviewLayout
        title="Review & Submit"
        subtitle="Review your responses before submitting the assessment."
      >
        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <StatCard icon={<CheckCircle size={14} style={{ color: T.success }} />} label="Mature (L3-L5)" count={maturityCounts.high} color={T.success} bg={T.successLight} border={T.successBorder} />
          <StatCard icon={<AlertTriangle size={14} style={{ color: T.warning }} />} label="Developing (L2)" count={maturityCounts.medium} color={T.warning} bg={T.warningLight} border={T.warningBorder} />
          <StatCard icon={<XCircle size={14} style={{ color: T.danger }} />} label="Initial (L1)" count={maturityCounts.low} color={T.danger} bg={T.dangerLight} border={T.dangerBorder} />
          <StatCard icon={<HelpCircle size={14} style={{ color: T.textMuted }} />} label="Unanswered" count={maturityCounts.unanswered} color={T.textMuted} bg={T.bg} border={T.border} />
        </div>

        {/* Per-category answers */}
        <div style={{ ...card, padding: '18px 20px' }}>
          <h3 style={{ ...sectionHeader }}>Answers by Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {consolidatedQuestions.map(q => {
              const cat = categoriesMap[q.category_id];
              return (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: `1px solid ${T.borderLight}` }}>
                  <span style={{ fontFamily: T.fontMono, fontSize: 10, fontWeight: 700, color: T.accent, width: 48, flexShrink: 0 }}>{q.category_id}</span>
                  <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat?.name || q.category_id}
                  </span>
                  <MaturityBadge level={q.current_maturity} maturityLevels={maturityLevels} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Function breakdown */}
        <FunctionBreakdownCard funcBreakdown={funcBreakdown} progressPct={progressPct} />

        {/* Unanswered warnings */}
        {unansweredCount > 0 && (
          <UnansweredWarning
            count={unansweredCount}
            badges={unansweredList.slice(0, 8).map(q => ({
              key: q.id,
              label: q.category_id,
              onClick: () => { const cat = categoriesMap[q.category_id]; if (cat?.function_id) onGoToItem(cat.function_id); },
            }))}
            moreCount={unansweredList.length > 8 ? unansweredList.length - 8 : 0}
            onGoBack={onGoBack}
          />
        )}

        <RespondentCard respondentName={respondentName} />
        <ActionButtons submitting={submitting} onGoBack={onGoBack} onSubmit={onSubmit} />
        <FinePrint />
      </ReviewLayout>
    );
  }

  // ════════════════════════════════════════════
  // LEGACY (ITEMS-BASED) MODE
  // ════════════════════════════════════════════
  const { items } = props;

  const stats = useMemo(() => {
    const total = items.length;
    const compliant = items.filter(i => i.status === 'compliant').length;
    const partial = items.filter(i => i.status === 'partial').length;
    const nonCompliant = items.filter(i => i.status === 'non_compliant').length;
    const notApplicable = items.filter(i => i.status === 'not_applicable').length;
    const unanswered = items.filter(i => i.status === 'not_assessed').length;
    return { total, compliant, partial, nonCompliant, notApplicable, unanswered };
  }, [items]);

  const funcBreakdown = useMemo(() => {
    return functions.map(func => {
      const funcItems = items.filter(i => i.function?.id === func.id);
      const assessed = funcItems.filter(i => i.status !== 'not_assessed').length;
      const total = funcItems.length;
      const shortName = func.name.replace(/\s*\(.*\)$/, '');
      return { id: func.id, name: shortName, assessed, total };
    });
  }, [items, functions]);

  const unansweredItems = useMemo(() => items.filter(i => i.status === 'not_assessed'), [items]);
  const highPriorityUnanswered = useMemo(() => unansweredItems.filter(i => i.subcategory?.priority === 'high'), [unansweredItems]);
  const progressPct = stats.total > 0 ? Math.round(((stats.total - stats.unanswered) / stats.total) * 100) : 0;

  return (
    <ReviewLayout
      title="Review & Submit"
      subtitle="Review your responses before submitting the assessment."
    >
      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard icon={<CheckCircle size={14} style={{ color: T.success }} />} label="Compliant" count={stats.compliant} color={T.success} bg={T.successLight} border={T.successBorder} />
        <StatCard icon={<AlertTriangle size={14} style={{ color: T.warning }} />} label="Partial" count={stats.partial} color={T.warning} bg={T.warningLight} border={T.warningBorder} />
        <StatCard icon={<XCircle size={14} style={{ color: T.danger }} />} label="Non-Compliant" count={stats.nonCompliant} color={T.danger} bg={T.dangerLight} border={T.dangerBorder} />
        <StatCard icon={<HelpCircle size={14} style={{ color: T.textMuted }} />} label="Unanswered" count={stats.unanswered} color={T.textMuted} bg={T.bg} border={T.border} />
      </div>

      {/* Function breakdown */}
      <FunctionBreakdownCard funcBreakdown={funcBreakdown} progressPct={progressPct} />

      {/* Unanswered warnings */}
      {stats.unanswered > 0 && (
        <UnansweredWarning
          count={stats.unanswered}
          badges={unansweredItems.slice(0, 5).map(item => ({
            key: item.id,
            label: item.subcategory?.id || item.id.slice(0, 8),
            onClick: () => item.function?.id && onGoToItem(item.function.id),
          }))}
          moreCount={unansweredItems.length > 5 ? unansweredItems.length - 5 : 0}
          onGoBack={onGoBack}
        />
      )}

      {/* High priority alert */}
      {highPriorityUnanswered.length > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 10,
          background: T.dangerLight, border: `1px solid ${T.dangerBorder}`,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertOctagon size={18} style={{ color: T.danger, flexShrink: 0, marginTop: 1 }} />
          <div>
            <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.danger }}>
              {highPriorityUnanswered.length} high-priority controls unanswered
            </span>
            <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.danger, margin: '4px 0 0', opacity: 0.85, lineHeight: 1.5 }}>
              These controls are critical for organizational security. It is recommended to answer them before submitting.
            </p>
          </div>
        </div>
      )}

      <RespondentCard respondentName={respondentName} />
      <ActionButtons submitting={submitting} onGoBack={onGoBack} onSubmit={onSubmit} />
      <FinePrint />
    </ReviewLayout>
  );
}

// ══════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ══════════════════════════════════════════════

const sectionHeader: React.CSSProperties = {
  fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: T.textMuted, margin: '0 0 12px',
};

function ReviewLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700, color: T.textPrimary, margin: '0 0 6px', letterSpacing: '-0.01em' }}>{title}</h2>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function FunctionBreakdownCard({ funcBreakdown, progressPct }: {
  funcBreakdown: { id: string; name: string; assessed: number; total: number }[];
  progressPct: number;
}) {
  return (
    <div style={{ ...card, padding: '18px 20px' }}>
      <h3 style={sectionHeader}>Progress by Function</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {funcBreakdown.map(fb => (
          <FunctionRow
            key={fb.id} name={fb.name} assessed={fb.assessed} total={fb.total}
            color={fb.total === 0 ? T.borderLight : fb.assessed / fb.total < 0.3 ? T.danger : fb.assessed / fb.total < 0.7 ? T.warning : T.success}
          />
        ))}
      </div>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.textSecondary }}>Overall Progress</span>
        <span style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700, color: progressPct < 30 ? T.danger : progressPct < 70 ? T.warning : T.success }}>%{progressPct}</span>
      </div>
    </div>
  );
}

function UnansweredWarning({ count, badges, moreCount, onGoBack }: {
  count: number;
  badges: { key: string; label: string; onClick: () => void }[];
  moreCount: number;
  onGoBack: () => void;
}) {
  return (
    <div style={{ padding: '14px 18px', borderRadius: 10, background: T.warningLight, border: `1px solid ${T.warningBorder}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={16} style={{ color: T.warning, flexShrink: 0 }} />
        <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.warning }}>{count} unanswered controls remaining</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {badges.map(b => (
          <button key={b.key} onClick={b.onClick} style={{
            padding: '3px 8px', borderRadius: 5, background: T.card, border: `1px solid ${T.warningBorder}`,
            fontFamily: T.fontMono, fontSize: 10, fontWeight: 600, color: T.warning, cursor: 'pointer', transition: 'all 0.14s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = T.warning; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.card; e.currentTarget.style.color = T.warning; }}
          >{b.label}</button>
        ))}
        {moreCount > 0 && <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.warning, alignSelf: 'center' }}>+{moreCount} more</span>}
      </div>
      <button onClick={onGoBack} style={{
        alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: 0, background: 'transparent', border: 'none',
        fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.warning, cursor: 'pointer', textDecoration: 'underline',
      }}>
        <ArrowLeft size={12} />Go back and complete
      </button>
    </div>
  );
}

function RespondentCard({ respondentName }: { respondentName: string }) {
  return (
    <div style={{ ...card, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: T.accentLight, border: `1px solid ${T.accentBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <User size={16} style={{ color: T.accent }} />
      </div>
      <div>
        <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Respondent</span>
        <p style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: '2px 0 0' }}>{respondentName || 'Not specified'}</p>
      </div>
    </div>
  );
}

function ActionButtons({ submitting, onGoBack, onSubmit }: { submitting: boolean; onGoBack: () => void; onSubmit: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
      <button onClick={onGoBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 10,
        background: T.card, border: `1px solid ${T.border}`,
        fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textSecondary, cursor: 'pointer', transition: 'all 0.14s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}
      >
        <ArrowLeft size={14} />Go Back
      </button>
      <button onClick={onSubmit} disabled={submitting} style={{
        flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '12px 24px', borderRadius: 10,
        background: submitting ? T.borderLight : T.accent, color: submitting ? T.textMuted : '#fff',
        border: 'none', fontFamily: T.fontSans, fontSize: 14, fontWeight: 700,
        cursor: submitting ? 'not-allowed' : 'pointer',
        boxShadow: submitting ? 'none' : '0 2px 8px rgba(79,70,229,0.25)',
        transition: 'all 0.14s', minHeight: 48,
      }}
        onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.9'; }}
        onMouseLeave={e => { if (!submitting) e.currentTarget.style.opacity = '1'; }}
      >
        {submitting ? (<><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Submitting...</>) : (<><Send size={16} />Submit Assessment</>)}
      </button>
    </div>
  );
}

function FinePrint() {
  return (
    <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textFaint, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
      Changes cannot be made after submission. Your responses will be shared with the organization for evaluation.
    </p>
  );
}
