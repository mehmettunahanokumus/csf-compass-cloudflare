import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Search, Shield, MoreVertical,
  Eye, Trash2, Send,
  CheckCircle2, Clock, FileText, ArrowRight,
} from 'lucide-react';
import { assessmentsApi } from '@/api/assessments';
import type { Assessment } from '@/types';
import { getErrorMessage } from '@/api/client';
import { T, card } from '../tokens';

// ── Helpers ───────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 70) return T.success;
  if (s >= 50) return T.warning;
  return T.danger;
}

const statusConfig: Record<string, { bg: string; color: string; label: string; icon: React.ReactNode }> = {
  completed:   { bg: T.successLight,             color: T.success,       label: 'Completed',   icon: <CheckCircle2 size={10} /> },
  in_progress: { bg: T.accentLight,              color: T.accent,        label: 'In Progress', icon: <Clock size={10} /> },
  draft:       { bg: 'rgba(148,163,184,0.1)',    color: T.textSecondary, label: 'Draft',       icon: <FileText size={10} /> },
};

function StatusPill({ status }: { status: string }) {
  const c = statusConfig[status] ?? statusConfig.draft;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 100,
      fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color,
    }}>
      {c.icon} {c.label}
    </span>
  );
}

// ── Card skeleton ─────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{ ...card, padding: 20 }} className="animate-pulse">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ width: 64, height: 18, borderRadius: 5, background: T.border }} />
        <div style={{ width: 80, height: 18, borderRadius: 100, background: T.border }} />
      </div>
      <div style={{ width: '75%', height: 16, borderRadius: 5, background: T.border, marginBottom: 8 }} />
      <div style={{ width: '45%', height: 12, borderRadius: 5, background: T.borderLight, marginBottom: 20 }} />
      <div style={{ width: '100%', height: 5, borderRadius: 3, background: T.borderLight, marginBottom: 8 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 14, borderTop: `1px solid ${T.borderLight}` }}>
        <div style={{ width: 70, height: 11, borderRadius: 4, background: T.borderLight }} />
        <div style={{ width: 50, height: 11, borderRadius: 4, background: T.borderLight }} />
      </div>
    </div>
  );
}

// ── Assessment Card ───────────────────────────────────────────
interface CardProps {
  assessment: Assessment;
  onView: () => void;
  onDelete: () => void;
  onSendToVendor: () => void;
}

