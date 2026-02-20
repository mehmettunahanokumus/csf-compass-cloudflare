import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trash2, Upload, Brain, GitCompare, Link2, Copy,
  FileText, Calendar, Building2, BarChart3, ClipboardList, CheckSquare,
  ArrowLeft, MoreHorizontal, MessageSquare,
} from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { evidenceApi } from '../api/evidence';
import { aiApi } from '../api/ai';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type {
  Assessment, AssessmentItem, CsfFunction, VendorAssessmentInvitation, SendInvitationResponse,
} from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import InviteVendorDialog from '../components/InviteVendorDialog';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  card:         'var(--card)',
  border:       'var(--border)',
  text1:        'var(--text-1)',
  text2:        'var(--text-2)',
  text3:        'var(--text-3)',
  bg:           'var(--bg)',
  surface2:     'var(--surface-2)',
  accent:       '#6366F1',
  accentLight:  'rgba(99,102,241,0.08)',
  accentBorder: 'rgba(99,102,241,0.25)',
  success:      '#16A34A',
  successLight: 'rgba(22,163,74,0.08)',
  successBorder:'rgba(22,163,74,0.25)',
  warning:      '#D97706',
  warningLight: 'rgba(217,119,6,0.08)',
  warningBorder:'rgba(217,119,6,0.25)',
  danger:       '#DC2626',
  dangerLight:  'rgba(220,38,38,0.08)',
  dangerBorder: 'rgba(220,38,38,0.25)',
  font:         'Manrope, sans-serif',
  mono:         'JetBrains Mono, monospace',
};

// Avatar color seeded from assessment name
const AVATAR_COLORS = ['#6366F1','#0EA5E9','#16A34A','#D97706','#EC4899','#8B5CF6','#14B8A6','#F97316'];
function avatarColor(name: string) { return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length]; }

function scoreColor(score: number) {
  if (score >= 80) return T.success;
  if (score >= 50) return T.warning;
  return T.danger;
}

