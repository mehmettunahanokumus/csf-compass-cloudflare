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
import type { AssessmentItem, CsfFunction } from '../../types';
import { T, card } from '../../tokens';

interface VpReviewProps {
  items: AssessmentItem[];
  functions: CsfFunction[];
  respondentName: string;
  submitting: boolean;
  onSubmit: () => void;
  onGoBack: () => void;
  onGoToItem: (functionId: string) => void;
}

// ── Stat pill ──────────────────────────────────────────────
function StatCard({ icon, label, count, color, bg, border }: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  bg: string;
  border: string;
}) {
  return (
    <div style={{
      flex: '1 1 0', minWidth: 100,
      padding: '14px 16px', borderRadius: 10,
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
  name: string;
  assessed: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (assessed / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <span style={{
        fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.textPrimary,
        width: 100, flexShrink: 0,
      }}>
        {name}
      </span>
      <div style={{
        flex: 1, height: 6, borderRadius: 999,
        background: T.borderLight, overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 999,
          background: color,
          width: `${pct}%`,
          transition: 'width 0.4s ease',
        }} />
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

// ── Main component ─────────────────────────────────────────
export default function VpReview({
  items,
  functions,
  respondentName,
  submitting,
  onSubmit,
  onGoBack,
  onGoToItem,
}: VpReviewProps) {
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
      const shortName = func.name_tr || func.name.replace(/\s*\(.*\)$/, '');
      return { id: func.id, name: shortName, assessed, total };
    });
  }, [items, functions]);

  const unansweredItems = useMemo(() => {
    return items.filter(i => i.status === 'not_assessed');
  }, [items]);

  const highPriorityUnanswered = useMemo(() => {
    return unansweredItems.filter(i => i.subcategory?.priority === 'high');
  }, [unansweredItems]);

  const progressPct = stats.total > 0 ? Math.round(((stats.total - stats.unanswered) / stats.total) * 100) : 0;

  return (
    <div style={{
      maxWidth: 680, margin: '0 auto', padding: '32px 24px 48px',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {/* ── Title ── */}
      <div>
        <h2 style={{
          fontFamily: T.fontDisplay, fontSize: 26, fontWeight: 700,
          color: T.textPrimary, margin: '0 0 6px', letterSpacing: '-0.01em',
        }}>
          Inceleme ve Gonderim
        </h2>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>
          Degerlendirmenizi gondermeden once yanitlarinizi gozden gecirin.
        </p>
      </div>

      {/* ── Summary stats ── */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <StatCard
          icon={<CheckCircle size={14} style={{ color: T.success }} />}
          label="Uyumlu"
          count={stats.compliant}
          color={T.success}
          bg={T.successLight}
          border={T.successBorder}
        />
        <StatCard
          icon={<AlertTriangle size={14} style={{ color: T.warning }} />}
          label="Kismi"
          count={stats.partial}
          color={T.warning}
          bg={T.warningLight}
          border={T.warningBorder}
        />
        <StatCard
          icon={<XCircle size={14} style={{ color: T.danger }} />}
          label="Uyumsuz"
          count={stats.nonCompliant}
          color={T.danger}
          bg={T.dangerLight}
          border={T.dangerBorder}
        />
        <StatCard
          icon={<HelpCircle size={14} style={{ color: T.textMuted }} />}
          label="Cevaplanmamis"
          count={stats.unanswered}
          color={T.textMuted}
          bg={T.bg}
          border={T.border}
        />
      </div>

      {/* ── Function breakdown ── */}
      <div style={{
        ...card,
        padding: '18px 20px',
      }}>
        <h3 style={{
          fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase' as const, letterSpacing: '0.08em',
          color: T.textMuted, margin: '0 0 12px',
        }}>
          Fonksiyon Bazli Ilerleme
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {funcBreakdown.map(fb => (
            <FunctionRow
              key={fb.id}
              name={fb.name}
              assessed={fb.assessed}
              total={fb.total}
              color={
                fb.total === 0 ? T.borderLight :
                fb.assessed / fb.total < 0.3 ? T.danger :
                fb.assessed / fb.total < 0.7 ? T.warning : T.success
              }
            />
          ))}
        </div>
        <div style={{
          marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.textSecondary }}>
            Genel Ilerleme
          </span>
          <span style={{
            fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700,
            color: progressPct < 30 ? T.danger : progressPct < 70 ? T.warning : T.success,
          }}>
            %{progressPct}
          </span>
        </div>
      </div>

      {/* ── Unanswered warnings ── */}
      {stats.unanswered > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 10,
          background: T.warningLight, border: `1px solid ${T.warningBorder}`,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} style={{ color: T.warning, flexShrink: 0 }} />
            <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.warning }}>
              {stats.unanswered} cevaplanmamis kontrolunuz var
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {unansweredItems.slice(0, 5).map(item => (
              <button
                key={item.id}
                onClick={() => item.function?.id && onGoToItem(item.function.id)}
                style={{
                  padding: '3px 8px', borderRadius: 5,
                  background: T.card, border: `1px solid ${T.warningBorder}`,
                  fontFamily: T.fontMono, fontSize: 10, fontWeight: 600, color: T.warning,
                  cursor: 'pointer', transition: 'all 0.14s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.warning; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = T.card; e.currentTarget.style.color = T.warning; }}
              >
                {item.subcategory?.id || item.id.slice(0, 8)}
              </button>
            ))}
            {unansweredItems.length > 5 && (
              <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.warning, alignSelf: 'center' }}>
                +{unansweredItems.length - 5} daha
              </span>
            )}
          </div>
          <button
            onClick={onGoBack}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: 0, background: 'transparent', border: 'none',
              fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.warning,
              cursor: 'pointer', textDecoration: 'underline',
            }}
          >
            <ArrowLeft size={12} />
            Geri don ve tamamla
          </button>
        </div>
      )}

      {/* ── High priority unanswered alert ── */}
      {highPriorityUnanswered.length > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 10,
          background: T.dangerLight, border: `1px solid ${T.dangerBorder}`,
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <AlertOctagon size={18} style={{ color: T.danger, flexShrink: 0, marginTop: 1 }} />
          <div>
            <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.danger }}>
              {highPriorityUnanswered.length} yuksek oncelikli kontrol cevaplanmamis
            </span>
            <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.danger, margin: '4px 0 0', opacity: 0.85, lineHeight: 1.5 }}>
              Bu kontroller kurumsal guvenlik icin kritik oneme sahiptir. Gondermeden once yanıtlamaniz onerilir.
            </p>
          </div>
        </div>
      )}

      {/* ── Respondent confirmation ── */}
      <div style={{
        ...card,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: T.accentLight, border: `1px solid ${T.accentBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <User size={16} style={{ color: T.accent }} />
        </div>
        <div>
          <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
            Yanitlayan
          </span>
          <p style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.textPrimary, margin: '2px 0 0' }}>
            {respondentName || 'Belirtilmemis'}
          </p>
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        paddingTop: 8,
      }}>
        <button
          onClick={onGoBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 20px', borderRadius: 10,
            background: T.card, border: `1px solid ${T.border}`,
            fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textSecondary,
            cursor: 'pointer', transition: 'all 0.14s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSecondary; }}
        >
          <ArrowLeft size={14} />
          Geri Don
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          style={{
            flex: 1,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 10,
            background: submitting ? T.borderLight : T.accent,
            color: submitting ? T.textMuted : '#fff',
            border: 'none',
            fontFamily: T.fontSans, fontSize: 14, fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
            boxShadow: submitting ? 'none' : '0 2px 8px rgba(79,70,229,0.25)',
            transition: 'all 0.14s',
            minHeight: 48,
          }}
          onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={e => { if (!submitting) e.currentTarget.style.opacity = '1'; }}
        >
          {submitting ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Gonderiliyor...
            </>
          ) : (
            <>
              <Send size={16} />
              Degerlendirmeyi Gonder
            </>
          )}
        </button>
      </div>

      {/* ── Fine print ── */}
      <p style={{
        fontFamily: T.fontSans, fontSize: 11, color: T.textFaint,
        textAlign: 'center', margin: 0, lineHeight: 1.6,
      }}>
        Gonderim sonrasi degisiklik yapilamaz. Yanitlariniz degerlendirme icin kurulusla paylasilacaktir.
      </p>
    </div>
  );
}
