import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { XCircle, AlertCircle, Check, Loader2 } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import { csfApi } from '../api/csf';
import type {
  ValidateTokenResponse,
  Assessment,
  CsfFunction,
  ConsolidatedQuestion,
  MaturityLevelInfo,
  ConsolidatedViewResponse,
} from '../types';
import { getErrorMessage } from '../api/client';
import { T, card } from '../tokens';
import { VpHeader } from '../components/vendor-portal/VpHeader';
import { VpWelcome } from '../components/vendor-portal/VpWelcome';
import { VpComplete } from '../components/vendor-portal/VpComplete';
import VpAssessment from '../components/vendor-portal/VpAssessment';
import VpReview from '../components/vendor-portal/VpReview';

// ── Phases ────────────────────────────────────────────────
type Phase = 'loading' | 'error' | 'welcome' | 'assessment' | 'review' | 'completed';

// ── Toast component ───────────────────────────────────────
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

const ANIM_CSS = `
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes vp-toast-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
`;

// ── Main Component ────────────────────────────────────────
export default function VendorPortalShadcn() {
  const { token } = useParams<{ token: string }>();

  // Data state
  const [validationData, setValidationData] = useState<ValidateTokenResponse | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  // Consolidated questions state
  const [consolidatedQuestions, setConsolidatedQuestions] = useState<ConsolidatedQuestion[]>([]);
  const [categoriesMap, setCategoriesMap] = useState<ConsolidatedViewResponse['categories']>({});
  const [maturityLevels, setMaturityLevels] = useState<MaturityLevelInfo[]>([]);

  // Phase state
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [respondentName, setRespondentName] = useState('');

  // ── Progress ──
  const totalQuestions = consolidatedQuestions.length;
  const answeredQuestions = useMemo(
    () => consolidatedQuestions.filter(q => q.current_maturity !== null && q.current_maturity !== undefined).length,
    [consolidatedQuestions]
  );
  const progressPct = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // ── Token validation ──
  useEffect(() => {
    if (token) validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) return;
    try {
      setPhase('loading');
      const data = await vendorInvitationsApi.validate(token);
      if (!data.valid) {
        setError(data.error || 'Invalid or expired invitation link');
        setPhase('error');
        return;
      }
      setValidationData(data);
      setAssessment(data.assessment || null);

      if (data.invitation?.invitation_status === 'completed') {
        setPhase('completed');
        return;
      }

      if (data.assessment && token) {
        await loadAssessmentData(token);
      }
      setPhase('welcome');
    } catch (err) {
      setError(getErrorMessage(err));
      setPhase('error');
    }
  };

  const loadAssessmentData = async (tokenValue: string) => {
    try {
      const [functionsData, consolidatedData] = await Promise.all([
        csfApi.getFunctions(),
        vendorInvitationsApi.getConsolidatedView(tokenValue),
      ]);
      setFunctions(functionsData);
      if (functionsData.length > 0) setSelectedFunction(functionsData[0].id);

      setConsolidatedQuestions(consolidatedData.questions);
      setCategoriesMap(consolidatedData.categories);
      setMaturityLevels(consolidatedData.maturity_levels);

    } catch (err) {
      console.error('Failed to load assessment data:', err);
      setError(getErrorMessage(err));
      setPhase('error');
    }
  };

  // ── Maturity change handler ──
  const handleMaturityChange = useCallback(async (questionId: string, level: number, notes?: string) => {
    if (!token) return;

    // Optimistic update
    setConsolidatedQuestions(prev => prev.map(q =>
      q.id === questionId ? { ...q, current_maturity: level, current_notes: notes || null } : q
    ));
    setSavingQuestions(prev => new Set(prev).add(questionId));

    try {
      await vendorInvitationsApi.submitConsolidatedAnswer(token, {
        consolidated_question_id: questionId,
        maturity_level: level,
        notes,
      });
    } catch (err) {
      // Revert on error
      setConsolidatedQuestions(prev => prev.map(q =>
        q.id === questionId ? { ...q, current_maturity: null, current_notes: null } : q
      ));
      setToast({ message: `Kaydedilemedi: ${getErrorMessage(err)}`, type: 'error' });
    } finally {
      setSavingQuestions(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
    }
  }, [token]);

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!token) return;
    try {
      setSubmitting(true);
      await vendorInvitationsApi.complete(token, respondentName.trim() || undefined);
      setPhase('completed');
    } catch (err) {
      setToast({ message: getErrorMessage(err), type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }, [token, respondentName]);

  // ── Welcome start handler ──
  const handleStart = useCallback(() => {
    setPhase('assessment');
  }, []);

  // ── Review navigation ──
  const handleGoToReview = useCallback(() => {
    setPhase('review');
  }, []);

  const handleGoBackFromReview = useCallback(() => {
    setPhase('assessment');
  }, []);

  const handleGoToFunction = useCallback((functionId: string) => {
    setSelectedFunction(functionId);
    setPhase('assessment');
  }, []);

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════

  // ── Loading ──
  if (phase === 'loading') {
    return (
      <>
        <style>{ANIM_CSS}</style>
        <div style={{
          display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
          background: T.bg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: T.textSecondary }}>
            <Loader2 size={20} style={{ color: T.accent, animation: 'spin 1s linear infinite' }} />
            <span style={{ fontFamily: T.fontSans, fontSize: 14 }}>Davetiye dogrulaniyor...</span>
          </div>
        </div>
      </>
    );
  }

  // ── Error ──
  if (phase === 'error') {
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
              Gecersiz Davetiye
            </h1>
          </div>
          <p style={{ fontFamily: T.fontSans, fontSize: 14, color: T.textSecondary, lineHeight: 1.7, marginBottom: 20 }}>
            {error}
          </p>
          <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted }}>
            Yardim icin bu davetiyeyi gonderen kurulusla iletisime gecin.
          </p>
        </div>
      </div>
    );
  }

  // ── Completed ──
  if (phase === 'completed') {
    return (
      <VpComplete
        assessmentName={assessment?.name || ''}
        completedAt={validationData?.invitation?.completed_at || undefined}
      />
    );
  }

  if (!validationData || !assessment) return null;

  // ── Welcome ──
  if (phase === 'welcome') {
    return (
      <VpWelcome
        assessmentName={assessment.name}
        vendorContactName={validationData.vendor_contact_name}
        expiresAt={validationData.invitation?.token_expires_at}
        totalControls={totalQuestions}
        respondentName={respondentName}
        onRespondentNameChange={setRespondentName}
        onStart={handleStart}
      />
    );
  }

  // ── Review ──
  if (phase === 'review') {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
        <style>{ANIM_CSS}</style>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <VpHeader
          assessmentName={assessment.name}
          progressPct={progressPct}
          assessedCount={answeredQuestions}
          totalCount={totalQuestions}
        />
        <VpReview
          consolidatedQuestions={consolidatedQuestions}
          categoriesMap={categoriesMap}
          maturityLevels={maturityLevels}
          functions={functions}
          respondentName={respondentName}
          submitting={submitting}
          onSubmit={handleSubmit}
          onGoBack={handleGoBackFromReview}
          onGoToFunction={handleGoToFunction}
        />
      </div>
    );
  }

  // ── Assessment (main) ──
  return (
    <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <style>{ANIM_CSS}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <VpHeader
        assessmentName={assessment.name}
        progressPct={progressPct}
        assessedCount={answeredQuestions}
        totalCount={totalQuestions}
      />
      <VpAssessment
        consolidatedQuestions={consolidatedQuestions}
        categoriesMap={categoriesMap}
        maturityLevels={maturityLevels}
        functions={functions}
        selectedFunctionId={selectedFunction}
        onSelectFunction={setSelectedFunction}
        savingQuestions={savingQuestions}
        onMaturityChange={handleMaturityChange}
        onReview={handleGoToReview}
      />
    </div>
  );
}