// ─── Badge components ──────────────────────────────────────────────────────────
function AssessmentStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    draft:       { bg: 'rgba(100,116,139,0.12)', color: '#94A3B8', label: 'Draft' },
    in_progress: { bg: T.accentLight,            color: T.accent,  label: 'In Progress' },
    completed:   { bg: T.successLight,           color: T.success, label: 'Completed' },
  };
  const s = map[status] || { bg: 'rgba(100,116,139,0.12)', color: '#94A3B8', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontFamily: T.font, fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

function TypeBadge({ assessment }: { assessment: Assessment }) {
  const isOrg   = assessment.assessment_type === 'organization';
  const isGroup = !isOrg && !!assessment.vendor?.group_id;
  const s = isOrg
    ? { bg: 'rgba(99,102,241,0.12)',  color: '#6366F1', label: 'Self' }
    : isGroup
    ? { bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6', label: 'Group Company' }
    : { bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6', label: 'Vendor' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontFamily: T.font, fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 4,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

function ItemStatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    compliant:      { bg: T.successLight,              color: T.success, label: 'Compliant' },
    partial:        { bg: T.warningLight,              color: T.warning, label: 'Partial' },
    non_compliant:  { bg: T.dangerLight,               color: T.danger,  label: 'Non-Compliant' },
    not_applicable: { bg: 'rgba(100,116,139,0.08)',    color: '#94A3B8', label: 'N/A' },
    not_assessed:   { bg: 'rgba(100,116,139,0.08)',    color: '#94A3B8', label: 'Not Assessed' },
  };
  const s = map[status] || { bg: 'rgba(100,116,139,0.08)', color: '#94A3B8', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', flexShrink: 0,
      fontFamily: T.font, fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20,
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

function InvitationBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    completed: { bg: T.successLight, color: T.success },
    accessed:  { bg: T.accentLight,  color: T.accent  },
    pending:   { bg: T.warningLight, color: T.warning  },
    expired:   { bg: T.dangerLight,  color: T.danger   },
    revoked:   { bg: T.dangerLight,  color: T.danger   },
  };
  const s = map[status] || { bg: 'rgba(100,116,139,0.08)', color: '#94A3B8' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontFamily: T.font, fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20,
      background: s.bg, color: s.color,
    }}>{status}</span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment]   = useState<Assessment | null>(null);
  const [functions, setFunctions]     = useState<CsfFunction[]>([]);
  const [items, setItems]             = useState<AssessmentItem[]>([]);
  const [invitation, setInvitation]   = useState<VendorAssessmentInvitation | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [analyzingItem, setAnalyzingItem] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showVendorLink, setShowVendorLink] = useState(false);
  const [copiedLink, setCopiedLink]   = useState(false);
  const [deleteOpen, setDeleteOpen]   = useState(false);
  const [activeTab, setActiveTab]     = useState<'overview' | 'items' | 'vendor'>('overview');
  const [showMenu, setShowMenu]       = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadData(); loadInvitation(); }, [id]);
  useEffect(() => { if (selectedFunction && id) loadItems(selectedFunction); }, [selectedFunction, id]);

  // Close overflow menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [assessmentData, functionsData] = await Promise.all([
        assessmentsApi.get(id),
        csfApi.getFunctions(),
      ]);
      setAssessment(assessmentData);
      setFunctions(functionsData);
      if (functionsData.length > 0 && !selectedFunction) setSelectedFunction(functionsData[0].id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (functionId: string) => {
    if (!id) return;
    try {
      setItems(await assessmentsApi.getItems(id, functionId));
    } catch (err) { setError(getErrorMessage(err)); }
  };

  const loadInvitation = async () => {
    if (!id) return;
    try { setInvitation(await vendorInvitationsApi.getInvitation(id)); } catch { /* none */ }
  };

  const handleSendInvitation = (_response: SendInvitationResponse) => {
    loadInvitation();
    setShowVendorLink(true);
  };

  const handleCopyLink = async () => {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/vendor-portal/${invitation.access_token}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch { alert('Failed to copy link to clipboard'); }
  };

  const handleStatusChange = async (itemId: string, status: string) => {
    if (!id) return;
    try {
      await assessmentsApi.updateItem(id, itemId, { status: status as any });
      await Promise.all([loadItems(selectedFunction), loadData()]);
    } catch (err) { alert(getErrorMessage(err)); }
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    if (!id) return;
    try {
      setUploadingFor(itemId);
      await evidenceApi.upload(file, id, itemId);
      alert('File uploaded successfully!');
    } catch (err) { alert(getErrorMessage(err)); } finally { setUploadingFor(null); }
  };

  const handleAnalyze = async (item: AssessmentItem) => {
    if (!id) return;
    try {
      setAnalyzingItem(item.id);
      const result = await aiApi.analyzeEvidence({
        assessment_item_id: item.id,
        subcategory_code: item.subcategory?.id || '',
        subcategory_description: item.subcategory?.description || '',
        evidence_notes: item.notes || '',
        file_names: [],
        current_status: item.status || 'not_assessed',
      });
      alert(`AI Analysis Complete!\n\nSuggested Status: ${result.result.suggestedStatus}\nConfidence: ${(result.result.confidenceScore * 100).toFixed(0)}%\n\nReasoning: ${result.result.reasoning}`);
      await loadItems(selectedFunction);
    } catch (err) { alert(getErrorMessage(err)); } finally { setAnalyzingItem(null); }
  };

  const handleDelete = async () => {
    if (!id) return;
    try { await assessmentsApi.delete(id); navigate('/assessments'); } catch (err) { alert(getErrorMessage(err)); }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ height: 14, width: 160, background: T.surface2, borderRadius: 6 }} />
        <div style={{ height: 108, background: T.surface2, borderRadius: 14 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 84, background: T.surface2, borderRadius: 12 }} />)}
        </div>
        <div style={{ height: 300, background: T.surface2, borderRadius: 12 }} />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div style={{ padding: 16, borderRadius: 12, background: T.dangerLight, border: `1px solid ${T.dangerBorder}` }}>
        <p style={{ fontFamily: T.font, fontSize: 13, color: T.danger, margin: 0 }}>
          {error || 'Assessment not found'}
        </p>
      </div>
    );
  }

  const score   = assessment.overall_score ?? 0;
  const stats   = assessment.stats || { compliant: 0, partial: 0, nonCompliant: 0, notAssessed: 0, notApplicable: 0, total: 120, assessed: 0, completionPercentage: 0 };
  const total   = stats.total || 120;
  const isVendor = assessment.assessment_type === 'vendor';
  const color   = avatarColor(assessment.name);

  const compliantPct    = total > 0 ? (stats.compliant    / total) * 100 : 0;
  const partialPct      = total > 0 ? (stats.partial      / total) * 100 : 0;
  const nonCompliantPct = total > 0 ? (stats.nonCompliant / total) * 100 : 0;
  const restPct         = Math.max(0, 100 - compliantPct - partialPct - nonCompliantPct);

  const TABS: { key: 'overview' | 'items' | 'vendor'; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'items',    label: 'Items' },
    { key: 'vendor',   label: 'Vendor Response' },
  ];

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8,
    background: T.card, border: `1px solid ${T.border}`,
    fontFamily: T.font, fontSize: 13, fontWeight: 500,
    color: T.text2, cursor: 'pointer',
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Back button ── */}
      <button
        onClick={() => navigate('/assessments')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start',
          fontFamily: T.font, fontSize: 13, color: T.text2, padding: '4px 0',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.text1}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.text2}
      >
        <ArrowLeft size={15} /> Back to Assessments
      </button>

      {/* ── Header card ── */}
      <div style={{
        background: T.card, border: `1px solid ${T.border}`,
        borderRadius: 14, padding: '20px 24px',
        display: 'flex', gap: 18, alignItems: 'flex-start',
      }}>
        {/* Letter avatar */}
        <div style={{
          width: 52, height: 52, borderRadius: 14, flexShrink: 0,
          background: `${color}1A`, border: `1.5px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: T.font, fontSize: 20, fontWeight: 800, color }}>{assessment.name.charAt(0).toUpperCase()}</span>
        </div>

        {/* Name + badges + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <h1 style={{ fontFamily: T.font, fontSize: 20, fontWeight: 800, color: T.text1, margin: 0, letterSpacing: '-0.01em' }}>
              {assessment.name}
            </h1>
            <TypeBadge assessment={assessment} />
            <AssessmentStatusBadge status={assessment.status} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.text3 }}>NIST CSF 2.0</span>
            <span style={{ color: T.text3, fontSize: 11 }}>·</span>
            <span style={{ fontFamily: T.mono, fontSize: 11, color: T.text3 }}>
              Created {formatDate(assessment.created_at)}
            </span>
            {assessment.vendor && (
              <>
                <span style={{ color: T.text3, fontSize: 11 }}>·</span>
                <span style={{
                  fontFamily: T.font, fontSize: 11, fontWeight: 500,
                  padding: '2px 8px', borderRadius: 4,
                  background: T.surface2, color: T.text2,
                }}>
                  {assessment.vendor.name}
                </span>
              </>
            )}
            {assessment.description && (
              <>
                <span style={{ color: T.text3, fontSize: 11 }}>·</span>
                <span style={{
                  fontFamily: T.font, fontSize: 11, color: T.text3,
                  maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {assessment.description}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
          <button
            onClick={() => navigate(`/assessments/${id}/wizard`)}
            style={btnBase}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.accentBorder; el.style.color = T.accent; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.border; el.style.color = T.text2; }}
          >
            <ClipboardList size={14} /> Wizard
          </button>
          <button
            onClick={() => navigate(`/assessments/${id}/checklist`)}
            style={btnBase}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.accentBorder; el.style.color = T.accent; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.border; el.style.color = T.text2; }}
          >
            <CheckSquare size={14} /> Checklist
          </button>
          <button
            onClick={() => navigate(`/assessments/${id}/report`)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: T.accent, border: 'none',
              fontFamily: T.font, fontSize: 13, fontWeight: 600, color: '#FFF', cursor: 'pointer',
            }}
          >
            <FileText size={14} /> Report
          </button>

          {/* ⋮ overflow menu */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 34, height: 34, borderRadius: 8,
                background: T.card, border: `1px solid ${T.border}`,
                color: T.text2, cursor: 'pointer',
              }}
            >
              <MoreHorizontal size={16} />
            </button>
            {showMenu && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: 4,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 50, minWidth: 180,
              }}>
                {isVendor && !invitation && (
                  <button
                    onClick={() => { setShowMenu(false); setShowInviteDialog(true); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', fontFamily: T.font, fontSize: 13, color: T.text2, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.accentLight}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                  >
                    <Link2 size={13} /> Create Vendor Link
                  </button>
                )}
                {isVendor && invitation && (
                  <button
                    onClick={() => { setShowMenu(false); setShowVendorLink(v => !v); setActiveTab('vendor'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', fontFamily: T.font, fontSize: 13, color: T.text2, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.accentLight}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                  >
                    <Link2 size={13} /> Show Vendor Link
                  </button>
                )}
                {isVendor && invitation?.invitation_status === 'completed' && (
                  <button
                    onClick={() => { setShowMenu(false); navigate(`/assessments/${id}/comparison`); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', fontFamily: T.font, fontSize: 13, color: T.text2, cursor: 'pointer', textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.accentLight}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                  >
                    <GitCompare size={13} /> View Comparison
                  </button>
                )}
                {(isVendor) && <div style={{ height: 1, background: T.border, margin: '4px 0' }} />}
                <button
                  onClick={() => { setShowMenu(false); setDeleteOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none', background: 'none', fontFamily: T.font, fontSize: 13, color: T.danger, cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.dangerLight}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                >
                  <Trash2 size={13} /> Delete Assessment
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          {
            label: 'Overall Score',
            value: score > 0 ? `${score.toFixed(0)}%` : '—',
            sub: score > 0 ? (score >= 80 ? 'Good compliance' : score >= 50 ? 'Needs improvement' : 'High risk') : 'Not scored yet',
            color: score > 0 ? scoreColor(score) : T.text3,
          },
          { label: 'Compliant',     value: stats.compliant,    sub: `of ${total} controls`, color: T.success },
          { label: 'Partial',       value: stats.partial,      sub: `of ${total} controls`, color: T.warning },
          { label: 'Non-Compliant', value: stats.nonCompliant, sub: `of ${total} controls`, color: T.danger  },
        ].map(s => (
          <div key={s.label} style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 12, padding: '16px 20px',
          }}>
            <div style={{ fontFamily: T.font, fontSize: 11, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: T.mono, fontSize: 26, fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontFamily: T.font, fontSize: 11, color: T.text3, marginTop: 4 }}>
              {s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, marginBottom: 4 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: T.font, fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.accent : T.text2,
                  borderBottom: isActive ? `2px solid ${T.accent}` : '2px solid transparent',
                  marginBottom: -1, transition: 'all 0.14s',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ════════════════════════════ OVERVIEW TAB ════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Compliance distribution */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontFamily: T.font, fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Compliance Distribution
            </div>
            {/* Stacked bar */}
            <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', marginBottom: 18, gap: 2 }}>
              {compliantPct    > 0 && <div style={{ width: `${compliantPct}%`,    background: T.success,   borderRadius: '4px 0 0 4px', flexShrink: 0 }} />}
              {partialPct      > 0 && <div style={{ width: `${partialPct}%`,      background: T.warning,   flexShrink: 0 }} />}
              {nonCompliantPct > 0 && <div style={{ width: `${nonCompliantPct}%`, background: T.danger,    flexShrink: 0 }} />}
              {restPct         > 0 && <div style={{ width: `${restPct}%`,         background: T.surface2,  borderRadius: '0 4px 4px 0', flexShrink: 0 }} />}
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { label: 'Compliant',     value: stats.compliant,    color: T.success  },
                { label: 'Partial',       value: stats.partial,      color: T.warning  },
                { label: 'Non-Compliant', value: stats.nonCompliant, color: T.danger   },
                { label: 'Not Assessed',  value: stats.notAssessed,  color: '#94A3B8'  },
                { label: 'N/A',           value: stats.notApplicable,color: '#CBD5E1'  },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: T.font, fontSize: 12, color: T.text2 }}>{item.label}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment tools */}
          <div>
            <div style={{ fontFamily: T.font, fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Assessment Tools
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { icon: ClipboardList, title: 'Data Collection Wizard', desc: 'Step-by-step guided assessment across all 15 control areas', to: `/assessments/${id}/wizard`, color: '#8B5CF6' },
                { icon: CheckSquare,   title: 'Compliance Checklist',   desc: 'Review and update all 120 subcategories and their status',   to: `/assessments/${id}/checklist`, color: T.success },
                { icon: FileText,      title: 'Assessment Report',      desc: 'Full structured report with scoring breakdown and export',    to: `/assessments/${id}/report`,    color: T.accent  },
              ].map(c => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.title}
                    onClick={() => navigate(c.to)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: '20px 22px', borderRadius: 12, textAlign: 'left',
                      background: T.card, border: `1px solid ${T.border}`,
                      cursor: 'pointer', transition: 'all 0.14s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = 'translateY(-2px)';
                      el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                      el.style.borderColor = `${c.color}40`;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.transform = 'none';
                      el.style.boxShadow = 'none';
                      el.style.borderColor = T.border;
                    }}
                  >
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, marginBottom: 14,
                      background: `${c.color}12`, border: `1px solid ${c.color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={20} style={{ color: c.color }} />
                    </div>
                    <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 6 }}>
                      {c.title}
                    </div>
                    <div style={{ fontFamily: T.font, fontSize: 12, color: T.text2, lineHeight: 1.5 }}>
                      {c.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontFamily: T.font, fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              Details
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {([
                { icon: FileText,   label: 'Type',         value: isVendor ? 'Vendor Assessment' : 'Organization Assessment' },
                { icon: BarChart3,  label: 'Framework',    value: 'NIST CSF 2.0' },
                { icon: Calendar,   label: 'Created',      value: formatDate(assessment.created_at) },
                { icon: Calendar,   label: 'Last Updated', value: formatDate(assessment.updated_at) },
                ...(assessment.vendor ? [{ icon: Building2, label: 'Vendor', value: assessment.vendor.name }] : []),
                ...(assessment.completed_at ? [{ icon: Calendar, label: 'Completed', value: formatDate(assessment.completed_at) }] : []),
              ] as { icon: React.ElementType; label: string; value: string }[]).map(row => {
                const Icon = row.icon;
                return (
                  <div key={row.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <Icon size={14} style={{ color: T.text3, flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                        {row.label}
                      </div>
                      <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.text1 }}>
                        {row.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {assessment.description && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Description
                </div>
                <div style={{ fontFamily: T.font, fontSize: 13, color: T.text2, lineHeight: 1.6 }}>
                  {assessment.description}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════ ITEMS TAB ════════════════════════════ */}
      {activeTab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Function selector */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {functions.map(func => {
              const isActive = selectedFunction === func.id;
              return (
                <button
                  key={func.id}
                  onClick={() => setSelectedFunction(func.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, whiteSpace: 'nowrap', flexShrink: 0,
                    border: isActive ? 'none' : `1px solid ${T.border}`,
                    background: isActive ? T.accent : T.card,
                    color: isActive ? '#FFF' : T.text2,
                    fontFamily: T.font, fontSize: 13, fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer', transition: 'all 0.14s',
                  }}
                >
                  {func.name}
                </button>
              );
            })}
          </div>

          {/* Item cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => (
              <div
                key={item.id}
                style={{
                  background: T.card, border: `1px solid ${T.border}`,
                  borderRadius: 12, padding: 20, transition: 'box-shadow 0.14s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'none'}
              >
                {/* Top: ID + description + badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: T.mono, fontSize: 12, fontWeight: 600, color: T.accent, marginBottom: 6 }}>
                      {item.subcategory?.id}
                    </div>
                    <div style={{ fontFamily: T.font, fontSize: 13, color: T.text2, lineHeight: 1.6 }}>
                      {item.subcategory?.description}
                    </div>
                    {item.ai_suggested_status && (
                      <div style={{
                        marginTop: 10, padding: '8px 12px', borderRadius: 8,
                        background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                      }}>
                        <Brain size={13} style={{ color: T.accent, flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <span style={{ fontFamily: T.font, fontSize: 12, fontWeight: 600, color: T.accent }}>
                            AI Suggestion: <strong>{item.ai_suggested_status}</strong>
                            &nbsp;({(item.ai_confidence_score! * 100).toFixed(0)}% confidence)
                          </span>
                          {item.ai_reasoning && (
                            <div style={{ fontFamily: T.font, fontSize: 12, color: T.text2, marginTop: 4 }}>
                              {item.ai_reasoning}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <ItemStatusBadge status={item.status || 'not_assessed'} />
                </div>

                {/* Bottom: controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 14, borderTop: `1px solid ${T.border}` }}>
                  <div>
                    <label style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                      Status
                    </label>
                    <select
                      value={item.status || 'not_assessed'}
                      onChange={e => handleStatusChange(item.id, e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: 8,
                        background: T.bg, border: `1px solid ${T.border}`,
                        fontFamily: T.font, fontSize: 13, color: T.text1,
                        outline: 'none', cursor: 'pointer',
                      }}
                    >
                      <option value="not_assessed">Not Assessed</option>
                      <option value="compliant">Compliant</option>
                      <option value="partial">Partially Compliant</option>
                      <option value="non_compliant">Non-Compliant</option>
                      <option value="not_applicable">Not Applicable</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontFamily: T.mono, fontSize: 10, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Evidence
                      </label>
                      <label style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        width: '100%', padding: '7px 0', borderRadius: 8,
                        background: T.bg, border: `1px solid ${T.border}`,
                        fontFamily: T.font, fontSize: 13, color: T.text2, cursor: 'pointer',
                      }}>
                        <Upload size={13} />
                        {uploadingFor === item.id ? 'Uploading…' : 'Upload File'}
                        <input
                          type="file" style={{ display: 'none' }}
                          onChange={e => e.target.files?.[0] && handleFileUpload(item.id, e.target.files[0])}
                          disabled={uploadingFor === item.id}
                        />
                      </label>
                    </div>
                    <button
                      onClick={() => handleAnalyze(item)}
                      disabled={analyzingItem === item.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 12px', borderRadius: 8, flexShrink: 0,
                        background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                        fontFamily: T.font, fontSize: 13, fontWeight: 500, color: T.accent,
                        cursor: analyzingItem === item.id ? 'not-allowed' : 'pointer',
                        opacity: analyzingItem === item.id ? 0.6 : 1,
                      }}
                    >
                      <Brain size={13} />
                      {analyzingItem === item.id ? 'Analyzing…' : 'AI'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════ VENDOR TAB ════════════════════════════ */}
      {activeTab === 'vendor' && (
        <div>
          {!isVendor ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: T.surface2, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageSquare size={22} style={{ color: T.text3 }} />
              </div>
              <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.text1 }}>
                Not a Vendor Assessment
              </div>
              <div style={{ fontFamily: T.font, fontSize: 13, color: T.text2, textAlign: 'center', maxWidth: 300 }}>
                Vendor responses are only available for vendor type assessments.
              </div>
            </div>
          ) : !invitation ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 12 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Link2 size={22} style={{ color: T.accent }} />
              </div>
              <div style={{ fontFamily: T.font, fontSize: 15, fontWeight: 700, color: T.text1 }}>
                No Vendor Invitation Sent
              </div>
              <div style={{ fontFamily: T.font, fontSize: 13, color: T.text2, textAlign: 'center', maxWidth: 320 }}>
                Create a vendor link to allow {assessment.vendor?.name || 'the vendor'} to complete their self-assessment.
              </div>
              <button
                onClick={() => setShowInviteDialog(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 20px', borderRadius: 8, marginTop: 8,
                  background: T.accent, border: 'none',
                  fontFamily: T.font, fontSize: 13, fontWeight: 600, color: '#FFF', cursor: 'pointer',
                }}
              >
                <Link2 size={14} /> Create Vendor Link
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Vendor link panel */}
              {showVendorLink && (
                <div style={{
                  background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                  borderLeft: `4px solid ${T.accent}`,
                  borderRadius: 12, padding: '18px 22px',
                }}>
                  <div style={{ fontFamily: T.font, fontSize: 14, fontWeight: 700, color: T.text1, marginBottom: 4 }}>
                    Vendor Assessment Link
                  </div>
                  <div style={{ fontFamily: T.font, fontSize: 12, color: T.text2, marginBottom: 14, lineHeight: 1.6 }}>
                    Share this link with {assessment.vendor?.name || 'the vendor'}. Valid until {formatDate(invitation.token_expires_at)}.
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={`${window.location.origin}/vendor-portal/${invitation.access_token}`}
                      readOnly
                      onClick={e => e.currentTarget.select()}
                      style={{
                        flex: 1, padding: '7px 10px', borderRadius: 8,
                        background: T.card, border: `1px solid ${T.border}`,
                        fontFamily: T.mono, fontSize: 12, color: T.text2, outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleCopyLink}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 8, flexShrink: 0,
                        background: T.card, border: `1px solid ${T.border}`,
                        fontFamily: T.font, fontSize: 13, color: T.text2, cursor: 'pointer',
                      }}
                    >
                      <Copy size={13} /> {copiedLink ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Invitation status card */}
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontFamily: T.font, fontSize: 11, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 18 }}>
                  Invitation Status
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {([
                    { label: 'Status',        renderValue: () => <InvitationBadge status={invitation.invitation_status} /> },
                    { label: 'Sent',          value: formatDate(invitation.sent_at) },
                    ...(invitation.accessed_at  ? [{ label: 'First Accessed', value: formatDate(invitation.accessed_at)  }] : []),
                    ...(invitation.completed_at ? [{ label: 'Completed',      value: formatDate(invitation.completed_at) }] : []),
                    { label: 'Expires',       value: formatDate(invitation.token_expires_at) },
                  ] as any[]).map((item: any) => (
                    <div key={item.label}>
                      <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.text3, marginBottom: 6 }}>
                        {item.label}
                      </div>
                      {item.renderValue ? item.renderValue() : (
                        <div style={{ fontFamily: T.font, fontSize: 13, fontWeight: 600, color: T.text1 }}>
                          {item.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {invitation.message && (
                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.text3, marginBottom: 8 }}>
                      Custom Message
                    </div>
                    <div style={{ fontFamily: T.font, fontSize: 13, color: T.text2, lineHeight: 1.6 }}>
                      {invitation.message}
                    </div>
                  </div>
                )}
                {/* Actions */}
                <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setShowVendorLink(v => !v)}
                    style={btnBase}
                  >
                    <Link2 size={13} /> {showVendorLink ? 'Hide Link' : 'Show Link'}
                  </button>
                  {invitation.invitation_status === 'completed' && (
                    <button
                      onClick={() => navigate(`/assessments/${id}/comparison`)}
                      style={btnBase}
                    >
                      <GitCompare size={13} /> View Comparison
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dialogs */}
      <InviteVendorDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSend={handleSendInvitation}
        assessmentId={id || ''}
        assessmentName={assessment?.name || ''}
        vendorEmail={assessment?.vendor?.contact_email}
        vendorName={assessment?.vendor?.name}
      />
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Assessment?"
        description="This will permanently delete this assessment and all associated items and evidence. This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
