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

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    compliant: 'bg-emerald-500/10 text-emerald-400',
    partial: 'bg-amber-500/10 text-amber-400',
    non_compliant: 'bg-red-500/10 text-red-400',
    not_applicable: 'bg-white/[0.06] text-[#55576A]',
    draft: 'bg-white/[0.06] text-[#8E8FA8]',
    in_progress: 'bg-indigo-500/10 text-indigo-400',
    completed: 'bg-emerald-500/10 text-emerald-400',
    not_assessed: 'bg-white/[0.06] text-[#55576A]',
  };
  return map[status] || 'bg-white/[0.06] text-[#8E8FA8]';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    compliant: 'Compliant',
    partial: 'Partial',
    non_compliant: 'Non-Compliant',
    not_applicable: 'N/A',
    draft: 'Draft',
    in_progress: 'In Progress',
    completed: 'Completed',
    not_assessed: 'Not Assessed',
  };
  return map[status] || status;
}

function invitationBadgeClass(status: string) {
  switch (status) {
    case 'completed': return 'bg-emerald-500/10 text-emerald-400';
    case 'accessed': return 'bg-indigo-500/10 text-indigo-400';
    case 'pending': return 'bg-amber-500/10 text-amber-400';
    case 'expired':
    case 'revoked': return 'bg-red-500/10 text-red-400';
    default: return 'bg-white/[0.06] text-[#8E8FA8]';
  }
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

  useEffect(() => {
    loadData();
    loadInvitation();
  }, [id]);

  useEffect(() => {
    if (selectedFunction && id) loadItems(selectedFunction);
  }, [selectedFunction, id]);

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
      if (functionsData.length > 0 && !selectedFunction) {
        setSelectedFunction(functionsData[0].id);
      }
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
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const loadInvitation = async () => {
    if (!id) return;
    try {
      const invitationData = await vendorInvitationsApi.getInvitation(id);
      setInvitation(invitationData);
    } catch {
      // no invitation yet
    }
  };

  const handleSendInvitation = (_response: SendInvitationResponse) => {
    loadInvitation();
    setShowVendorLink(true);
  };

  const handleCopyLink = async () => {
    if (!invitation) return;
    const vendorLink = `${window.location.origin}/vendor-portal/${invitation.access_token}`;
    try {
      await navigator.clipboard.writeText(vendorLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      alert('Failed to copy link to clipboard');
    }
  };

  const handleStatusChange = async (itemId: string, status: string) => {
    if (!id) return;
    try {
      await assessmentsApi.updateItem(id, itemId, { status: status as any });
      await Promise.all([loadItems(selectedFunction), loadData()]);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    if (!id) return;
    try {
      setUploadingFor(itemId);
      await evidenceApi.upload(file, id, itemId);
      alert('File uploaded successfully!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setUploadingFor(null);
    }
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
      alert(
        `AI Analysis Complete!\n\nSuggested Status: ${result.result.suggestedStatus}\nConfidence: ${(result.result.confidenceScore * 100).toFixed(0)}%\n\nReasoning: ${result.result.reasoning}`
      );
      await loadItems(selectedFunction);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setAnalyzingItem(null);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await assessmentsApi.delete(id);
      navigate('/assessments');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between">
          <div className="space-y-3">
            <div className="h-3 w-32 bg-white/[0.06] rounded" />
            <div className="h-7 w-72 bg-white/[0.06] rounded" />
            <div className="h-3 w-40 bg-white/[0.06] rounded" />
          </div>
          <div className="text-right space-y-2">
            <div className="h-12 w-20 bg-white/[0.06] rounded ml-auto" />
            <div className="h-3 w-24 bg-white/[0.06] rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-8 w-24 bg-white/[0.06] rounded" />)}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-white/[0.06] rounded-xl" />)}
        </div>
        <div className="h-72 bg-white/[0.06] rounded-xl" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="font-sans text-sm text-red-400">{error || 'Assessment not found'}</p>
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

  return (
    <div className="animate-fade-in-up">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-5">
        <Link to="/assessments" className="font-sans text-xs text-[#55576A] hover:text-[#8E8FA8] transition-colors">
          Assessments
        </Link>
        <span className="text-[#55576A]">/</span>
        <span className="font-sans text-xs text-[#8E8FA8]">{assessment.name}</span>
      </div>

      {/* Header row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">
              {assessment.name}
            </h1>
            <span className={`font-sans text-[11px] font-medium px-2 py-0.5 rounded-full ${statusBadgeClass(assessment.status)}`}>
              {statusLabel(assessment.status)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-[#55576A]">
              Created {formatDate(assessment.created_at)}
            </span>
            {assessment.vendor && (
              <>
                <span className="text-[#55576A]">·</span>
                <span className="font-sans text-xs text-[#8E8FA8]">{assessment.vendor.name}</span>
              </>
            )}
            <span className="font-mono text-[10px] bg-white/[0.05] text-[#55576A] px-2 py-0.5 rounded uppercase tracking-wide">
              {assessment.assessment_type}
            </span>
          </div>
        </div>

        {/* Big score display */}
        <div className="text-right flex-shrink-0">
          <div className="font-display text-5xl font-bold text-amber-400 tabular-nums leading-none">
            {score > 0 ? score.toFixed(0) : '—'}
          </div>
          <div className="font-sans text-[10px] text-[#55576A] mt-1.5 uppercase tracking-widest">Overall Score</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {assessment.assessment_type === 'vendor' && invitation?.invitation_status === 'completed' && (
          <Link to={`/assessments/${id}/comparison`}>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all">
              <GitCompare className="w-3.5 h-3.5" />
              Compare
            </button>
          </Link>
        )}
        {assessment.assessment_type === 'vendor' && !invitation && (
          <button
            onClick={() => setShowInviteDialog(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-sans text-sm rounded-lg hover:bg-amber-500/15 hover:border-amber-500/30 transition-all"
          >
            <Link2 className="w-3.5 h-3.5" />
            Create Vendor Link
          </button>
        )}
        <button
          onClick={() => setDeleteOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] text-red-400 font-sans text-sm rounded-lg hover:border-red-500/30 hover:bg-red-500/[0.06] transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 font-display text-xs font-semibold tracking-widest uppercase transition-all ${
                activeTab === tab.value
                  ? 'text-amber-400 border-b-2 border-amber-500 -mb-px'
                  : 'text-[#55576A] hover:text-[#8E8FA8]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ======== OVERVIEW TAB ======== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Score distribution stats */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
              <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
                Compliance Status
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Chart + Score distribution */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6 flex justify-center">
                  <ComplianceChart score={score} size="lg" showLabel />
                </div>

                <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5">
                  <h3 className="font-display text-xs font-semibold tracking-wide text-[#8E8FA8] uppercase mb-4">Score Distribution</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {[
                      { label: 'Compliant', value: assessment.stats?.compliant || 0, color: '#10B981' },
                      { label: 'Partial', value: assessment.stats?.partial || 0, color: '#F59E0B' },
                      { label: 'Non-Compliant', value: assessment.stats?.nonCompliant || 0, color: '#EF4444' },
                      { label: 'Not Assessed', value: assessment.stats?.notAssessed || 0, color: '#55576A' },
                      { label: 'N/A', value: assessment.stats?.notApplicable || 0, color: '#3A3C4E' },
                    ].map((item) => (
                      <div key={item.label} className="border-l-[3px] pl-3" style={{ borderColor: item.color }}>
                        <p className="font-display text-2xl font-bold tabular-nums text-[#F0F0F5]">{item.value}</p>
                        <p className="font-sans text-[11px] text-[#55576A] mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Details + Quick Actions */}
              <div className="space-y-5">
                <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5">
                  <h3 className="font-display text-xs font-semibold tracking-wide text-[#8E8FA8] uppercase mb-4">Details</h3>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <FileText className="w-4 h-4 text-[#55576A] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-0.5">Type</p>
                        <p className="font-sans text-sm font-medium text-[#F0F0F5]">
                          {assessment.assessment_type === 'vendor' ? 'Vendor Assessment' : 'Organization Assessment'}
                        </p>
                      </div>
                    </div>
                    {assessment.vendor && (
                      <div className="flex gap-3">
                        <Building2 className="w-4 h-4 text-[#55576A] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-0.5">Vendor</p>
                          <p className="font-sans text-sm font-medium text-[#F0F0F5]">{assessment.vendor.name}</p>
                          {assessment.vendor.contact_email && (
                            <p className="font-sans text-xs text-[#55576A]">{assessment.vendor.contact_email}</p>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <Calendar className="w-4 h-4 text-[#55576A] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-0.5">Created</p>
                        <p className="font-sans text-sm font-medium text-[#F0F0F5]">{formatDate(assessment.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <BarChart3 className="w-4 h-4 text-[#55576A] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-0.5">Overall Score</p>
                        <p className="font-display text-2xl font-bold text-amber-400 tabular-nums">
                          {score > 0 ? `${score.toFixed(1)}%` : '0.0%'}
                        </p>
                      </div>
                    </div>
                    {assessment.description && (
                      <div className="pt-4 border-t border-white/[0.05]">
                        <p className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-1">Description</p>
                        <p className="font-sans text-sm text-[#8E8FA8] leading-relaxed">{assessment.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions for Vendor Assessments */}
                {assessment.assessment_type === 'vendor' && (
                  <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5">
                    <h3 className="font-display text-xs font-semibold tracking-wide text-[#8E8FA8] uppercase mb-4">Quick Actions</h3>
                    <div className="space-y-2.5">
                      {!invitation ? (
                        <button
                          onClick={() => setShowInviteDialog(true)}
                          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
                        >
                          <Link2 className="w-4 h-4" />
                          Create Vendor Link
                        </button>
                      ) : (
                        <>
                          <div className="flex justify-between items-center p-3 bg-white/[0.03] rounded-lg">
                            <span className="font-sans text-xs text-[#8E8FA8]">Invitation Status</span>
                            <span className={`font-sans text-[11px] font-medium px-2 py-0.5 rounded-full ${invitationBadgeClass(invitation.invitation_status)}`}>
                              {invitation.invitation_status}
                            </span>
                          </div>
                          <button
                            onClick={() => setShowVendorLink(!showVendorLink)}
                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                            {showVendorLink ? 'Hide' : 'Show'} Vendor Link
                          </button>
                          {invitation.invitation_status === 'completed' && (
                            <Link to={`/assessments/${id}/comparison`} className="block">
                              <button className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all">
                                <GitCompare className="w-3.5 h-3.5" />
                                View Comparison
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
            <div className="flex items-center gap-3 mb-5">
              <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
              <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
                Score by Function
              </h2>
            </div>
            <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
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
            <div className="flex items-center gap-3 mb-5">
              <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
              <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
                Assessment Tools
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: ClipboardList, title: 'Data Collection Wizard', description: 'Step-by-step guided assessment data collection', to: `/assessments/${id}/wizard` },
                { icon: CheckSquare, title: 'Compliance Checklist', description: 'Review all subcategories and their compliance status', to: `/assessments/${id}/checklist` },
                { icon: FileText, title: 'Assessment Report', description: 'Generate and view the full assessment report', to: `/assessments/${id}/report` },
              ].map((card) => {
                const CardIcon = card.icon;
                return (
                  <Link key={card.title} to={card.to}>
                    <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6 hover:border-amber-500/20 hover:-translate-y-0.5 transition-all cursor-pointer group text-center">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mx-auto mb-4">
                        <CardIcon className="w-6 h-6 text-amber-500/60 group-hover:text-amber-400 transition-colors" />
                      </div>
                      <h3 className="font-display text-sm font-semibold text-[#F0F0F5] mb-1.5 group-hover:text-amber-400 transition-colors">{card.title}</h3>
                      <p className="font-sans text-xs text-[#8E8FA8] leading-relaxed">{card.description}</p>
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
        <div className="space-y-6">
          {/* Function Selector */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {functions.map((func) => (
              <button
                key={func.id}
                onClick={() => setSelectedFunction(func.id)}
                className={`px-3 py-1.5 rounded-lg font-sans text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedFunction === func.id
                    ? 'bg-amber-500 text-[#08090E]'
                    : 'bg-white/[0.04] text-[#8E8FA8] hover:bg-white/[0.07] hover:text-[#F0F0F5]'
                }`}
              >
                {func.name}
              </button>
            ))}
          </div>

          {/* Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.1] transition-all">
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="font-mono text-sm font-semibold text-amber-400">{item.subcategory?.id}</h3>
                    <p className="font-sans text-sm text-[#8E8FA8] mt-1.5 leading-relaxed">{item.subcategory?.description}</p>
                    {item.ai_suggested_status && (
                      <div className="mt-3 p-3 bg-indigo-500/[0.06] border border-indigo-500/15 rounded-lg">
                        <p className="font-sans text-sm font-medium text-indigo-400 flex items-center gap-1.5">
                          <Brain className="w-4 h-4" />
                          AI Suggestion: <strong>{item.ai_suggested_status}</strong>
                          ({(item.ai_confidence_score! * 100).toFixed(0)}% confidence)
                        </p>
                        {item.ai_reasoning && (
                          <p className="font-sans text-xs text-[#8E8FA8] mt-1.5">{item.ai_reasoning}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <span className={`font-sans text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusBadgeClass(item.status || 'not_assessed')}`}>
                    {statusLabel(item.status || 'not_assessed')}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/[0.05]">
                  <div>
                    <label className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-1.5 block">Status</label>
                    <select
                      value={item.status || 'not_assessed'}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] focus:outline-none focus:border-amber-500/30 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="not_assessed">Not Assessed</option>
                      <option value="compliant">Compliant</option>
                      <option value="partial">Partially Compliant</option>
                      <option value="non_compliant">Non-Compliant</option>
                      <option value="not_applicable">Not Applicable</option>
                    </select>
                  </div>

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-1.5 block">Evidence Upload</label>
                      <label className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-white/[0.03] border border-white/[0.07] rounded-lg font-sans text-sm text-[#8E8FA8] hover:border-amber-500/30 hover:text-[#F0F0F5] cursor-pointer transition-all">
                        <Upload className="w-4 h-4" />
                        {uploadingFor === item.id ? 'Uploading...' : 'Upload File'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleFileUpload(item.id, e.target.files[0])}
                          disabled={uploadingFor === item.id}
                        />
                      </label>
                    </div>
                    <button
                      onClick={() => handleAnalyze(item)}
                      disabled={analyzingItem === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-sans text-sm rounded-lg hover:bg-indigo-500/15 hover:border-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <Brain className="w-3.5 h-3.5" />
                      {analyzingItem === item.id ? 'Analyzing...' : 'AI Analyze'}
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
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-[#55576A]" />
              </div>
              <h3 className="font-display text-base font-semibold text-[#F0F0F5] mb-2">Not a Vendor Assessment</h3>
              <p className="font-sans text-sm text-[#8E8FA8] text-center max-w-xs">
                Vendor responses are only available for vendor assessments.
              </p>
            </div>
          ) : !invitation ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mb-4">
                <Link2 className="w-6 h-6 text-amber-500/50" />
              </div>
              <h3 className="font-display text-base font-semibold text-[#F0F0F5] mb-2">No Vendor Invitation Sent</h3>
              <p className="font-sans text-sm text-[#8E8FA8] text-center max-w-xs mb-6">
                Create a vendor link to allow {assessment.vendor?.name || 'the vendor'} to complete their self-assessment.
              </p>
              <button
                onClick={() => setShowInviteDialog(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
              >
                <Link2 className="w-4 h-4" />
                Create Vendor Link
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Vendor Link Display */}
              {showVendorLink && (
                <div className="bg-[#0E1018] border-l-[3px] border-l-amber-500 border border-white/[0.07] rounded-xl p-5">
                  <h3 className="font-display text-sm font-semibold text-[#F0F0F5] mb-2">Vendor Assessment Link</h3>
                  <p className="font-sans text-xs text-[#8E8FA8] mb-4 leading-relaxed">
                    Share this link with {assessment.vendor?.name || 'the vendor'}. Valid until {formatDate(invitation.token_expires_at)}.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/vendor-portal/${invitation.access_token}`}
                      readOnly
                      onClick={(e) => e.currentTarget.select()}
                      className="flex-1 px-3 py-2 font-mono text-xs bg-white/[0.03] border border-white/[0.07] rounded-lg text-[#8E8FA8] outline-none focus:border-amber-500/30"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all flex-shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedLink ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Invitation Details */}
              <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
                  <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
                    Invitation Status
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-1">Status</p>
                    <span className={`font-sans text-[11px] font-medium px-2.5 py-1 rounded-full ${invitationBadgeClass(invitation.invitation_status)}`}>
                      {invitation.invitation_status}
                    </span>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-1">Sent</p>
                    <p className="font-sans text-sm font-medium text-[#F0F0F5]">{formatDate(invitation.sent_at)}</p>
                  </div>
                  {invitation.accessed_at && (
                    <div>
                      <p className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-1">First Accessed</p>
                      <p className="font-sans text-sm font-medium text-[#F0F0F5]">{formatDate(invitation.accessed_at)}</p>
                    </div>
                  )}
                  {invitation.completed_at && (
                    <div>
                      <p className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-1">Completed</p>
                      <p className="font-sans text-sm font-medium text-[#F0F0F5]">{formatDate(invitation.completed_at)}</p>
                    </div>
                  )}
                  <div>
                    <p className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-1">Expires</p>
                    <p className="font-sans text-sm font-medium text-[#F0F0F5]">{formatDate(invitation.token_expires_at)}</p>
                  </div>
                </div>
                {invitation.message && (
                  <div className="mt-5 pt-5 border-t border-white/[0.05]">
                    <p className="font-mono text-[10px] text-[#55576A] uppercase tracking-wider mb-2">Custom Message</p>
                    <p className="font-sans text-sm text-[#8E8FA8] leading-relaxed">{invitation.message}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======== HISTORY TAB ======== */}
      {activeTab === 'history' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-[#55576A]" />
          </div>
          <h3 className="font-display text-base font-semibold text-[#F0F0F5] mb-2">Activity History Coming Soon</h3>
          <p className="font-sans text-sm text-[#8E8FA8] text-center max-w-xs">
            Track all changes, updates, and actions performed on this assessment.
          </p>
        </div>
      )}

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
