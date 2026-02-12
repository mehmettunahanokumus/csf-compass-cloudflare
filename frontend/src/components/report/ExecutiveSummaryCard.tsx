/**
 * ExecutiveSummaryCard - AI-generated executive summary display
 * Shows maturity tier, strengths, gaps, priority actions, and risk assessment
 */

import {
  CheckCircle,
  AlertTriangle,
  ListOrdered,
  ShieldAlert,
  Brain,
  Loader2,
} from 'lucide-react';

export interface ExecutiveSummaryData {
  maturityTier?: number; // 1-4
  summary?: string;
  strengths?: string[];
  criticalGaps?: string[];
  priorityActions?: string[];
  riskAssessment?: string;
}

interface ExecutiveSummaryCardProps {
  data: ExecutiveSummaryData;
  onGenerateAI?: () => void;
  isGenerating?: boolean;
}

const TIER_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Partial', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  2: { label: 'Risk Informed', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  3: { label: 'Repeatable', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  4: { label: 'Adaptive', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
};

export default function ExecutiveSummaryCard({
  data,
  onGenerateAI,
  isGenerating,
}: ExecutiveSummaryCardProps) {
  const hasData =
    data.summary ||
    data.strengths?.length ||
    data.criticalGaps?.length ||
    data.priorityActions?.length ||
    data.riskAssessment;

  if (!hasData) {
    return (
      <div
        style={{
          background: 'var(--card)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-1)',
            alignSelf: 'flex-start',
          }}
        >
          Executive Summary
        </h3>
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--text-3)',
            fontSize: 14,
          }}
        >
          <Brain
            size={40}
            style={{ margin: '0 auto 12px', opacity: 0.5, color: 'var(--text-3)' }}
          />
          <p style={{ marginBottom: 16 }}>
            No executive summary available yet. Generate one using AI analysis.
          </p>
          <button
            onClick={onGenerateAI}
            disabled={isGenerating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: 'var(--navy-900)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              fontSize: 14,
              fontWeight: 600,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.7 : 1,
              fontFamily: 'var(--font-ui)',
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Generating...
              </>
            ) : (
              <>
                <Brain size={16} />
                Generate Executive Summary
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const tier = data.maturityTier ? TIER_CONFIG[data.maturityTier] : null;

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)',
        padding: 24,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--text-1)',
          }}
        >
          Executive Summary
        </h3>
        {tier && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              color: tier.color,
              background: tier.bg,
            }}
          >
            Tier {data.maturityTier}: {tier.label}
          </span>
        )}
      </div>

      {/* Summary text */}
      {data.summary && (
        <p
          style={{
            color: 'var(--text-2)',
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          {data.summary}
        </p>
      )}

      {/* 2x2 section grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}
      >
        {/* Strengths */}
        {data.strengths && data.strengths.length > 0 && (
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--green-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                color: 'var(--green-text)',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              <CheckCircle size={18} />
              Strengths
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {data.strengths.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                    paddingLeft: 16,
                    position: 'relative',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 8,
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--green)',
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Critical Gaps */}
        {data.criticalGaps && data.criticalGaps.length > 0 && (
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--red-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                color: 'var(--red-text)',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              <AlertTriangle size={18} />
              Critical Gaps
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {data.criticalGaps.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                    paddingLeft: 16,
                    position: 'relative',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 8,
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--red)',
                    }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Priority Actions */}
        {data.priorityActions && data.priorityActions.length > 0 && (
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--blue-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                color: 'var(--blue-text)',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              <ListOrdered size={18} />
              Priority Actions
            </div>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, counterReset: 'actions' }}>
              {data.priorityActions.map((item, i) => (
                <li
                  key={i}
                  style={{
                    fontSize: 13,
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                    paddingLeft: 20,
                    position: 'relative',
                    marginBottom: 4,
                    counterIncrement: 'actions',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'var(--blue-text)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {i + 1}.
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Risk Assessment */}
        {data.riskAssessment && (
          <div
            style={{
              padding: 16,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--orange-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
                color: 'var(--orange-text)',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              <ShieldAlert size={18} />
              Risk Assessment
            </div>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-2)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {data.riskAssessment}
            </p>
          </div>
        )}
      </div>

      {/* Regenerate button at bottom */}
      {onGenerateAI && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onGenerateAI}
            disabled={isGenerating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              background: 'transparent',
              color: 'var(--text-3)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                Regenerating...
              </>
            ) : (
              <>
                <Brain size={14} />
                Regenerate
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
