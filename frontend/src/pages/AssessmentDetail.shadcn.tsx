import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Trash2, Upload, Brain, GitCompare, Link2, Copy,
  FileText, Calendar, Building2, BarChart3, ClipboardList, MessageSquare, Clock, CheckSquare,
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
import ComplianceChart from '../components/charts/ComplianceChart';
import FunctionScoreChart from '../components/charts/FunctionScoreChart';
import { T, card, sectionLabel } from '../tokens';
const cardStyle = card;

function statusBadgeStyle(status: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    compliant:     { background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` },
    partial:       { background: T.warningLight,  color: T.warning, border: `1px solid ${T.warningBorder}` },
    non_compliant: { background: T.dangerLight,   color: T.danger,  border: `1px solid ${T.dangerBorder}` },
    not_applicable:{ background: '#F1F5F9', color: T.textMuted, border: `1px solid ${T.border}` },
    draft:         { background: '#F1F5F9', color: T.textSecondary, border: `1px solid ${T.border}` },
    in_progress:   { background: T.accentLight, color: T.accent, border: `1px solid ${T.accentBorder}` },
    completed:     { background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` },
    not_assessed:  { background: '#F1F5F9', color: T.textMuted, border: `1px solid ${T.border}` },
  };
  return { ...(map[status] || { background: '#F1F5F9', color: T.textSecondary, border: `1px solid ${T.border}` }),
    fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
    padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center',
  };
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    compliant: 'Compliant', partial: 'Partial', non_compliant: 'Non-Compliant',
    not_applicable: 'N/A', draft: 'Draft', in_progress: 'In Progress',
    completed: 'Completed', not_assessed: 'Not Assessed',
  };
  return map[status] || status;
}

function invitationBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'completed': return { background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` };
    case 'accessed':  return { background: T.accentLight, color: T.accent, border: `1px solid ${T.accentBorder}` };
    case 'pending':   return { background: T.warningLight, color: T.warning, border: `1px solid ${T.warningBorder}` };
    case 'expired':
    case 'revoked':   return { background: T.dangerLight, color: T.danger, border: `1px solid ${T.dangerBorder}` };
    default:          return { background: '#F1F5F9', color: T.textSecondary, border: `1px solid ${T.border}` };
  }
}

function scoreColor(score: number) {
  if (score >= 80) return T.success;
  if (score >= 50) return T.warning;
  return T.danger;
}


export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [invitation, setInvitation] = useState<VendorAssessmentInvitation | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [analyzingItem, setAnalyzingItem] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showVendorLink, setShowVendorLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { loadData(); loadInvitation(); }, [id]);
  useEffect(() => { if (selectedFunction && id) loadItems(selectedFunction); }, [selectedFunction, id]);

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
      const itemsData = await assessmentsApi.getItems(id, functionId);
      setItems(itemsData);
    } catch (err) { setError(getErrorMessage(err)); }
  };

  const loadInvitation = async () => {
    if (!id) return;
    try { setInvitation(await vendorInvitationsApi.getInvitation(id)); } catch { /* none yet */ }
  };

  const handleSendInvitation = (_response: SendInvitationResponse) => { loadInvitation(); setShowVendorLink(true); };

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

  // ── Loading ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ height: 12, width: 120, background: '#E2E8F0', borderRadius: 6 }} />
            <div style={{ height: 28, width: 280, background: '#E2E8F0', borderRadius: 6 }} />
            <div style={{ height: 12, width: 180, background: '#E2E8F0', borderRadius: 6 }} />
          </div>
          <div style={{ height: 64, width: 80, background: '#E2E8F0', borderRadius: 12 }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 36, width: 96, background: '#E2E8F0', borderRadius: 8 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} style={{ height: 96, background: '#E2E8F0', borderRadius: 12 }} />)}
        </div>
        <div style={{ height: 280, background: '#E2E8F0', borderRadius: 12 }} />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div style={{ ...cardStyle, padding: 16, background: T.dangerLight, borderColor: T.dangerBorder }}>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>
          {error || 'Assessment not found'}
        </p>
      </div>
    );
  }

  const score = assessment.overall_score ?? 0;

  const tabs = [
    { value: 'overview', label: 'Overview', icon: BarChart3 },
    { value: 'items', label: 'Items', icon: ClipboardList },
    { value: 'vendor', label: 'Vendor', icon: MessageSquare },
    { value: 'history', label: 'History', icon: Clock },
  ];

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <Link to="/assessments" style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textSecondary}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textMuted}
        >Assessments</Link>
        <span style={{ color: T.textMuted, fontSize: 12 }}>/</span>
        <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>{assessment.name}</span>
      </div>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontFamily: T.fontSans, fontSize: 22, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
              {assessment.name}
            </h1>
            <span style={statusBadgeStyle(assessment.status)}>{statusLabel(assessment.status)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMuted }}>
              Created {formatDate(assessment.created_at)}
            </span>
            {assessment.vendor && (
              <>
                <span style={{ color: T.textMuted }}>·</span>
                <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>{assessment.vendor.name}</span>
              </>
            )}
            <span style={{
              fontFamily: T.fontMono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '2px 8px', borderRadius: 6,
              background: '#F1F5F9', border: `1px solid ${T.border}`, color: T.textMuted,
            }}>
              {assessment.assessment_type}
            </span>
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: T.fontDisplay, fontSize: 52, fontWeight: 700,
            color: score > 0 ? scoreColor(score) : T.textMuted, lineHeight: 1,
          }}>
            {score > 0 ? score.toFixed(0) : '—'}
          </div>
          <div style={{ fontFamily: T.fontSans, fontSize: 10, color: T.textMuted, marginTop: 4, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Overall Score
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
        {assessment.assessment_type === 'vendor' && invitation?.invitation_status === 'completed' && (
          <Link to={`/assessments/${id}/comparison`}>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: T.card, border: `1px solid ${T.border}`,
              fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, cursor: 'pointer',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.accentBorder; el.style.color = T.accent; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = T.border; el.style.color = T.textSecondary; }}
            >
              <GitCompare size={14} /> Compare
            </button>
          </Link>
        )}
        {assessment.assessment_type === 'vendor' && !invitation && (
          <button onClick={() => setShowInviteDialog(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            background: T.accentLight, border: `1px solid ${T.accentBorder}`,
            fontFamily: T.fontSans, fontSize: 13, color: T.accent, cursor: 'pointer',
          }}>
            <Link2 size={14} /> Create Vendor Link
          </button>
        )}
        <button onClick={() => setDeleteOpen(true)} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8,
          background: T.card, border: `1px solid ${T.border}`,
          fontFamily: T.fontSans, fontSize: 13, color: T.danger, cursor: 'pointer',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = T.dangerBorder}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = T.border}
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 4, borderBottom: `2px solid ${T.border}`, marginBottom: 24 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: '6px 6px 0 0',
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: T.fontSans, fontSize: 12, fontWeight: isActive ? 700 : 500,
                color: isActive ? T.accent : T.textSecondary,
                borderBottom: isActive ? `2px solid ${T.accent}` : '2px solid transparent',
                marginBottom: -2, transition: 'all 0.14s',
              }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ======== OVERVIEW TAB ======== */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Compliance Status */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
              <span style={sectionLabel}>Compliance Status</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              {/* Left: Chart + distribution */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ ...cardStyle, padding: 24, display: 'flex', justifyContent: 'center' }}>
                  <ComplianceChart score={score} size="lg" showLabel />
                </div>
                <div style={{ ...cardStyle, padding: 20 }}>
                  <h3 style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 16px' }}>
                    Score Distribution
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                    {[
                      { label: 'Compliant', value: assessment.stats?.compliant || 0, color: T.success },
                      { label: 'Partial', value: assessment.stats?.partial || 0, color: T.warning },
                      { label: 'Non-Compliant', value: assessment.stats?.nonCompliant || 0, color: T.danger },
                      { label: 'Not Assessed', value: assessment.stats?.notAssessed || 0, color: T.textMuted },
                      { label: 'N/A', value: assessment.stats?.notApplicable || 0, color: T.border },
                    ].map((item) => (
                      <div key={item.label} style={{ borderLeft: `3px solid ${item.color}`, paddingLeft: 10 }}>
                        <p style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, color: T.textPrimary, margin: 0, lineHeight: 1 }}>
                          {item.value}
                        </p>
                        <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary, margin: '4px 0 0' }}>
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Details + Quick Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ ...cardStyle, padding: 20 }}>
                  <h3 style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 16px' }}>
                    Details
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                      {
                        icon: FileText,
                        label: 'Type',
                        value: assessment.assessment_type === 'vendor' ? 'Vendor Assessment' : 'Organization Assessment',
                      },
                      ...(assessment.vendor ? [{
                        icon: Building2,
                        label: 'Vendor',
                        value: assessment.vendor.name,
                        sub: assessment.vendor.contact_email,
                      }] : []),
                      { icon: Calendar, label: 'Created', value: formatDate(assessment.created_at) },
                      { icon: BarChart3, label: 'Overall Score', value: score > 0 ? `${score.toFixed(1)}%` : '0.0%', isScore: true },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} style={{ display: 'flex', gap: 12 }}>
                          <Icon size={14} style={{ color: T.textMuted, flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <p style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 3px' }}>
                              {item.label}
                            </p>
                            <p style={{
                              fontFamily: item.isScore ? T.fontDisplay : T.fontSans,
                              fontSize: item.isScore ? 22 : 13,
                              fontWeight: item.isScore ? 700 : 600,
                              color: item.isScore ? scoreColor(score) : T.textPrimary,
                              margin: 0,
                            }}>
                              {item.value}
                            </p>
                            {(item as any).sub && (
                              <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, margin: '2px 0 0' }}>
                                {(item as any).sub}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {assessment.description && (
                      <div style={{ paddingTop: 12, borderTop: `1px solid ${T.border}` }}>
                        <p style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' }}>
                          Description
                        </p>
                        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>
                          {assessment.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions - vendor assessments only */}
                {assessment.assessment_type === 'vendor' && (
                  <div style={{ ...cardStyle, padding: 20 }}>
                    <h3 style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 12px' }}>
                      Quick Actions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {!invitation ? (
                        <button onClick={() => setShowInviteDialog(true)} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          width: '100%', padding: '9px 0', borderRadius: 8,
                          background: T.accent, border: 'none',
                          fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: '#FFF', cursor: 'pointer',
                        }}>
                          <Link2 size={14} /> Create Vendor Link
                        </button>
                      ) : (
                        <>
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 12px', background: T.bg, borderRadius: 8,
                          }}>
                            <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>
                              Invitation Status
                            </span>
                            <span style={{ ...invitationBadgeStyle(invitation.invitation_status), fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                              {invitation.invitation_status}
                            </span>
                          </div>
                          <button onClick={() => setShowVendorLink(!showVendorLink)} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            width: '100%', padding: '8px 0', borderRadius: 8,
                            background: T.card, border: `1px solid ${T.border}`,
                            fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, cursor: 'pointer',
                          }}>
                            <Link2 size={13} /> {showVendorLink ? 'Hide' : 'Show'} Vendor Link
                          </button>
                          {invitation.invitation_status === 'completed' && (
                            <Link to={`/assessments/${id}/comparison`} style={{ display: 'block' }}>
                              <button style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                width: '100%', padding: '8px 0', borderRadius: 8,
                                background: T.card, border: `1px solid ${T.border}`,
                                fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, cursor: 'pointer',
                              }}>
                                <GitCompare size={13} /> View Comparison
                              </button>
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Function Scores */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
              <span style={sectionLabel}>Score by Function</span>
            </div>
            <div style={{ ...cardStyle, padding: 24 }}>
              <FunctionScoreChart
                functions={functions.map((func) => ({
                  code: func.name.substring(0, 2).toUpperCase(),
                  name: func.name,
                  score: assessment.overall_score ?? 0,
                }))}
              />
            </div>
          </div>

          {/* Assessment Tools */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
              <span style={sectionLabel}>Assessment Tools</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              {[
                { icon: ClipboardList, title: 'Data Collection Wizard', description: 'Step-by-step guided assessment data collection', to: `/assessments/${id}/wizard`, color: '#8B5CF6' },
                { icon: CheckSquare, title: 'Compliance Checklist', description: 'Review all subcategories and their compliance status', to: `/assessments/${id}/checklist`, color: T.success },
                { icon: FileText, title: 'Assessment Report', description: 'Generate and view the full assessment report', to: `/assessments/${id}/report`, color: T.accent },
              ].map((card) => {
                const CardIcon = card.icon;
                return (
                  <Link key={card.title} to={card.to} style={{ textDecoration: 'none' }}>
                    <div style={{
                      ...cardStyle, padding: 24, textAlign: 'center', cursor: 'pointer',
                      transition: 'all 0.14s',
                    }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                        el.style.transform = 'translateY(-2px)';
                        el.style.borderColor = `${card.color}40`;
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                        el.style.transform = 'none';
                        el.style.borderColor = T.border;
                      }}
                    >
                      <div style={{
                        width: 52, height: 52, borderRadius: 14, margin: '0 auto 16px',
                        background: `${card.color}10`, border: `1px solid ${card.color}25`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CardIcon size={22} style={{ color: card.color }} />
                      </div>
                      <h3 style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.textPrimary, margin: '0 0 6px' }}>
                        {card.title}
                      </h3>
                      <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.5 }}>
                        {card.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ======== ITEMS TAB ======== */}
      {activeTab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Function Selector */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {functions.map((func) => {
              const isActive = selectedFunction === func.id;
              return (
                <button
                  key={func.id}
                  onClick={() => setSelectedFunction(func.id)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, whiteSpace: 'nowrap',
                    border: isActive ? 'none' : `1px solid ${T.border}`,
                    background: isActive ? T.accent : T.card,
                    color: isActive ? '#FFF' : T.textSecondary,
                    fontFamily: T.fontSans, fontSize: 13, fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer', transition: 'all 0.14s',
                  }}
                >
                  {func.name}
                </button>
              );
            })}
          </div>

          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map((item) => (
              <div key={item.id} style={{ ...cardStyle, padding: 20 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: T.fontMono, fontSize: 13, fontWeight: 600, color: T.accent, margin: '0 0 8px' }}>
                      {item.subcategory?.id}
                    </h3>
                    <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>
                      {item.subcategory?.description}
                    </p>
                    {item.ai_suggested_status && (
                      <div style={{
                        marginTop: 12, padding: '10px 14px', borderRadius: 8,
                        background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                      }}>
                        <p style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.accent, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Brain size={13} />
                          AI Suggestion: <strong>{item.ai_suggested_status}</strong>
                          ({(item.ai_confidence_score! * 100).toFixed(0)}% confidence)
                        </p>
                        {item.ai_reasoning && (
                          <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: '6px 0 0' }}>
                            {item.ai_reasoning}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <span style={statusBadgeStyle(item.status || 'not_assessed')}>
                    {statusLabel(item.status || 'not_assessed')}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                  <div>
                    <label style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                      Status
                    </label>
                    <select
                      value={item.status || 'not_assessed'}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      style={{
                        width: '100%', padding: '7px 10px', borderRadius: 8,
                        background: T.bg, border: `1px solid ${T.border}`,
                        fontFamily: T.fontSans, fontSize: 13, color: T.textPrimary,
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
                      <label style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                        Evidence Upload
                      </label>
                      <label style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        width: '100%', padding: '7px 0', borderRadius: 8,
                        background: T.bg, border: `1px solid ${T.border}`,
                        fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, cursor: 'pointer',
                      }}>
                        <Upload size={14} />
                        {uploadingFor === item.id ? 'Uploading...' : 'Upload File'}
                        <input
                          type="file" style={{ display: 'none' }}
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(item.id, e.target.files[0])}
                          disabled={uploadingFor === item.id}
                        />
                      </label>
                    </div>
                    <button
                      onClick={() => handleAnalyze(item)}
                      disabled={analyzingItem === item.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 12px', borderRadius: 8, flexShrink: 0,
                        background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                        fontFamily: T.fontSans, fontSize: 13, color: T.accent, cursor: 'pointer',
                        opacity: analyzingItem === item.id ? 0.5 : 1,
                      }}
                    >
                      <Brain size={13} />
                      {analyzingItem === item.id ? 'Analyzing...' : 'AI'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======== VENDOR TAB ======== */}
      {activeTab === 'vendor' && (
        <div>
          {assessment.assessment_type !== 'vendor' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: '#F1F5F9',
                border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <MessageSquare size={22} style={{ color: T.textMuted }} />
              </div>
              <h3 style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.textPrimary, margin: '0 0 6px' }}>
                Not a Vendor Assessment
              </h3>
              <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, textAlign: 'center', maxWidth: 300, margin: 0 }}>
                Vendor responses are only available for vendor assessments.
              </p>
            </div>
          ) : !invitation ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: T.accentLight,
                border: `1px solid ${T.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <Link2 size={22} style={{ color: T.accent }} />
              </div>
              <h3 style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.textPrimary, margin: '0 0 6px' }}>
                No Vendor Invitation Sent
              </h3>
              <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, textAlign: 'center', maxWidth: 300, margin: '0 0 24px' }}>
                Create a vendor link to allow {assessment.vendor?.name || 'the vendor'} to complete their self-assessment.
              </p>
              <button onClick={() => setShowInviteDialog(true)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 8,
                background: T.accent, border: 'none',
                fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: '#FFF', cursor: 'pointer',
              }}>
                <Link2 size={14} /> Create Vendor Link
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {showVendorLink && (
                <div style={{
                  ...cardStyle, padding: 20,
                  borderLeft: `4px solid ${T.accent}`,
                  background: T.accentLight, borderColor: T.accentBorder,
                  borderLeftWidth: 4,
                }}>
                  <h3 style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 700, color: T.textPrimary, margin: '0 0 6px' }}>
                    Vendor Assessment Link
                  </h3>
                  <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: '0 0 14px', lineHeight: 1.6 }}>
                    Share this link with {assessment.vendor?.name || 'the vendor'}. Valid until {formatDate(invitation.token_expires_at)}.
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={`${window.location.origin}/vendor-portal/${invitation.access_token}`}
                      readOnly
                      onClick={(e) => e.currentTarget.select()}
                      style={{
                        flex: 1, padding: '7px 10px', borderRadius: 8,
                        background: T.card, border: `1px solid ${T.border}`,
                        fontFamily: T.fontMono, fontSize: 12, color: T.textSecondary, outline: 'none',
                      }}
                    />
                    <button onClick={handleCopyLink} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '7px 14px', borderRadius: 8, flexShrink: 0,
                      background: T.card, border: `1px solid ${T.border}`,
                      fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, cursor: 'pointer',
                    }}>
                      <Copy size={13} /> {copiedLink ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ ...cardStyle, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
                  <span style={sectionLabel}>Invitation Status</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {[
                    { label: 'Status', renderValue: () => (
                      <span style={{ ...invitationBadgeStyle(invitation.invitation_status), fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 }}>
                        {invitation.invitation_status}
                      </span>
                    )},
                    { label: 'Sent', value: formatDate(invitation.sent_at) },
                    ...(invitation.accessed_at ? [{ label: 'First Accessed', value: formatDate(invitation.accessed_at) }] : []),
                    ...(invitation.completed_at ? [{ label: 'Completed', value: formatDate(invitation.completed_at) }] : []),
                    { label: 'Expires', value: formatDate(invitation.token_expires_at) },
                  ].map((item: any) => (
                    <div key={item.label}>
                      <p style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 6px' }}>
                        {item.label}
                      </p>
                      {item.renderValue ? item.renderValue() : (
                        <p style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0 }}>
                          {item.value}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {invitation.message && (
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
                    <p style={{ fontFamily: T.fontMono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, margin: '0 0 8px' }}>
                      Custom Message
                    </p>
                    <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>
                      {invitation.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======== HISTORY TAB ======== */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 0' }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: '#F1F5F9',
            border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <Clock size={22} style={{ color: T.textMuted }} />
          </div>
          <h3 style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.textPrimary, margin: '0 0 6px' }}>
            Activity History Coming Soon
          </h3>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, textAlign: 'center', maxWidth: 300, margin: 0 }}>
            Track all changes, updates, and actions performed on this assessment.
          </p>
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
