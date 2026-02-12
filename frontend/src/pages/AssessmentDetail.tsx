/**
 * Assessment Detail Page
 * Tab-based view: Overview | Assessment Items | Vendor Responses | History
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Upload,
  Brain,
  GitCompare,
  Link2,
  Copy,
  FileText,
  Calendar,
  Building2,
  BarChart3,
  ClipboardList,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { evidenceApi } from '../api/evidence';
import { aiApi } from '../api/ai';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type {
  Assessment,
  AssessmentItem,
  CsfFunction,
  VendorAssessmentInvitation,
  SendInvitationResponse,
} from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import SendToVendorModal from '../components/SendToVendorModal';
import DonutChart from '../components/DonutChart';

type TabType = 'overview' | 'items' | 'vendor' | 'history';

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Data state
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [invitation, setInvitation] = useState<VendorAssessmentInvitation | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [analyzingItem, setAnalyzingItem] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showVendorLink, setShowVendorLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    loadData();
    loadInvitation();
  }, [id]);

  useEffect(() => {
    if (selectedFunction && id) {
      loadItems(selectedFunction);
    }
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
    } catch (err) {
      console.log('No invitation found:', err);
    }
  };

  const handleSendInvitation = (_response: SendInvitationResponse) => {
    loadInvitation();
    setShowVendorLink(true);
  };

  const handleCopyLink = async () => {
    if (!invitation) return;

    const baseUrl = window.location.origin;
    const vendorLink = `${baseUrl}/vendor-portal/${invitation.access_token}`;

    try {
      await navigator.clipboard.writeText(vendorLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
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
    if (!id || !confirm('Are you sure you want to delete this assessment?')) return;

    try {
      await assessmentsApi.delete(id);
      navigate('/assessments');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'badge-green';
      case 'partial':
        return 'badge-yellow';
      case 'non_compliant':
        return 'badge-red';
      case 'not_applicable':
        return 'badge-blue';
      default:
        return 'badge-gray';
    }
  };

  const getInvitationStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-status-compliant-bg text-status-compliant-text border border-status-compliant-border';
      case 'accessed':
        return 'bg-status-inprogress-bg text-status-inprogress-text border border-status-inprogress-border';
      case 'pending':
        return 'bg-status-partial-bg text-status-partial-text border border-status-partial-border';
      case 'expired':
        return 'bg-status-draft-bg text-status-draft-text border border-status-draft-border';
      case 'revoked':
        return 'bg-status-noncompliant-bg text-status-noncompliant-text border border-status-noncompliant-border';
      default:
        return 'bg-status-draft-bg text-status-draft-text border border-status-draft-border';
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'items', label: 'Assessment Items', icon: ClipboardList },
    { id: 'vendor', label: 'Vendor Responses', icon: MessageSquare },
    { id: 'history', label: 'History', icon: Clock },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading assessment...</div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="bg-status-noncompliant-bg border border-status-noncompliant-border rounded-lg p-4">
        <p className="text-status-noncompliant-text">{error || 'Assessment not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Link to="/assessments" className="btn btn-secondary mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{assessment.name}</h1>
            <p className="text-text-secondary mt-1">
              Created {formatDate(assessment.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`badge ${getStatusColor(assessment.status)}`}>
            {assessment.status.replace('_', ' ')}
          </span>

          {assessment.assessment_type === 'vendor' && invitation?.invitation_status === 'completed' && (
            <Link to={`/assessments/${id}/comparison`} className="btn btn-secondary btn-sm">
              <GitCompare className="w-4 h-4 mr-1" />
              View Comparison
            </Link>
          )}

          <button onClick={handleDelete} className="btn btn-danger btn-sm">
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border-default">
        <nav className="flex space-x-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-1 py-3 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Donut Chart */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-xl font-bold text-text-primary mb-6">Compliance Status</h2>
                <div className="flex justify-center">
                  <DonutChart
                    segments={[
                      {
                        label: 'Compliant',
                        value: assessment.stats?.compliant || 0,
                        color: getComputedStyle(document.documentElement).getPropertyValue('--status-success').trim(),
                      },
                      {
                        label: 'Partial',
                        value: assessment.stats?.partial || 0,
                        color: getComputedStyle(document.documentElement).getPropertyValue('--status-warning').trim(),
                      },
                      {
                        label: 'Non-Compliant',
                        value: assessment.stats?.nonCompliant || 0,
                        color: getComputedStyle(document.documentElement).getPropertyValue('--status-danger').trim(),
                      },
                      {
                        label: 'Not Applicable',
                        value: assessment.stats?.notApplicable || 0,
                        color: getComputedStyle(document.documentElement).getPropertyValue('--status-info').trim(),
                      },
                      {
                        label: 'Not Assessed',
                        value: assessment.stats?.notAssessed || 0,
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim(),
                      },
                    ]}
                    size={240}
                    strokeWidth={36}
                    centerText={`${assessment.overall_score?.toFixed(0) || '0'}%`}
                    centerSubtext="Score"
                  />
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="card border-l-4 border-l-status-compliant">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Compliant</p>
                      <p className="text-3xl font-bold text-status-compliant">
                        {assessment.stats?.compliant || 0}
                      </p>
                    </div>
                    <div className="bg-status-compliant-bg p-3 rounded-full border border-status-compliant-border">
                      <div className="w-2 h-2 rounded-full bg-status-compliant" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-l-4 border-l-status-partial">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Partial</p>
                      <p className="text-3xl font-bold text-status-partial">
                        {assessment.stats?.partial || 0}
                      </p>
                    </div>
                    <div className="bg-status-partial-bg p-3 rounded-full border border-status-partial-border">
                      <div className="w-2 h-2 rounded-full bg-status-partial" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-l-4 border-l-status-noncompliant">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Non-Compliant</p>
                      <p className="text-3xl font-bold text-status-noncompliant">
                        {assessment.stats?.nonCompliant || 0}
                      </p>
                    </div>
                    <div className="bg-status-noncompliant-bg p-3 rounded-full border border-status-noncompliant-border">
                      <div className="w-2 h-2 rounded-full bg-status-noncompliant" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-l-4 border-l-status-draft">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-text-secondary mb-1">Not Assessed</p>
                      <p className="text-3xl font-bold text-status-draft">
                        {assessment.stats?.notAssessed || 0}
                      </p>
                    </div>
                    <div className="bg-status-draft-bg p-3 rounded-full border border-status-draft-border">
                      <div className="w-2 h-2 rounded-full bg-status-draft" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Panel - 1 column */}
          <div className="space-y-6">
            {/* Assessment Details */}
            <div className="card">
              <div className="card-body space-y-4">
                <h3 className="font-semibold text-text-primary mb-4">Assessment Details</h3>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Type</p>
                      <p className="text-sm font-medium text-text-primary">
                        {assessment.assessment_type === 'vendor' ? 'Vendor Assessment' : 'Organization Assessment'}
                      </p>
                    </div>
                  </div>

                  {assessment.vendor && (
                    <div className="flex items-start space-x-3">
                      <Building2 className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Vendor</p>
                        <p className="text-sm font-medium text-text-primary">{assessment.vendor.name}</p>
                        {assessment.vendor.contact_email && (
                          <p className="text-xs text-text-secondary mt-0.5">
                            {assessment.vendor.contact_email}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Created</p>
                      <p className="text-sm font-medium text-text-primary">
                        {formatDate(assessment.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <BarChart3 className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Overall Score</p>
                      <p className="text-2xl font-bold font-mono text-secondary">
                        {assessment.overall_score?.toFixed(1) || '0.0'}%
                      </p>
                    </div>
                  </div>
                </div>

                {assessment.description && (
                  <div className="pt-4 border-t border-border-default">
                    <p className="text-xs text-text-secondary uppercase tracking-wide mb-2">Description</p>
                    <p className="text-sm text-text-primary">{assessment.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {assessment.assessment_type === 'vendor' && (
              <div className="card">
                <div className="card-body space-y-3">
                  <h3 className="font-semibold text-text-primary mb-2">Quick Actions</h3>

                  {!invitation ? (
                    <button
                      onClick={() => setShowSendModal(true)}
                      className="btn btn-primary btn-sm w-full justify-center"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      Create Vendor Link
                    </button>
                  ) : (
                    <>
                      <div className="flex items-center justify-between p-3 bg-page-bg rounded-lg">
                        <span className="text-sm text-text-secondary">Invitation Status</span>
                        <span className={`badge ${getInvitationStatusColor(invitation.invitation_status)}`}>
                          {invitation.invitation_status}
                        </span>
                      </div>

                      <button
                        onClick={() => setShowVendorLink(!showVendorLink)}
                        className="btn btn-secondary btn-sm w-full justify-center"
                      >
                        <Link2 className="w-4 h-4 mr-2" />
                        {showVendorLink ? 'Hide' : 'Show'} Vendor Link
                      </button>

                      {invitation.invitation_status === 'completed' && (
                        <Link
                          to={`/assessments/${id}/comparison`}
                          className="btn btn-secondary btn-sm w-full justify-center"
                        >
                          <GitCompare className="w-4 h-4 mr-2" />
                          View Comparison
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="space-y-6">
          {/* Function Tabs */}
          <div className="card">
            <div className="card-body">
              <div className="flex space-x-2 overflow-x-auto">
                {functions.map((func) => (
                  <button
                    key={func.id}
                    onClick={() => setSelectedFunction(func.id)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedFunction === func.id
                        ? 'bg-secondary text-text-inverse'
                        : 'bg-page-bg text-text-secondary hover:bg-secondary-light'
                    }`}
                  >
                    {func.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="card">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary">{item.subcategory?.id}</h3>
                      <p className="text-sm text-text-secondary mt-1">{item.subcategory?.description}</p>
                      {item.ai_suggested_status && (
                        <div className="mt-3 p-3 bg-secondary/10 border border-secondary/30 rounded-lg">
                          <p className="text-sm text-secondary font-medium">
                            <Brain className="w-4 h-4 inline mr-1" />
                            AI Suggestion: <strong>{item.ai_suggested_status}</strong> (
                            {(item.ai_confidence_score! * 100).toFixed(0)}% confidence)
                          </p>
                          {item.ai_reasoning && (
                            <p className="text-xs text-text-secondary mt-1">{item.ai_reasoning}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`badge ${getStatusColor(item.status || 'not_assessed')} ml-4`}>
                      {item.status?.replace('_', ' ') || 'not assessed'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Status</label>
                      <select
                        value={item.status || 'not_assessed'}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="form-select"
                      >
                        <option value="not_assessed">Not Assessed</option>
                        <option value="compliant">Compliant</option>
                        <option value="partial">Partially Compliant</option>
                        <option value="non_compliant">Non-Compliant</option>
                        <option value="not_applicable">Not Applicable</option>
                      </select>
                    </div>

                    <div className="flex items-end space-x-2">
                      <div className="flex-1">
                        <label className="form-label">Evidence Upload</label>
                        <label className="btn btn-secondary w-full cursor-pointer">
                          <Upload className="w-4 h-4 mr-2" />
                          {uploadingFor === item.id ? 'Uploading...' : 'Upload File'}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(item.id, e.target.files[0]);
                              }
                            }}
                            disabled={uploadingFor === item.id}
                          />
                        </label>
                      </div>
                      <button
                        onClick={() => handleAnalyze(item)}
                        disabled={analyzingItem === item.id}
                        className="btn btn-primary"
                      >
                        <Brain className="w-4 h-4 mr-2" />
                        {analyzingItem === item.id ? 'Analyzing...' : 'AI Analyze'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'vendor' && (
        <div className="space-y-6">
          {assessment.assessment_type !== 'vendor' ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <div className="bg-surface p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquare className="w-8 h-8 text-text-muted" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Not a Vendor Assessment</h3>
                <p className="text-sm text-text-secondary max-w-md mx-auto">
                  Vendor responses are only available for vendor assessments.
                </p>
              </div>
            </div>
          ) : !invitation ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <div className="bg-secondary/10 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Link2 className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Vendor Invitation Sent</h3>
                <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
                  Create a vendor link to allow {assessment.vendor?.name || 'the vendor'} to complete their
                  self-assessment.
                </p>
                <button onClick={() => setShowSendModal(true)} className="btn btn-primary">
                  <Link2 className="w-4 h-4 mr-2" />
                  Create Vendor Link
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Vendor Link Display */}
              {showVendorLink && (
                <div className="card border-l-4 border-secondary">
                  <div className="card-body">
                    <h3 className="text-sm font-semibold text-text-primary mb-2">Vendor Assessment Link</h3>
                    <p className="text-sm text-text-secondary mb-4">
                      Share this link with {assessment.vendor?.name || 'the vendor'} to complete their
                      self-assessment. This link can be used multiple times and is valid until{' '}
                      {formatDate(invitation.token_expires_at)}.
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/vendor-portal/${invitation.access_token}`}
                        readOnly
                        className="flex-1 input font-mono text-sm bg-white"
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <button onClick={handleCopyLink} className="btn btn-secondary flex-shrink-0">
                        {copiedLink ? (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Invitation Details */}
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Invitation Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Status</p>
                      <span className={`badge ${getInvitationStatusColor(invitation.invitation_status)}`}>
                        {invitation.invitation_status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Sent</p>
                      <p className="text-sm font-medium text-text-primary">
                        {formatDate(invitation.sent_at)}
                      </p>
                    </div>
                    {invitation.accessed_at && (
                      <div>
                        <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">First Accessed</p>
                        <p className="text-sm font-medium text-text-primary">
                          {formatDate(invitation.accessed_at)}
                        </p>
                      </div>
                    )}
                    {invitation.completed_at && (
                      <div>
                        <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Completed</p>
                        <p className="text-sm font-medium text-text-primary">
                          {formatDate(invitation.completed_at)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-text-secondary uppercase tracking-wide mb-1">Expires</p>
                      <p className="text-sm font-medium text-text-primary">
                        {formatDate(invitation.token_expires_at)}
                      </p>
                    </div>
                  </div>

                  {invitation.message && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-text-secondary uppercase tracking-wide mb-2">Custom Message</p>
                      <p className="text-sm text-text-primary">{invitation.message}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="bg-surface p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Clock className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Activity History Coming Soon</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              Track all changes, updates, and actions performed on this assessment.
            </p>
          </div>
        </div>
      )}

      {/* Send to Vendor Modal */}
      <SendToVendorModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSend={handleSendInvitation}
        assessmentId={id || ''}
        assessmentName={assessment?.name || ''}
        vendorEmail={assessment?.vendor?.contact_email}
        vendorName={assessment?.vendor?.name}
      />
    </div>
  );
}
