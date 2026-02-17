import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Shield,
  Lock,
  CheckCircle,
  XCircle,
  Circle,
  Ban,
  AlertCircle,
  Send,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import { csfApi } from '../api/csf';
import type {
  ValidateTokenResponse,
  Assessment,
  AssessmentItem,
  CsfFunction,
} from '../types';
import { getErrorMessage, formatDate } from '../api/client';

// ── Helpers ──────────────────────────────────────────────

function getStatusIcon(status: string) {
  switch (status) {
    case 'compliant':
      return <CheckCircle className="h-5 w-5 text-emerald-400" />;
    case 'partial':
      return <AlertCircle className="h-5 w-5 text-amber-400" />;
    case 'non_compliant':
      return <XCircle className="h-5 w-5 text-red-400" />;
    case 'not_applicable':
      return <Ban className="h-5 w-5 text-[#55576A]" />;
    default:
      return <Circle className="h-5 w-5 text-[#55576A]/50" />;
  }
}

const STATUS_OPTIONS = [
  { value: 'compliant', label: 'Compliant', activeClass: 'bg-emerald-500 text-white border-emerald-500' },
  { value: 'partial', label: 'Partial', activeClass: 'bg-amber-500 text-[#08090E] border-amber-500' },
  { value: 'non_compliant', label: 'Non-Compliant', activeClass: 'bg-red-500 text-white border-red-500' },
  { value: 'not_applicable', label: 'Not Applicable', activeClass: 'bg-[#55576A] text-white border-[#55576A]' },
] as const;

// ── Component ────────────────────────────────────────────

