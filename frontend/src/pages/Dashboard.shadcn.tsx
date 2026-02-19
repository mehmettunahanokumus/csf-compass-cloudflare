import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Building2, AlertTriangle, TrendingUp, Plus,
  Target, CheckCircle2, Clock, ArrowRight, FileText, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { assessmentsApi } from '../api/assessments';
import { vendorsApi } from '../api/vendors';
import type { Assessment, Vendor } from '../types';
import { getErrorMessage } from '../api/client';
import { T, card, sectionLabel } from '../tokens';

// ── Static data ───────────────────────────────────────────────
const csfData = [
  { label: 'GV', full: 'Govern',   score: 85 },
  { label: 'ID', full: 'Identify', score: 72 },
  { label: 'PR', full: 'Protect',  score: 68 },
  { label: 'DE', full: 'Detect',   score: 55 },
  { label: 'RS', full: 'Respond',  score: 48 },
  { label: 'RC', full: 'Recover',  score: 40 },
];

const recentActivity = [
  { id: 1, text: 'Assessment completed',         sub: 'TechCorp Solutions',  time: '2h ago',  dot: T.success  },
  { id: 2, text: 'High-risk finding identified', sub: 'DataFlow Inc',        time: '5h ago',  dot: T.warning  },
  { id: 3, text: 'Vendor invited to assessment', sub: 'CloudSec Systems',    time: '1d ago',  dot: T.accent   },
  { id: 4, text: 'Evidence uploaded',            sub: 'Internal Assessment', time: '2d ago',  dot: T.success  },
];

