/**
 * AssessmentDetail - Rebuilt from scratch
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
  CheckSquare,
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
import ComplianceChart from '../components/charts/ComplianceChart';
import FunctionScoreChart from '../components/charts/FunctionScoreChart';
import Skeleton from '../components/Skeleton.new';

type TabType = 'overview' | 'items' | 'vendor' | 'history';

export default function AssessmentDetailNew() {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: 'compliant' };
      case 'partial':
        return { bg: 'var(--orange-subtle)', color: 'var(--orange-text)', label: 'partial' };
      case 'non_compliant':
        return { bg: 'var(--red-subtle)', color: 'var(--red-text)', label: 'non-compliant' };
      case 'not_applicable':
        return { bg: 'var(--blue-subtle)', color: 'var(--blue-text)', label: 'not applicable' };
      case 'draft':
        return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'draft' };
      case 'in_progress':
        return { bg: 'var(--blue-subtle)', color: 'var(--blue-text)', label: 'in progress' };
      case 'completed':
        return { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: 'completed' };
      default:
        return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'not assessed' };
    }
  };

  const getInvitationStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: 'var(--green-subtle)', color: 'var(--green-text)' };
      case 'accessed':
        return { bg: 'var(--blue-subtle)', color: 'var(--blue-text)' };
      case 'pending':
        return { bg: 'var(--orange-subtle)', color: 'var(--orange-text)' };
      case 'expired':
      case 'revoked':
        return { bg: 'var(--red-subtle)', color: 'var(--red-text)' };
      default:
        return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)' };
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
      <div>
        {/* Header skeleton */}
        <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Skeleton w="40px" h="40px" />
            <div>
              <Skeleton w="300px" h="32px" />
              <Skeleton w="150px" h="16px" />
            </div>
          </div>
          <Skeleton w="100px" h="40px" />
        </div>

        {/* Tabs skeleton */}
        <div style={{ marginBottom: '28px', display: 'flex', gap: '20px', borderBottom: '2px solid var(--border)' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} w="120px" h="40px" />
          ))}
        </div>

        {/* Content skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <Skeleton w="100%" h="400px" />
          <Skeleton w="100%" h="400px" />
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div
        style={{
          background: 'var(--red-subtle)',
          border: '1px solid var(--red)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          color: 'var(--red-text)',
        }}
      >
        {error || 'Assessment not found'}
      </div>
    );
  }

  const statusBadge = getStatusBadge(assessment.status);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'start' }}>
          <Link
            to="/assessments"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-3)',
              textDecoration: 'none',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--raised)';
              e.currentTarget.style.color = 'var(--text-1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card)';
              e.currentTarget.style.color = 'var(--text-3)';
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>
              {assessment.name}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
              Created {formatDate(assessment.created_at)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 500,
              background: statusBadge.bg,
              color: statusBadge.color,
            }}
          >
            {statusBadge.label}
          </div>

          {assessment.assessment_type === 'vendor' && invitation?.invitation_status === 'completed' && (
            <Link
              to={`/assessments/${id}/comparison`}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-2)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--raised)';
                e.currentTarget.style.color = 'var(--text-1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--card)';
                e.currentTarget.style.color = 'var(--text-2)';
              }}
            >
              <GitCompare size={16} />
              View Comparison
            </Link>
          )}

          <button
            onClick={handleDelete}
            style={{
              background: 'var(--red-subtle)',
              border: '1px solid var(--red)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--red-text)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--red)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--red-subtle)';
              e.currentTarget.style.color = 'var(--red-text)';
            }}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '2px solid var(--border)', marginBottom: '28px' }}>
        <div style={{ display: 'flex', gap: '24px' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  padding: '12px 4px',
                  fontSize: '14px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--accent)' : 'var(--text-3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '-2px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-3)';
                  }
                }}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div>
        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '2fr 1fr', gap: '24px' }}>
          {/* Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Score Circle (SVG) */}
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '28px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '24px' }}>
                Compliance Status
              </h2>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ComplianceChart score={assessment.overall_score ?? 0} size="lg" showLabel />
              </div>
            </div>

            {/* Score Distribution */}
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px 24px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '16px' }}>
                Score Distribution
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    window.innerWidth < 640 ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
                  gap: '12px',
                }}
              >
                {[
                  { label: 'Compliant', value: assessment.stats?.compliant || 0, color: 'var(--green)' },
                  { label: 'Partial', value: assessment.stats?.partial || 0, color: 'var(--orange)' },
                  { label: 'Non-Compliant', value: assessment.stats?.nonCompliant || 0, color: 'var(--red)' },
                  { label: 'Not Assessed', value: assessment.stats?.notAssessed || 0, color: 'var(--text-4)' },
                  { label: 'N/A', value: assessment.stats?.notApplicable || 0, color: 'var(--border)' },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      borderLeft: `3px solid ${item.color}`,
                      paddingLeft: '12px',
                    }}
                  >
                    <p style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
                      {item.value}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Assessment Details */}
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '20px' }}>
                Assessment Details
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <FileText size={20} style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '4px' }}>
                      Type
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)' }}>
                      {assessment.assessment_type === 'vendor' ? 'Vendor Assessment' : 'Organization Assessment'}
                    </p>
                  </div>
                </div>

                {assessment.vendor && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Building2 size={20} style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '4px' }}>
                        Vendor
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)' }}>
                        {assessment.vendor.name}
                      </p>
                      {assessment.vendor.contact_email && (
                        <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>
                          {assessment.vendor.contact_email}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Calendar size={20} style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '4px' }}>
                      Created
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)' }}>
                      {formatDate(assessment.created_at)}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <BarChart3 size={20} style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '4px' }}>
                      Overall Score
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {assessment.overall_score?.toFixed(1) || '0.0'}%
                    </p>
                  </div>
                </div>
              </div>

              {assessment.description && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '8px' }}>
                    Description
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                    {assessment.description}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {assessment.assessment_type === 'vendor' && (
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '16px' }}>
                  Quick Actions
                </h3>

                {!invitation ? (
                  <button
                    onClick={() => setShowSendModal(true)}
                    style={{
                      width: '100%',
                      background: 'var(--accent)',
                      color: 'var(--text-on-accent)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '10px 16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                  >
                    <Link2 size={16} />
                    Create Vendor Link
                  </button>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        background: 'var(--ground)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--text-3)' }}>Invitation Status</span>
                      {(() => {
                        const badge = getInvitationStatusBadge(invitation.invitation_status);
                        return (
                          <div
                            style={{
                              padding: '4px 10px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '11px',
                              fontWeight: 500,
                              background: badge.bg,
                              color: badge.color,
                            }}
                          >
                            {invitation.invitation_status}
                          </div>
                        );
                      })()}
                    </div>

                    <button
                      onClick={() => setShowVendorLink(!showVendorLink)}
                      style={{
                        width: '100%',
                        background: 'var(--card)',
                        color: 'var(--text-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '10px 16px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--raised)';
                        e.currentTarget.style.color = 'var(--text-1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--card)';
                        e.currentTarget.style.color = 'var(--text-2)';
                      }}
                    >
                      <Link2 size={16} />
                      {showVendorLink ? 'Hide' : 'Show'} Vendor Link
                    </button>

                    {invitation.invitation_status === 'completed' && (
                      <Link
                        to={`/assessments/${id}/comparison`}
                        style={{
                          width: '100%',
                          background: 'var(--card)',
                          color: 'var(--text-2)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '10px 16px',
                          fontSize: '14px',
                          fontWeight: 500,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 150ms ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--raised)';
                          e.currentTarget.style.color = 'var(--text-1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--card)';
                          e.currentTarget.style.color = 'var(--text-2)';
                        }}
                      >
                        <GitCompare size={16} />
                        View Comparison
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Function Scores */}
        <div
          style={{
            marginTop: '28px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '20px' }}>
            Score by Function
          </h2>
          <FunctionScoreChart
            functions={functions.map((func) => ({
              code: func.name.substring(0, 2).toUpperCase(),
              name: func.name,
              score: assessment.overall_score ?? 0,
            }))}
          />
        </div>

        {/* Assessment Tools Navigation Cards */}
        <div style={{ marginTop: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '16px' }}>
            Assessment Tools
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(3, 1fr)',
              gap: '16px',
            }}
          >
            {[
              {
                icon: ClipboardList,
                title: 'Data Collection Wizard',
                description: 'Step-by-step guided assessment data collection',
                to: `/assessments/${id}/wizard`,
              },
              {
                icon: CheckSquare,
                title: 'Compliance Checklist',
                description: 'Review all subcategories and their compliance status',
                to: `/assessments/${id}/checklist`,
              },
              {
                icon: FileText,
                title: 'Assessment Report',
                description: 'Generate and view the full assessment report',
                to: `/assessments/${id}/report`,
              },
            ].map((card) => {
              const CardIcon = card.icon;
              return (
                <Link
                  key={card.title}
                  to={card.to}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '28px 24px',
                    boxShadow: 'var(--shadow-xs)',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    transition: 'all 200ms ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = 'var(--border-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      background: 'var(--accent-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <CardIcon size={28} style={{ color: 'var(--accent)' }} />
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '6px' }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5 }}>
                    {card.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Function Tabs */}
          <div
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '20px',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {functions.map((func) => {
                const isSelected = selectedFunction === func.id;
                return (
                  <button
                    key={func.id}
                    onClick={() => setSelectedFunction(func.id)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '14px',
                      fontWeight: isSelected ? 600 : 500,
                      background: isSelected ? 'var(--accent)' : 'var(--ground)',
                      color: isSelected ? 'var(--text-on-accent)' : 'var(--text-2)',
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--raised)';
                        e.currentTarget.style.color = 'var(--text-1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--ground)';
                        e.currentTarget.style.color = 'var(--text-2)';
                      }
                    }}
                  >
                    {func.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item) => {
              const itemBadge = getStatusBadge(item.status || 'not_assessed');
              return (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '24px',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>
                        {item.subcategory?.id}
                      </h3>
                      <p style={{ fontSize: '14px', color: 'var(--text-2)', marginTop: '6px', lineHeight: 1.5 }}>
                        {item.subcategory?.description}
                      </p>
                      {item.ai_suggested_status && (
                        <div
                          style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: 'var(--accent-subtle)',
                            border: '1px solid var(--accent)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          <p style={{ fontSize: '13px', color: 'var(--accent-text)', fontWeight: 500 }}>
                            <Brain size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                            AI Suggestion: <strong>{item.ai_suggested_status}</strong> (
                            {(item.ai_confidence_score! * 100).toFixed(0)}% confidence)
                          </p>
                          {item.ai_reasoning && (
                            <p style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '6px' }}>
                              {item.ai_reasoning}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      style={{
                        padding: '5px 12px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: itemBadge.bg,
                        color: itemBadge.color,
                        flexShrink: 0,
                      }}
                    >
                      {itemBadge.label}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', marginBottom: '6px' }}>
                        Status
                      </label>
                      <select
                        value={item.status || 'not_assessed'}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '9px 14px',
                          fontSize: '14px',
                          color: 'var(--text-1)',
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          outline: 'none',
                        }}
                      >
                        <option value="not_assessed">Not Assessed</option>
                        <option value="compliant">Compliant</option>
                        <option value="partial">Partially Compliant</option>
                        <option value="non_compliant">Non-Compliant</option>
                        <option value="not_applicable">Not Applicable</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', marginBottom: '6px' }}>
                          Evidence Upload
                        </label>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '9px 14px',
                            background: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--text-2)',
                            cursor: uploadingFor === item.id ? 'not-allowed' : 'pointer',
                            transition: 'all 150ms ease',
                          }}
                          onMouseEnter={(e) => {
                            if (uploadingFor !== item.id) {
                              e.currentTarget.style.background = 'var(--raised)';
                              e.currentTarget.style.color = 'var(--text-1)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (uploadingFor !== item.id) {
                              e.currentTarget.style.background = 'var(--card)';
                              e.currentTarget.style.color = 'var(--text-2)';
                            }
                          }}
                        >
                          <Upload size={16} />
                          {uploadingFor === item.id ? 'Uploading...' : 'Upload File'}
                          <input
                            type="file"
                            style={{ display: 'none' }}
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
                        style={{
                          padding: '9px 16px',
                          background: analyzingItem === item.id ? 'var(--ground)' : 'var(--accent)',
                          color: analyzingItem === item.id ? 'var(--text-3)' : 'var(--text-on-accent)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '14px',
                          fontWeight: 500,
                          cursor: analyzingItem === item.id ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 150ms ease',
                        }}
                        onMouseEnter={(e) => {
                          if (analyzingItem !== item.id) {
                            e.currentTarget.style.background = 'var(--accent-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (analyzingItem !== item.id) {
                            e.currentTarget.style.background = 'var(--accent)';
                          }
                        }}
                      >
                        <Brain size={16} />
                        {analyzingItem === item.id ? 'Analyzing...' : 'AI Analyze'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'vendor' && (
        <div>
          {assessment.assessment_type !== 'vendor' ? (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '64px 32px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'var(--ground)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <MessageSquare size={32} style={{ color: 'var(--text-4)' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
                Not a Vendor Assessment
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-3)', maxWidth: '400px', margin: '0 auto' }}>
                Vendor responses are only available for vendor assessments.
              </p>
            </div>
          ) : !invitation ? (
            <div
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '64px 32px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'var(--accent-subtle)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <Link2 size={32} style={{ color: 'var(--accent)' }} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
                No Vendor Invitation Sent
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-3)', maxWidth: '400px', margin: '0 auto 24px' }}>
                Create a vendor link to allow {assessment.vendor?.name || 'the vendor'} to complete their
                self-assessment.
              </p>
              <button
                onClick={() => setShowSendModal(true)}
                style={{
                  background: 'var(--accent)',
                  color: 'var(--text-on-accent)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 24px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 150ms ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
              >
                <Link2 size={16} />
                Create Vendor Link
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Vendor Link Display */}
              {showVendorLink && (
                <div
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderLeft: '4px solid var(--accent)',
                    borderRadius: 'var(--radius-md)',
                    padding: '24px',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
                    Vendor Assessment Link
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px', lineHeight: 1.5 }}>
                    Share this link with {assessment.vendor?.name || 'the vendor'} to complete their
                    self-assessment. This link can be used multiple times and is valid until{' '}
                    {formatDate(invitation.token_expires_at)}.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={`${window.location.origin}/vendor-portal/${invitation.access_token}`}
                      readOnly
                      onClick={(e) => e.currentTarget.select()}
                      style={{
                        flex: 1,
                        padding: '10px 14px',
                        fontSize: '13px',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-1)',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={handleCopyLink}
                      style={{
                        padding: '10px 16px',
                        background: 'var(--card)',
                        color: 'var(--text-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--raised)';
                        e.currentTarget.style.color = 'var(--text-1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--card)';
                        e.currentTarget.style.color = 'var(--text-2)';
                      }}
                    >
                      <Copy size={16} />
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                </div>
              )}

              {/* Invitation Details */}
              <div
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '20px' }}>
                  Invitation Status
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 640 ? '1fr' : 'repeat(2, 1fr)', gap: '20px' }}>
                  <div>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '6px' }}>
                      Status
                    </p>
                    {(() => {
                      const badge = getInvitationStatusBadge(invitation.invitation_status);
                      return (
                        <div
                          style={{
                            display: 'inline-block',
                            padding: '5px 12px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {invitation.invitation_status}
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '6px' }}>
                      Sent
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)' }}>
                      {formatDate(invitation.sent_at)}
                    </p>
                  </div>
                  {invitation.accessed_at && (
                    <div>
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '6px' }}>
                        First Accessed
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)' }}>
                        {formatDate(invitation.accessed_at)}
                      </p>
                    </div>
                  )}
                  {invitation.completed_at && (
                    <div>
                      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '6px' }}>
                        Completed
                      </p>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)' }}>
                        {formatDate(invitation.completed_at)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '6px' }}>
                      Expires
                    </p>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-1)' }}>
                      {formatDate(invitation.token_expires_at)}
                    </p>
                  </div>
                </div>

                {invitation.message && (
                  <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '8px' }}>
                      Custom Message
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                      {invitation.message}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '64px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'var(--ground)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <Clock size={32} style={{ color: 'var(--text-4)' }} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '8px' }}>
            Activity History Coming Soon
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-3)', maxWidth: '400px', margin: '0 auto' }}>
            Track all changes, updates, and actions performed on this assessment.
          </p>
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
