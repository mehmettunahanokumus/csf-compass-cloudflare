import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Shield,
  Lock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Loader2,
  Check,
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
import { T, card, sectionLabel } from '../tokens';
import ControlItem from '../components/assessment/ControlItem';

// ── Toast component ────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);
  const isErr = type === 'error';
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 18px', borderRadius: 10, maxWidth: 400,
      background: isErr ? T.dangerLight : T.successLight,
      border: `1px solid ${isErr ? T.dangerBorder : T.successBorder}`,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      animation: 'vp-toast-in 200ms ease-out',
    }}>
      {isErr
        ? <AlertCircle size={16} style={{ color: T.danger, flexShrink: 0 }} />
        : <Check size={16} style={{ color: T.success, flexShrink: 0 }} />
      }
      <span style={{ fontFamily: T.fontSans, fontSize: 13, color: isErr ? T.danger : T.success }}>
        {message}
      </span>
    </div>
  );
}

// ── Animation CSS ──────────────────────────────────────
const ANIM_CSS = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes vp-toast-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
`;

type StatusFilter = 'all' | 'unanswered' | 'compliant' | 'partial' | 'non_compliant';
const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unanswered', label: 'Unanswered' },
  { value: 'compliant', label: 'Compliant' },
  { value: 'partial', label: 'Partial' },
  { value: 'non_compliant', label: 'Non-Compliant' },
];

// ── Component ──────────────────────────────────────────
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Notes debounce refs
  const notesTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

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
      if (functionsData.length > 0) setSelectedFunction(functionsData[0].id);
      const itemsData = await vendorInvitationsApi.getItems(tokenValue);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to load assessment data:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingItems(false);
    }
  };

  // Ref for rollback on API failure (avoids stale closure)
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Auto-scroll helper: scroll to bring the next control into view
  const scrollToNextControl = useCallback((itemId: string) => {
    requestAnimationFrame(() => {
      const allControls = document.querySelectorAll('[id^="control-"]');
      const arr = Array.from(allControls);
      const currentEl = document.getElementById(`control-${itemId}`);
      const currentIdx = currentEl ? arr.indexOf(currentEl) : -1;
      if (currentIdx >= 0 && currentIdx < arr.length - 1) {
        const nextEl = arr[currentIdx + 1] as HTMLElement;
        const rect = nextEl.getBoundingClientRect();
        if (rect.top > window.innerHeight - 120) {
          nextEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });
  }, []);

  // ── Status change with optimistic UI ──
  const handleStatusChange = useCallback(async (itemId: string, status: string) => {
    if (!token) return;

    // Save previous state for rollback
    const prevItems = itemsRef.current;

    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, status: status as AssessmentItem['status'] } : item
    ));
    setSavingItems(prev => new Set(prev).add(itemId));

    // Auto-scroll to next control
    scrollToNextControl(itemId);

    try {
      const updatedItem = await vendorInvitationsApi.updateItem(token, itemId, {
        status: status as 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'not_applicable',
      });
      // Merge API response with existing CSF metadata (API returns flat row without joins)
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, status: updatedItem.status, notes: updatedItem.notes, updated_at: updatedItem.updated_at }
          : item
      ));
    } catch (err) {
      // Revert on failure
      setItems(prevItems);
      setToast({ message: `Failed to save: ${getErrorMessage(err)}`, type: 'error' });
    } finally {
      setSavingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  }, [token, scrollToNextControl]);

  // ── Notes auto-save on blur / debounce ──
  const handleNotesChange = useCallback((itemId: string, notes: string) => {
    // Update local state immediately
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, notes } : item
    ));

    // Debounce API call
    if (notesTimers.current[itemId]) clearTimeout(notesTimers.current[itemId]);
    notesTimers.current[itemId] = setTimeout(async () => {
      if (!token) return;
      try {
        const currentItem = items.find(i => i.id === itemId);
        await vendorInvitationsApi.updateItem(token, itemId, {
          status: (currentItem?.status || 'not_assessed') as any,
          notes,
        });
      } catch (err) {
        setToast({ message: `Failed to save notes: ${getErrorMessage(err)}`, type: 'error' });
      }
    }, 800);
  }, [token, items]);

  const handleSubmit = async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to submit this assessment? You will not be able to make changes after submission.')) return;
    try {
      setSubmitting(true);
      await vendorInvitationsApi.complete(token);
      setCompleted(true);
    } catch (err) {
      setToast({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = useCallback((itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  }, []);

  const filteredItems = useMemo(() => {
    let filtered = items.filter((item) => item.function?.id === selectedFunction);
    if (statusFilter !== 'all') {
      filtered = filtered.filter((item) => {
        if (statusFilter === 'unanswered') return item.status === 'not_assessed';
        return item.status === statusFilter;
      });
    }
    return filtered;
  }, [items, selectedFunction, statusFilter]);
  const totalItems = items.length;
  const assessedItems = items.filter((i) => i.status !== 'not_assessed').length;
  const progressPct = totalItems > 0 ? Math.round((assessedItems / totalItems) * 100) : 0;

  // ── Loading state ──
  if (loading) {
    return (
      <>
        <style>{ANIM_CSS}</style>
        <div style={{
          display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
          background: T.bg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: T.textSecondary }}>
            <Loader2 size={20} style={{ color: T.accent, animation: 'spin 1s linear infinite' }} />
            <span style={{ fontFamily: T.fontSans, fontSize: 14 }}>Validating invitation...</span>
          </div>
        </div>
      </>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div style={{
        display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
        background: T.bg, padding: 24,
      }}>
        <div style={{ ...card, maxWidth: 440, padding: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, flexShrink: 0,
              background: T.dangerLight, border: `1px solid ${T.dangerBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <XCircle size={20} style={{ color: T.danger }} />
            </div>
            <h1 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 700, color: T.textPrimary, margin: 0, letterSpacing: '0.01em' }}>
              Invalid Invitation
            </h1>
          </div>
          <p style={{ fontFamily: T.fontSans, fontSize: 14, color: T.textSecondary, lineHeight: 1.7, marginBottom: 20 }}>
            {error}
          </p>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted }}>
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
      <div style={{
        display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
        background: T.bg, padding: 24,
      }}>
        <div style={{ ...card, maxWidth: 440, padding: 40, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: T.successLight, border: `1px solid ${T.successBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={32} style={{ color: T.success }} />
            </div>
          </div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: 24, fontWeight: 700, color: T.textPrimary, margin: '0 0 10px', letterSpacing: '0.01em' }}>
            Assessment Completed
          </h1>
          <p style={{ fontFamily: T.fontSans, fontSize: 14, color: T.textSecondary, lineHeight: 1.7, marginBottom: 20 }}>
            Thank you for completing the cybersecurity assessment. Your responses have been submitted successfully.
          </p>
          <p style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textMuted }}>
            Completed on {formatDate(validationData.invitation?.completed_at || undefined)}
          </p>
        </div>
      </div>
    );
  }

  // ── Main render ──
  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      <style>{ANIM_CSS}</style>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        borderBottom: `1px solid ${T.border}`,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      }}>
        <div style={{
          margin: '0 auto', maxWidth: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: T.accentLight, border: `1px solid ${T.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={20} style={{ color: T.accent }} />
            </div>
            <div>
              <h1 style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700, color: T.textPrimary, margin: 0, letterSpacing: '0.02em' }}>
                CSF Compass
              </h1>
              <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, marginTop: 1 }}>
                Vendor Assessment Portal
              </p>
            </div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px',
            background: T.successLight, border: `1px solid ${T.successBorder}`,
            borderRadius: 999,
          }}>
            <Lock size={12} style={{ color: T.success }} />
            <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.success }}>
              Secure Session
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ margin: '0 auto', maxWidth: 900, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Welcome Card */}
        <div style={{ ...card, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: T.accentLight, border: `1px solid ${T.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={22} style={{ color: T.accent }} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: T.fontDisplay, fontSize: 20, fontWeight: 700, color: T.textPrimary, margin: '0 0 8px', letterSpacing: '0.01em' }}>
                Secure Vendor Assessment
              </h2>
              <p style={{ fontFamily: T.fontSans, fontSize: 14, color: T.textSecondary, lineHeight: 1.7, marginBottom: 14 }}>
                Welcome{validationData.vendor_contact_name ? `, ${validationData.vendor_contact_name}` : ''}.
                You've been invited to complete a cybersecurity assessment for{' '}
                <span style={{ fontWeight: 700, color: T.textPrimary }}>{assessment.name}</span>.
                Please answer each question honestly and provide supporting documentation where applicable.
              </p>
              {validationData.invitation?.message && (
                <div style={{
                  marginBottom: 14, padding: 14, borderRadius: 9,
                  background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                }}>
                  <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.accent, margin: 0 }}>
                    {validationData.invitation.message}
                  </p>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: T.fontSans, fontSize: 11, color: T.textMuted }}>
                  <Lock size={12} />
                  Encrypted communication
                </span>
                <span style={{ fontFamily: T.fontMono, fontSize: 11, color: T.textMuted }}>
                  Expires {formatDate(validationData.invitation?.token_expires_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Card */}
        <div style={{ ...card, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 700, color: T.textPrimary, letterSpacing: '0.02em' }}>
              Assessment Progress
            </span>
            <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSecondary }}>
              {assessedItems} of {totalItems} controls assessed
            </span>
          </div>
          <div style={{ width: '100%', height: 10, background: T.borderLight, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999, transition: 'width 0.5s ease-out',
              width: `${progressPct}%`,
              background: progressPct < 30 ? T.danger : progressPct < 70 ? T.warning : T.success,
            }} />
          </div>
          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <span style={{
              fontFamily: T.fontDisplay, fontSize: 14, fontWeight: 700,
              color: progressPct < 30 ? T.danger : progressPct < 70 ? T.warning : T.success,
            }}>
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Assessment Card */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '24px 24px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: T.accent, flexShrink: 0 }} />
              <span style={sectionLabel}>NIST Cybersecurity Framework Assessment</span>
            </div>
            <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, lineHeight: 1.6, marginBottom: 20, paddingLeft: 11 }}>
              Use the status buttons on each control to set your compliance status. Click <strong style={{ color: T.accent }}>Details</strong> for guidance on what's required.
            </p>

            {/* Function Tabs */}
            <div style={{ borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 2, overflowX: 'auto' }}>
              {functions.map((func) => {
                const isSelected = selectedFunction === func.id;
                const funcItems = items.filter(i => i.function?.id === func.id);
                const funcAssessed = funcItems.filter(i => i.status !== 'not_assessed').length;
                return (
                  <button
                    key={func.id}
                    onClick={() => setSelectedFunction(func.id)}
                    style={{
                      padding: '10px 18px', fontFamily: T.fontDisplay,
                      fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
                      whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                      borderBottom: isSelected ? `2px solid ${T.accent}` : '2px solid transparent',
                      color: isSelected ? T.accent : T.textMuted,
                      background: 'transparent', transition: 'all 0.14s',
                      marginBottom: -1, position: 'relative',
                    }}
                    onMouseEnter={e => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.color = T.textSecondary; } }}
                    onMouseLeave={e => { if (!isSelected) { (e.currentTarget as HTMLButtonElement).style.color = isSelected ? T.accent : T.textMuted; } }}
                  >
                    {func.name}
                    {funcItems.length > 0 && (
                      <span style={{
                        marginLeft: 6, fontFamily: T.fontMono, fontSize: 10,
                        color: funcAssessed === funcItems.length ? T.success : T.textFaint,
                      }}>
                        {funcAssessed}/{funcItems.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sticky Progress Bar + Status Filter */}
          <div style={{
            position: 'sticky', top: 68, zIndex: 5,
            padding: '10px 24px',
            background: T.card,
            borderBottom: `1px solid ${T.border}`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: T.fontMono, fontSize: 12, color: T.textSecondary }}>
                <span style={{ fontWeight: 700, color: T.accent }}>{assessedItems}</span> of {totalItems} assessed
              </span>
              <span style={{
                fontFamily: T.fontMono, fontSize: 12, fontWeight: 700,
                color: progressPct < 30 ? T.danger : progressPct < 70 ? T.warning : T.success,
              }}>
                {progressPct}%
              </span>
            </div>
            <div style={{
              width: '100%', height: 5, background: T.border, borderRadius: 999,
              overflow: 'hidden', marginBottom: 8,
            }}>
              <div style={{
                height: '100%', borderRadius: 999,
                background: progressPct < 30 ? T.danger : progressPct < 70 ? T.warning : T.success,
                width: `${progressPct}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {STATUS_FILTER_OPTIONS.map(({ value, label }) => {
                const isActive = statusFilter === value;
                return (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    style={{
                      padding: '3px 9px', borderRadius: 5,
                      fontFamily: T.fontSans, fontSize: 10, fontWeight: isActive ? 600 : 500,
                      background: isActive ? T.accentLight : 'transparent',
                      border: `1px solid ${isActive ? T.accentBorder : T.border}`,
                      color: isActive ? T.accent : T.textMuted,
                      cursor: 'pointer', transition: 'all 0.14s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assessment Items */}
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loadingItems ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ borderRadius: 10, border: `1px solid ${T.border}`, padding: 20 }}>
                    <div style={{ height: 12, width: 80, borderRadius: 4, background: T.borderLight, marginBottom: 12 }} />
                    <div style={{ height: 15, width: '60%', borderRadius: 4, background: T.borderLight, marginBottom: 8 }} />
                    <div style={{ height: 11, width: '85%', borderRadius: 4, background: T.borderLight }} />
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <p style={{ fontFamily: T.fontSans, fontSize: 14, color: T.textMuted, textAlign: 'center', padding: '40px 0' }}>
                No assessment items found for this category
              </p>
            ) : (
              filteredItems.map((item) => (
                <ControlItem
                  key={item.id}
                  item={item}
                  mode="interactive"
                  statusOptions="vendor"
                  showNotes={true}
                  showGuidance={false}
                  expanded={expandedItems.has(item.id)}
                  onToggleExpand={toggleExpand}
                  onStatusChange={handleStatusChange}
                  onNotesChange={handleNotesChange}
                  isSaving={savingItems.has(item.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Submit Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 32 }}>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted }}>
            Your progress is saved automatically when you change a status
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 9,
              background: submitting ? T.borderLight : T.accent,
              color: submitting ? T.textMuted : '#fff', border: 'none',
              fontFamily: T.fontDisplay, fontSize: 15, fontWeight: 700, letterSpacing: '0.02em',
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 1px 3px rgba(79,70,229,0.3)',
              transition: 'all 0.14s',
            }}
            onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = '#4338CA'; }}
            onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = T.accent; }}
          >
            {submitting ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Assessment
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${T.border}`, marginTop: 24 }}>
        <div style={{ margin: '0 auto', maxWidth: 900, padding: '20px 24px' }}>
          <p style={{ textAlign: 'center', fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, margin: 0 }}>
            Powered by CSF Compass — NIST Cybersecurity Framework 2.0
          </p>
        </div>
      </footer>
    </div>
  );
}