// ── Helpers ───────────────────────────────────────────────────
function scoreColor(s: number | null | undefined) {
  if (s == null) return T.textFaint;
  if (s >= 70)   return T.success;
  if (s >= 50)   return T.warning;
  return T.danger;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
      padding: '8px 12px', boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
      fontFamily: T.fontSans,
    }}>
      <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: T.accent, fontFamily: T.fontDisplay }}>
        {payload[0].value}%
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    completed:   { bg: T.successLight, color: T.success, label: 'Completed'   },
    in_progress: { bg: T.accentLight,  color: T.accent,  label: 'In Progress' },
    draft:       { bg: 'rgba(148,163,184,0.1)', color: T.textSecondary, label: 'Draft' },
  };
  const c = cfg[status] ?? cfg.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 9px', borderRadius: 100,
      fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color,
    }}>
      {c.label}
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Dashboard() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [vendors,     setVendors]     = useState<Vendor[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [aData, vData] = await Promise.all([
        assessmentsApi.list(),
        vendorsApi.list().catch(() => [] as Vendor[]),
      ]);
      setAssessments(aData);
      setVendors(vData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const completed  = assessments.filter(a => a.status === 'completed');
  const inProgress = assessments.filter(a => a.status === 'in_progress');
  const drafts     = assessments.filter(a => a.status === 'draft');
  const highRisk   = vendors.filter(v => (v.latest_assessment_score ?? 100) < 50);
  const avgScore   = completed.length > 0
    ? Math.round(completed.reduce((s, a) => s + (a.overall_score ?? 0), 0) / completed.length)
    : 0;

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ height: 34, borderRadius: 8, background: T.border, width: 200 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ height: 108, borderRadius: 12, background: T.border, opacity: 0.5 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ height: 228, borderRadius: 12, background: T.border, opacity: 0.4 }} />
          <div style={{ height: 228, borderRadius: 12, background: T.border, opacity: 0.4 }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...card, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
        background: T.dangerLight, borderColor: 'rgba(220,38,38,0.2)' }}>
        <AlertTriangle size={18} style={{ color: T.danger, flexShrink: 0 }} />
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>
      </div>
    );
  }

  const kpis = [
    {
      icon: <Shield size={18} />,
      value: assessments.length,
      label: 'Total Assessments',
      color: T.accent,
      sub: `${completed.length} completed`,
    },
    {
      icon: <Building2 size={18} />,
      value: vendors.length,
      label: 'Active Vendors',
      color: T.sky,
      sub: `${highRisk.length} high risk`,
    },
    {
      icon: <Target size={18} />,
      value: `${avgScore}%`,
      label: 'Avg Compliance',
      color: scoreColor(avgScore),
      sub: completed.length > 0
        ? <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: T.success }}><TrendingUp size={10} /> Up this period</span>
        : 'No data yet',
    },
    {
      icon: <AlertTriangle size={18} />,
      value: highRisk.length,
      label: 'Critical Findings',
      color: highRisk.length > 0 ? T.danger : T.success,
      sub: highRisk.length > 0 ? 'Require attention' : 'All vendors OK',
    },
  ];

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            Security Overview
          </h1>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, marginTop: 3 }}>
            NIST CSF 2.0 compliance dashboard
          </p>
        </div>
        <Link to="/assessments/new" style={{ textDecoration: 'none' }}>
          <button
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 18px', borderRadius: 9,
              background: T.accent, color: '#fff',
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(79,70,229,0.3), 0 0 0 1px rgba(79,70,229,0.1)',
              transition: 'background 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#4338CA'; b.style.boxShadow = '0 4px 12px rgba(79,70,229,0.35)'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = T.accent; b.style.boxShadow = '0 1px 3px rgba(79,70,229,0.3), 0 0 0 1px rgba(79,70,229,0.1)'; }}
          >
            <Plus size={15} /> New Assessment
          </button>
        </Link>
      </div>

      {/* ── KPI Cards ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {kpis.map((k, i) => (
          <div
            key={i}
            className="animate-fade-in-up"
            style={{
              ...card,
              animationDelay: `${i * 60}ms`,
              padding: '18px 20px',
              transition: 'box-shadow 0.2s, transform 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 6px 20px rgba(15,23,42,0.1)'; el.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)'; el.style.transform = 'translateY(0)'; }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: `${k.color}12`, border: `1px solid ${k.color}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: k.color, marginBottom: 14,
            }}>
              {k.icon}
            </div>
            <div style={{ fontFamily: T.fontDisplay, fontSize: 36, fontWeight: 700, color: k.color, lineHeight: 1, letterSpacing: '-0.01em', marginBottom: 4 }}>
              {k.value}
            </div>
            <div style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.textMuted, marginBottom: 4 }}>
              {k.label}
            </div>
            <div style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textFaint }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts row ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Bar chart */}
        <div style={{ ...card, padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
            <span style={sectionLabel}>CSF Framework Coverage</span>
          </div>
          <ResponsiveContainer width="100%" height={172}>
            <BarChart data={csfData} barSize={22} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} vertical={false} />
              <XAxis dataKey="label" tick={{ fill: T.textMuted, fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: T.textMuted, fontSize: 10, fontFamily: 'Manrope' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: T.accentLight }} />
              <Bar dataKey="score" fill={T.accent} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Activity feed */}
        <div style={{ ...card, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
            <span style={sectionLabel}>Recent Activity</span>
            <div style={{ marginLeft: 'auto' }}>
              <Activity size={13} style={{ color: T.textFaint }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentActivity.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '10px 0',
                  borderBottom: idx < recentActivity.length - 1 ? `1px solid ${T.borderLight}` : 'none',
                }}
              >
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: item.dot, marginTop: 5, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textPrimary, lineHeight: 1.4 }}>
                    {item.text}
                  </div>
                  <div style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                    {item.sub}
                  </div>
                </div>
                <div style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textFaint, flexShrink: 0, paddingTop: 2 }}>
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Assessment status strip ──────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { icon: <CheckCircle2 size={16} />, label: 'Completed',   count: completed.length,  color: T.success },
          { icon: <Clock size={16} />,        label: 'In Progress', count: inProgress.length, color: T.accent  },
          { icon: <FileText size={16} />,     label: 'Draft',       count: drafts.length,     color: T.textMuted },
        ].map(s => (
          <div key={s.label} style={{
            ...card, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: `${s.color}10`, border: `1px solid ${s.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.count}
              </div>
              <div style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textMuted, marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent assessments ───────────────────── */}
      <div style={{ ...card, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: `1px solid ${T.borderLight}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
            <span style={sectionLabel}>Recent Assessments</span>
          </div>
          <Link to="/assessments" style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.accent, textDecoration: 'none',
          }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {assessments.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC' }}>
                {['Assessment', 'Type', 'Score', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '9px 20px',
                    fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: T.textMuted, borderBottom: `1px solid ${T.borderLight}`,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assessments.slice(0, 6).map((a, idx) => (
                <Link
                  key={a.id}
                  to={`/assessments/${a.id}`}
                  style={{ textDecoration: 'none', display: 'contents' }}
                >
                  <tr
                    style={{
                      borderBottom: idx < Math.min(assessments.length, 6) - 1 ? `1px solid ${T.borderLight}` : 'none',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#F8FAFC'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textPrimary, display: 'block' }}>
                        {a.name}
                      </span>
                      {a.vendor && (
                        <span style={{
                          display: 'inline-block', marginTop: 4,
                          fontSize: 11, fontWeight: 500, fontFamily: T.fontSans,
                          padding: '1px 6px', borderRadius: 4,
                          background: '#F1F5F9', color: T.textSecondary,
                          maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {a.vendor.name}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      {(() => {
                        const isOrg = a.assessment_type === 'organization';
                        const isGroup = !isOrg && !!a.vendor?.group_id;
                        const tag = isOrg
                          ? { label: 'Self', bg: 'rgba(99,102,241,0.12)', color: '#6366F1' }
                          : isGroup
                          ? { label: 'Group Company', bg: 'rgba(59,130,246,0.12)', color: '#3B82F6' }
                          : { label: 'Vendor', bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' };
                        return (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            fontSize: 11, fontWeight: 600, fontFamily: T.fontSans,
                            padding: '2px 7px', borderRadius: 4,
                            background: tag.bg, color: tag.color,
                          }}>
                            {tag.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <span style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700, color: scoreColor(a.overall_score) }}>
                        {a.overall_score != null ? `${a.overall_score.toFixed(0)}%` : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 20px' }}>
                      <StatusPill status={a.status} />
                    </td>
                  </tr>
                </Link>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} style={{ color: T.textFaint }} />
            </div>
            <p style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 600, color: T.textMuted, margin: 0 }}>No assessments yet</p>
            <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textFaint, margin: 0 }}>Create your first assessment to get started</p>
            <Link to="/assessments/new" style={{ textDecoration: 'none', marginTop: 4 }}>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                background: T.accent, color: '#fff',
                fontFamily: T.fontSans, fontSize: 12, fontWeight: 700,
                border: 'none', cursor: 'pointer',
              }}>
                <Plus size={14} /> Create Assessment
              </button>
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