export default function VendorPortalShadcn() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<ValidateTokenResponse | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    if (token) validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await vendorInvitationsApi.validate(token);
      if (!data.valid) {
        setError(data.error || 'Invalid or expired invitation link');
        return;
      }
      setValidationData(data);
      setAssessment(data.assessment || null);
      setCompleted(data.invitation?.invitation_status === 'completed');
      if (data.assessment && token) {
        await loadAssessmentData(token);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadAssessmentData = async (tokenValue: string) => {
    try {
      setLoadingItems(true);
      const functionsData = await csfApi.getFunctions();
      setFunctions(functionsData);
      if (functionsData.length > 0) {
        setSelectedFunction(functionsData[0].id);
      }
      const itemsData = await vendorInvitationsApi.getItems(tokenValue);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to load assessment data:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingItems(false);
    }
  };

  const handleStatusChange = async (itemId: string, status: string) => {
    if (!token) return;
    try {
      const updatedItem = await vendorInvitationsApi.updateItem(token, itemId, {
        status: status as 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'not_applicable',
      });
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === itemId ? updatedItem : item)),
      );
    } catch (err) {
      console.error('Failed to update item:', err);
      alert(getErrorMessage(err));
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to submit this assessment? You will not be able to make changes after submission.')) {
      return;
    }
    try {
      setSubmitting(true);
      await vendorInvitationsApi.complete(token);
      setCompleted(true);
      alert('Assessment submitted successfully!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate progress
  const filteredItems = items.filter((item) => item.function?.id === selectedFunction);
  const totalItems = items.length;
  const assessedItems = items.filter((i) => i.status !== 'not_assessed').length;
  const progressPct = totalItems > 0 ? Math.round((assessedItems / totalItems) * 100) : 0;

  // ── Loading state ──

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090E]">
        <div className="flex items-center gap-3 text-[#8E8FA8]">
          <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
          <span className="font-sans text-sm">Validating invitation...</span>
        </div>
      </div>
    );
  }

  // ── Error state ──

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090E] p-4">
        <div className="max-w-md bg-[#0E1018] border border-white/[0.07] rounded-xl p-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <h1 className="font-display text-xl font-bold text-[#F0F0F5]">Invalid Invitation</h1>
          </div>
          <p className="mb-6 font-sans text-sm leading-relaxed text-[#8E8FA8]">{error}</p>
          <p className="font-sans text-xs text-[#55576A]">
            Please contact the organization that sent you this invitation for assistance.
          </p>
        </div>
      </div>
    );
  }

  if (!validationData || !assessment) return null;

  // ── Completed state ──

  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090E] p-4">
        <div className="max-w-md bg-[#0E1018] border border-white/[0.07] rounded-xl p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <h1 className="font-display text-xl font-bold text-[#F0F0F5] mb-2">Assessment Completed</h1>
          <p className="font-sans text-sm leading-relaxed text-[#8E8FA8] mb-6">
            Thank you for completing the cybersecurity assessment. Your responses have been submitted successfully.
          </p>
          <p className="font-mono text-xs text-[#55576A]">
            Completed on {formatDate(validationData.invitation?.completed_at || undefined)}
          </p>
        </div>
      </div>
    );
  }

  // ── Main render ──

  return (
    <div className="min-h-screen bg-[#08090E]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#0E1018]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-[#F0F0F5]">CSF Compass</h1>
              <p className="font-sans text-[11px] text-[#55576A]">Vendor Assessment Portal</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Lock className="h-3 w-3 text-emerald-400" />
            <span className="font-sans text-[11px] font-medium text-emerald-400">Secure Session</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* Welcome Card */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Lock className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold text-[#F0F0F5] mb-2">Secure Vendor Assessment</h2>
              <p className="font-sans text-sm leading-relaxed text-[#8E8FA8] mb-4">
                Welcome{validationData.vendor_contact_name ? `, ${validationData.vendor_contact_name}` : ''}.
                You've been invited to complete a cybersecurity assessment for{' '}
                <span className="font-medium text-[#F0F0F5]">{assessment.name}</span>.
                Please answer each question honestly and provide supporting documentation where applicable.
              </p>
              {validationData.invitation?.message && (
                <div className="mb-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
                  <p className="font-sans text-sm text-indigo-300">
                    {validationData.invitation.message}
                  </p>
                </div>
              )}
              <div className="flex items-center gap-4 text-[11px] text-[#55576A]">
                <span className="flex items-center gap-1 font-sans">
                  <Lock className="h-3 w-3" />
                  Encrypted communication
                </span>
                <span className="font-mono">
                  Expires {formatDate(validationData.invitation?.token_expires_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-sm font-semibold text-[#F0F0F5]">Assessment Progress</span>
            <span className="font-mono text-xs text-[#8E8FA8]">
              {assessedItems} of {totalItems} completed
            </span>
          </div>
          <div className="w-full h-2.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPct}%`,
                background: progressPct < 30 ? '#EF4444' : progressPct < 70 ? '#F59E0B' : '#10B981',
              }}
            />
          </div>
          <div className="mt-2 text-right">
            <span className={`font-display text-sm font-bold tabular-nums ${
              progressPct < 30 ? 'text-red-400' : progressPct < 70 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Assessment Card */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl overflow-hidden">
          <div className="p-6 pb-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
              <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
                NIST Cybersecurity Framework Assessment
              </h2>
            </div>
            <p className="font-sans text-sm leading-relaxed text-[#55576A] mb-6 ml-[15px]">
              Please review each category and indicate your compliance status. Your progress is saved automatically.
            </p>

            {/* Function Tabs */}
            <div className="border-b border-white/[0.06]">
              <nav className="-mb-px flex gap-1 overflow-x-auto">
                {functions.map((func) => {
                  const isSelected = selectedFunction === func.id;
                  return (
                    <button
                      key={func.id}
                      onClick={() => setSelectedFunction(func.id)}
                      className={`whitespace-nowrap px-4 py-3 font-display text-xs font-semibold tracking-wide transition-colors border-b-2 ${
                        isSelected
                          ? 'border-amber-500 text-amber-400'
                          : 'border-transparent text-[#55576A] hover:text-[#8E8FA8] hover:border-white/[0.1]'
                      }`}
                    >
                      {func.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Assessment Items */}
          <div className="p-6 space-y-3">
            {loadingItems ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg border border-white/[0.06] p-5 animate-pulse">
                    <div className="h-3 w-20 bg-white/[0.06] rounded mb-3" />
                    <div className="h-4 w-3/4 bg-white/[0.06] rounded mb-2" />
                    <div className="h-3 w-full bg-white/[0.04] rounded" />
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <p className="py-12 text-center font-sans text-sm text-[#55576A]">
                No assessment items found for this category
              </p>
            ) : (
              filteredItems.map((item) => {
                const isExpanded = expandedItem === item.id;

                return (
                  <div key={item.id} className="rounded-lg border border-white/[0.06] hover:border-white/[0.1] transition-colors overflow-hidden">
                    {/* Item Header - clickable */}
                    <button
                      onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                      className="flex w-full items-start gap-4 p-5 text-left hover:bg-amber-500/[0.02] transition-colors"
                    >
                      {getStatusIcon(item.status)}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-amber-400">
                            {item.subcategory?.id}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-sans text-[10px] font-medium uppercase tracking-wide border ${
                            item.status === 'compliant' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            item.status === 'partial' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            item.status === 'non_compliant' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            item.status === 'not_applicable' ? 'bg-white/[0.04] text-[#55576A] border-white/[0.07]' :
                            'bg-white/[0.04] text-[#55576A] border-white/[0.07]'
                          }`}>
                            {item.status === 'not_assessed' ? 'Not Assessed' :
                             item.status === 'non_compliant' ? 'Non-Compliant' :
                             item.status === 'not_applicable' ? 'N/A' :
                             item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </span>
                        </div>
                        <p className="font-sans text-sm font-medium text-[#F0F0F5]">{item.subcategory?.name}</p>
                        {item.subcategory?.description && (
                          <p className="mt-1 font-sans text-xs leading-relaxed text-[#55576A]">
                            {item.subcategory.description}
                          </p>
                        )}
                      </div>
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 text-[#55576A] transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                      />
                    </button>

                    {/* Expanded: Status Selection */}
                    {isExpanded && (
                      <div className="border-t border-white/[0.06] px-5 pb-5 pt-4 bg-white/[0.01]">
                        <p className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold mb-3">
                          Select compliance status
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.map(({ value, label, activeClass }) => {
                            const isActive = item.status === value;
                            return (
                              <button
                                key={value}
                                onClick={() => handleStatusChange(item.id, value)}
                                className={`px-3 py-1.5 rounded-lg font-sans text-xs font-medium border transition-all ${
                                  isActive
                                    ? activeClass
                                    : 'bg-white/[0.04] text-[#8E8FA8] border-white/[0.07] hover:bg-white/[0.07] hover:text-[#F0F0F5]'
                                }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Submit Footer */}
        <div className="flex items-center justify-between pb-8 pt-2">
          <p className="font-sans text-xs text-[#55576A]">
            Your progress is saved automatically when you change a status
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Assessment
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/[0.06]">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <p className="text-center font-sans text-[11px] text-[#55576A]">
            Powered by CSF Compass — NIST Cybersecurity Framework 2.0
          </p>
        </div>
      </footer>
    </div>
  );
}
