import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
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
import { T, card } from '../tokens';
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

  // ── Computed: per-function counts for compact tabs ──
  const funcCounts = useMemo(() => {
    const map: Record<string, { total: number; assessed: number }> = {};
    for (const func of functions) {
      const funcItems = items.filter(i => i.function?.id === func.id);
      map[func.id] = { total: funcItems.length, assessed: funcItems.filter(i => i.status !== 'not_assessed').length };
    }
    return map;
  }, [items, functions]);

  // Short function name: "Govern" from "Govern (GV)"
  const shortFuncName = (name: string) => name.replace(/\s*\(.*\)$/, '');

  // ── Main render ──
  return (
    <div style={{ minHeight: '100vh', background: T.bg }}>
      <style>{ANIM_CSS}</style>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ─── Compact Header Bar ─── */}
      <header style={{
        borderBottom: `1px solid ${T.border}`,
        background: T.card,
      }}>
        <div style={{
          margin: '0 auto', maxWidth: 900,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 20px',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
            <Lock size={15} style={{ color: T.accent, flexShrink: 0 }} />
            <span style={{
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textPrimary,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {assessment.name}
            </span>
            <span style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {validationData.vendor_contact_name ? `• ${validationData.vendor_contact_name}` : ''}
              {validationData.invitation?.token_expires_at
                ? ` • Expires ${formatDate(validationData.invitation.token_expires_at)}`
                : ''}
            </span>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            background: T.successLight, border: `1px solid ${T.successBorder}`,
            borderRadius: 999, flexShrink: 0,
          }}>
            <Lock size={10} style={{ color: T.success }} />
            <span style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 600, color: T.success }}>
              Secure
            </span>
          </div>
        </div>
      </header>

      {/* ─── Sticky: Function Tabs + Progress + Filters ─── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: T.card,
        borderBottom: `1px solid ${T.border}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <div style={{ margin: '0 auto', maxWidth: 900, padding: '0 20px' }}>
          {/* Function tabs row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 0,
            overflowX: 'auto', paddingTop: 6,
          }}>
            {functions.map((func) => {
              const isSelected = selectedFunction === func.id;
              const counts = funcCounts[func.id] || { total: 0, assessed: 0 };
              return (
                <button
                  key={func.id}
                  onClick={() => setSelectedFunction(func.id)}
                  style={{
                    padding: '7px 12px', fontFamily: T.fontSans,
                    fontSize: 11, fontWeight: isSelected ? 700 : 500,
                    whiteSpace: 'nowrap', border: 'none', cursor: 'pointer',
                    borderBottom: isSelected ? `2px solid ${T.accent}` : '2px solid transparent',
                    color: isSelected ? T.accent : T.textMuted,
                    background: 'transparent', transition: 'all 0.12s',
                    marginBottom: -1,
                  }}
                >
                  {shortFuncName(func.name)}
                  <span style={{
                    marginLeft: 4, fontFamily: T.fontMono, fontSize: 9,
                    color: counts.assessed === counts.total && counts.total > 0 ? T.success : T.textFaint,
                  }}>
                    {counts.assessed}/{counts.total}
                  </span>
                </button>
              );
            })}
            {/* Progress % right-aligned */}
            <div style={{ marginLeft: 'auto', paddingLeft: 12, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{
                fontFamily: T.fontMono, fontSize: 11, fontWeight: 700,
                color: progressPct < 30 ? T.danger : progressPct < 70 ? T.warning : T.success,
              }}>
                {progressPct}%
              </span>
              <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted }}>
                ({assessedItems}/{totalItems})
              </span>
            </div>
          </div>

          {/* Thin progress bar */}
          <div style={{
            width: '100%', height: 3, background: T.borderLight, borderRadius: 999,
            overflow: 'hidden', margin: '4px 0',
          }}>
            <div style={{
              height: '100%', borderRadius: 999,
              background: progressPct < 30 ? T.danger : progressPct < 70 ? T.warning : T.success,
              width: `${progressPct}%`,
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 4, paddingBottom: 7 }}>
            {STATUS_FILTER_OPTIONS.map(({ value, label }) => {
              const isActive = statusFilter === value;
              return (
                <button
                  key={value}
                  onClick={() => setStatusFilter(value)}
                  style={{
                    padding: '2px 8px', borderRadius: 4,
                    fontFamily: T.fontSans, fontSize: 10, fontWeight: isActive ? 600 : 500,
                    background: isActive ? T.accentLight : 'transparent',
                    border: `1px solid ${isActive ? T.accentBorder : 'transparent'}`,
                    color: isActive ? T.accent : T.textMuted,
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Controls List ─── */}
      <main style={{ margin: '0 auto', maxWidth: 900, padding: '10px 20px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {loadingItems ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 0' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ borderRadius: 8, border: `1px solid ${T.border}`, padding: 14 }}>
                  <div style={{ height: 10, width: 70, borderRadius: 3, background: T.borderLight, marginBottom: 10 }} />
                  <div style={{ height: 12, width: '55%', borderRadius: 3, background: T.borderLight, marginBottom: 6 }} />
                  <div style={{ height: 10, width: '80%', borderRadius: 3, background: T.borderLight }} />
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, textAlign: 'center', padding: '32px 0' }}>
              {statusFilter !== 'all'
                ? `No ${statusFilter === 'unanswered' ? 'unanswered' : statusFilter.replace('_', '-')} controls in this function`
                : 'No controls found for this function'}
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

        {/* Submit Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 0 32px', marginTop: 8,
        }}>
          <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, margin: 0 }}>
            Progress saved automatically
          </p>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 20px', borderRadius: 8,
              background: submitting ? T.borderLight : T.accent,
              color: submitting ? T.textMuted : '#fff', border: 'none',
              fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: submitting ? 'none' : '0 1px 3px rgba(79,70,229,0.3)',
              transition: 'all 0.14s',
            }}
            onMouseEnter={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
            onMouseLeave={e => { if (!submitting) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            {submitting ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Submitting...
              </>
            ) : (
              <>
                <Send size={14} />
                Submit Assessment
              </>
            )}
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${T.border}` }}>
        <div style={{ margin: '0 auto', maxWidth: 900, padding: '14px 20px' }}>
          <p style={{ textAlign: 'center', fontFamily: T.fontSans, fontSize: 10, color: T.textMuted, margin: 0 }}>
            CSF Compass — NIST CSF 2.0
          </p>
        </div>
      </footer>
    </div>
  );
}