function AssessmentCard({ assessment, onView, onDelete, onSendToVendor }: CardProps) {
  const score = assessment.overall_score ?? 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered,  setHovered]  = useState(false);

  return (
    <div
      onClick={onView}
      style={{
        ...card,
        padding: 20,
        cursor: 'pointer',
        border: `1px solid ${hovered ? '#CBD5E1' : T.border}`,
        boxShadow: hovered ? '0 6px 20px rgba(15,23,42,0.1)' : '0 1px 3px rgba(15,23,42,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.18s ease',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        {(() => {
          const isOrg = assessment.assessment_type === 'organization';
          const isGroup = !isOrg && !!assessment.vendor?.group_id;
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <StatusPill status={assessment.status} />
          {/* Kebab menu */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                width: 26, height: 26, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: T.textMuted, transition: 'all 0.12s',
              }}
              onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#F1F5F9'; b.style.color = T.textSecondary; }}
              onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'transparent'; b.style.color = T.textMuted; }}
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(false)} />
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
                  width: 164, background: T.card,
                  border: `1px solid ${T.border}`, borderRadius: 10,
                  boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
                  padding: '4px 0', overflow: 'hidden',
                }}>
                  {[
                    { icon: <Eye size={12} />,  label: 'View Details',   action: onView,         color: T.textPrimary },
                    ...(assessment.assessment_type === 'vendor'
                      ? [{ icon: <Send size={12} />, label: 'Send to Vendor', action: onSendToVendor, color: T.accent }]
                      : []),
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setMenuOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        width: '100%', padding: '8px 12px',
                        fontFamily: T.fontSans, fontSize: 12, fontWeight: 500,
                        color: item.color, background: 'transparent', border: 'none', cursor: 'pointer',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F8FAFC'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      {item.icon} {item.label}
                    </button>
                  ))}
                  <div style={{ height: 1, background: T.borderLight, margin: '3px 0' }} />
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '8px 12px',
                      fontFamily: T.fontSans, fontSize: 12, fontWeight: 500,
                      color: T.danger, background: 'transparent', border: 'none', cursor: 'pointer',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.dangerLight; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Name */}
      <div style={{
        fontFamily: T.fontSans, fontSize: 14, fontWeight: 700,
        color: hovered ? T.accent : T.textPrimary,
        transition: 'color 0.15s', marginBottom: 4, lineHeight: 1.35,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {assessment.name}
      </div>

      {/* Company tag */}
      {assessment.vendor ? (
        <div style={{ marginBottom: 16 }}>
          <span style={{
            display: 'inline-block',
            fontSize: 11, fontWeight: 500, fontFamily: T.fontSans,
            padding: '2px 7px', borderRadius: 4,
            background: '#F1F5F9', color: T.textSecondary,
            maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {assessment.vendor.name}
          </span>
        </div>
      ) : (
        <div style={{ height: 16 }} />
      )}

      {/* Score + bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 700, lineHeight: 1, color: score > 0 ? scoreColor(score) : T.textFaint }}>
          {score > 0 ? score.toFixed(0) : '—'}
        </div>
        {score > 0 && (
          <div style={{ fontSize: 13, color: T.textMuted, fontFamily: T.fontSans, alignSelf: 'flex-end', marginBottom: 2 }}>/ 100</div>
        )}
        <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden', marginLeft: 4 }}>
          {score > 0 && (
            <div style={{ width: `${score}%`, height: '100%', borderRadius: 3, background: scoreColor(score), transition: 'width 0.5s ease' }} />
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 14, marginTop: 8, borderTop: `1px solid ${T.borderLight}`,
      }}>
        <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textFaint }}>
          {new Date(assessment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <span style={{
          fontFamily: T.fontSans, fontSize: 11, fontWeight: 700,
          color: hovered ? T.accent : T.textMuted,
          display: 'flex', alignItems: 'center', gap: 3,
          transition: 'color 0.15s',
        }}>
          View <ArrowRight size={11} />
        </span>
      </div>
    </div>
  );
}

// ── Filter tab ────────────────────────────────────────────────
function FilterTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px', borderRadius: 8,
        fontFamily: T.fontSans, fontSize: 12, fontWeight: 600,
        border: 'none', cursor: 'pointer', transition: 'all 0.14s',
        background: active ? T.accent : T.card,
        color:      active ? '#fff' : T.textSecondary,
        boxShadow:  active ? '0 1px 3px rgba(79,70,229,0.3)' : 'none',
        outline:    active ? 'none' : `1px solid ${T.border}`,
      }}
    >
      {label}
    </button>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Assessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all');
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await assessmentsApi.list();
      setAssessments(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await assessmentsApi.delete(id);
      setAssessments(a => a.filter(x => x.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filtered = assessments.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchTab = filter === 'all' || a.assessment_type === filter ||
      (filter === 'completed'  && a.status === 'completed')  ||
      (filter === 'in_progress'&& a.status === 'in_progress')||
      (filter === 'draft'      && a.status === 'draft');
    return matchSearch && matchTab;
  });

  const completed  = assessments.filter(a => a.status === 'completed').length;
  const inProgress = assessments.filter(a => a.status === 'in_progress').length;
  const drafts     = assessments.filter(a => a.status === 'draft').length;

  if (error) {
    return (
      <div style={{ ...card, padding: '16px 20px', background: T.dangerLight, borderColor: 'rgba(220,38,38,0.2)' }}>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            Assessments
          </h1>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, marginTop: 3 }}>
            NIST CSF 2.0 security evaluations
            {assessments.length > 0 && (
              <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textFaint, marginLeft: 8 }}>
                · {assessments.length} total
              </span>
            )}
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
              boxShadow: '0 1px 3px rgba(79,70,229,0.3)',
              transition: 'background 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => { const b = e.currentTarget; b.style.background = '#4338CA'; b.style.boxShadow = '0 4px 12px rgba(79,70,229,0.35)'; }}
            onMouseLeave={e => { const b = e.currentTarget; b.style.background = T.accent;  b.style.boxShadow = '0 1px 3px rgba(79,70,229,0.3)'; }}
          >
            <Plus size={15} /> New Assessment
          </button>
        </Link>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { icon: <CheckCircle2 size={16} />, label: 'Completed',   count: completed,  color: T.success     },
          { icon: <Clock size={16} />,        label: 'In Progress', count: inProgress, color: T.accent      },
          { icon: <FileText size={16} />,     label: 'Draft',       count: drafts,     color: T.textMuted   },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: `${s.color}10`, border: `1px solid ${s.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
            }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {loading ? '—' : s.count}
              </div>
              <div style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textMuted, marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'all',          label: 'All'          },
            { id: 'organization', label: 'Organization'  },
            { id: 'vendor',       label: 'Vendor'        },
            { id: 'completed',    label: 'Completed'     },
            { id: 'in_progress',  label: 'In Progress'   },
            { id: 'draft',        label: 'Draft'         },
          ].map(t => (
            <FilterTab key={t.id} label={t.label} active={filter === t.id} onClick={() => setFilter(t.id)} />
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search assessments..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: 220, paddingLeft: 34, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
              borderRadius: 8, border: `1px solid ${T.border}`,
              fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary,
              background: T.card, outline: 'none',
              boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
              transition: 'border-color 0.15s',
            }}
            onFocus={e => { (e.currentTarget as HTMLInputElement).style.borderColor = '#A5B4FC'; }}
            onBlur={e => { (e.currentTarget as HTMLInputElement).style.borderColor = T.border; }}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          ...card, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '64px 24px', gap: 12,
        }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} style={{ color: T.textFaint }} />
          </div>
          <div style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.textPrimary }}>
            {search || filter !== 'all' ? 'No assessments match filters' : 'No assessments yet'}
          </div>
          <div style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, textAlign: 'center', maxWidth: 300 }}>
            {search || filter !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first security assessment to start evaluating NIST CSF compliance'}
          </div>
          {!search && filter === 'all' && (
            <Link to="/assessments/new" style={{ textDecoration: 'none', marginTop: 4 }}>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 18px', borderRadius: 9,
                background: T.accent, color: '#fff',
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer',
              }}>
                <Plus size={14} /> Create Assessment
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.map((a, i) => (
            <div key={a.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
              <AssessmentCard
                assessment={a}
                onView={() => navigate(`/assessments/${a.id}`)}
                onDelete={() => handleDelete(a.id)}
                onSendToVendor={() => navigate(`/assessments/${a.id}`)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
