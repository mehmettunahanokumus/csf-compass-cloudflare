import type { CSSProperties } from 'react';
import { CheckCircle } from 'lucide-react';
import { T } from '../../tokens';
import { formatDate } from '../../api/client';

interface VpCompleteProps {
  completedAt?: string | number;
  assessmentName: string;
}

const fadeIn: CSSProperties = {
  animation: 'vpCompleteFadeIn 0.5s ease-out both',
};

export function VpComplete({ completedAt, assessmentName }: VpCompleteProps) {
  const formattedDate = completedAt
    ? formatDate(typeof completedAt === 'string' ? Date.parse(completedAt) : completedAt)
    : formatDate(Date.now());

  return (
    <>
      <style>{`
        @keyframes vpCompleteFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes vpCompletePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.06); opacity: 0.85; }
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 440,
          width: '100%',
          ...fadeIn,
        }}>
          {/* Success icon */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: T.successLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 28,
            animation: 'vpCompletePulse 2.4s ease-in-out infinite',
          }}>
            <CheckCircle size={40} style={{ color: T.success }} />
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: T.fontDisplay,
            fontSize: 28,
            fontWeight: 700,
            color: T.textPrimary,
            margin: '0 0 14px',
            textAlign: 'center',
          }}>
            Degerlendirme Tamamlandi
          </h1>

          {/* Message */}
          <p style={{
            fontFamily: T.fontSans,
            fontSize: 14,
            color: T.textSecondary,
            textAlign: 'center',
            lineHeight: 1.6,
            margin: '0 0 24px',
            maxWidth: 380,
          }}>
            Siber guvenlik degerlendirmesini tamamladiginiz icin tesekkur ederiz.
            Yanitlariniz basariyla gonderildi.
          </p>

          {/* Assessment name badge */}
          <span style={{
            fontFamily: T.fontSans,
            fontSize: 12,
            fontWeight: 600,
            color: T.accent,
            background: T.accentLight,
            padding: '6px 16px',
            borderRadius: 20,
            marginBottom: 16,
          }}>
            {assessmentName}
          </span>

          {/* Completion date */}
          <span style={{
            fontFamily: T.fontMono,
            fontSize: 12,
            color: T.textMuted,
            marginBottom: 48,
          }}>
            Tamamlanma tarihi: {formattedDate}
          </span>

          {/* Footer */}
          <span style={{
            fontFamily: T.fontSans,
            fontSize: 11,
            color: T.textFaint,
          }}>
            Powered by CSF Compass
          </span>
        </div>
      </div>
    </>
  );
}
