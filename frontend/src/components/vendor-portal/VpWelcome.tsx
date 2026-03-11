import { useState, type CSSProperties } from 'react';
import { ListChecks, Clock, CalendarDays, Lock, Shield, Save, ArrowRight } from 'lucide-react';
import { T, card, inputStyle } from '../../tokens';
import { CsfLogo } from '../CsfLogo';
import { formatDate } from '../../api/client';

interface VpWelcomeProps {
  assessmentName: string;
  vendorContactName?: string;
  expiresAt?: number;
  totalControls: number;
  respondentName: string;
  onRespondentNameChange: (name: string) => void;
  onStart: () => void;
}

const fadeInUp: CSSProperties = {
  animation: 'vpWelcomeFadeInUp 0.5s ease-out both',
};

export function VpWelcome({
  assessmentName,
  expiresAt,
  totalControls,
  respondentName,
  onRespondentNameChange,
  onStart,
}: VpWelcomeProps) {
  const [focused, setFocused] = useState(false);
  const canStart = respondentName.trim().length > 0;

  return (
    <>
      <style>{`
        @keyframes vpWelcomeFadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .vp-start-btn:hover:not(:disabled) {
          filter: brightness(1.08);
          transform: translateY(-1px);
        }
        .vp-start-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .vp-start-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .vp-info-card:hover {
          border-color: ${T.accentBorder};
          background: ${T.accentLight};
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: T.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div style={{
          ...card,
          maxWidth: 520,
          width: '100%',
          padding: '44px 40px 36px',
          ...fadeInUp,
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <CsfLogo size={36} />
              <span style={{
                fontFamily: T.fontDisplay,
                fontSize: 22,
                fontWeight: 700,
                color: T.accent,
                letterSpacing: '-0.01em',
              }}>
                CSF Compass
              </span>
            </div>
          </div>

          {/* Assessment title */}
          <h1 style={{
            fontFamily: T.fontDisplay,
            fontSize: 28,
            fontWeight: 700,
            color: T.textPrimary,
            textAlign: 'center',
            margin: '0 0 28px',
            lineHeight: 1.15,
          }}>
            {assessmentName}
          </h1>

          {/* Info cards row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            marginBottom: 28,
          }}>
            <InfoCard icon={<ListChecks size={17} />} label={`${totalControls} Controls`} />
            <InfoCard icon={<Clock size={17} />} label="~25 min" />
            <InfoCard
              icon={<CalendarDays size={17} />}
              label={expiresAt ? formatDate(expiresAt) : 'No deadline specified'}
            />
          </div>

          {/* Respondent name input */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontFamily: T.fontSans,
              fontSize: 12,
              fontWeight: 600,
              color: T.textSecondary,
              display: 'block',
              marginBottom: 7,
            }}>
              Assessment respondent
            </label>
            <input
              type="text"
              value={respondentName}
              onChange={e => onRespondentNameChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Full Name"
              style={{
                ...inputStyle(),
                borderColor: focused ? T.accent : T.border,
                boxShadow: focused ? `0 0 0 3px ${T.accentLight}` : 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />
          </div>

          {/* Trust indicators */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 18,
            marginBottom: 28,
            flexWrap: 'wrap',
          }}>
            <TrustBadge icon={<Lock size={12} />} label="Encrypted connection" />
            <TrustBadge icon={<Shield size={12} />} label="NIST CSF 2.0" />
            <TrustBadge icon={<Save size={12} />} label="Auto-save" />
          </div>

          {/* Start button */}
          <button
            className="vp-start-btn"
            disabled={!canStart}
            onClick={onStart}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 10,
              border: 'none',
              background: T.accent,
              color: '#fff',
              fontFamily: T.fontSans,
              fontSize: 15,
              fontWeight: 700,
              cursor: canStart ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'filter 0.15s, transform 0.15s',
            }}
          >
            Start Assessment
            <ArrowRight size={18} />
          </button>

          {/* Footer */}
          <p style={{
            textAlign: 'center',
            fontFamily: T.fontSans,
            fontSize: 11,
            color: T.textFaint,
            marginTop: 28,
            marginBottom: 0,
          }}>
            Powered by CSF Compass
          </p>
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ── */

function InfoCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      className="vp-info-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '14px 8px',
        borderRadius: 10,
        border: `1px solid ${T.borderLight}`,
        background: T.card,
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <span style={{ color: T.accent }}>{icon}</span>
      <span style={{
        fontFamily: T.fontSans,
        fontSize: 12,
        fontWeight: 600,
        color: T.textSecondary,
        textAlign: 'center',
        lineHeight: 1.3,
      }}>
        {label}
      </span>
    </div>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontFamily: T.fontSans,
      fontSize: 11,
      color: T.textMuted,
    }}>
      {icon}
      {label}
    </span>
  );
}
