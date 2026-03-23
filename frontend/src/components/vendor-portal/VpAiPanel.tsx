/**
 * VpAiPanel - AI Analysis panel for vendor portal
 * Supports two modes:
 *   - 'item': Per-control AI analysis (suggested status, gaps, recommendations)
 *   - 'review': Full assessment gap analysis + executive summary
 */

import React, { useState } from 'react';
import { Brain, Loader2, ChevronDown, ChevronUp, Sparkles, Target, FileText } from 'lucide-react';
import { T, card } from '../../tokens';
import { vendorInvitationsApi } from '../../api/vendor-invitations';
import type { AIAnalysisResult, AIRecommendation, AIExecutiveSummary, VendorPortalStats } from '../../types';

interface VpAiPanelProps {
  token: string;
  mode: 'item' | 'review';
  // item mode props
  itemId?: string;
  subcategoryCode?: string;
  subcategoryDescription?: string;
  currentStatus?: string;
  notes?: string;
  // review mode props
  stats?: VendorPortalStats;
}

const VpAiPanel: React.FC<VpAiPanelProps> = ({
  token,
  mode,
  itemId,
  subcategoryCode,
  subcategoryDescription,
  currentStatus,
  notes,
  stats,
}) => {
  // Item mode state
  const [itemAnalysis, setItemAnalysis] = useState<AIAnalysisResult | null>(null);
  const [itemLoading, setItemLoading] = useState(false);

  // Review mode state
  const [gapAnalysis, setGapAnalysis] = useState<AIRecommendation[] | null>(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [execSummary, setExecSummary] = useState<AIExecutiveSummary | null>(null);
  const [execLoading, setExecLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<'gap' | 'exec' | null>(null);

  const handleItemAnalyze = async () => {
    if (!subcategoryCode) return;
    setItemLoading(true);
    setError(null);
    try {
      const response = await vendorInvitationsApi.analyzeItem(token, {
        assessment_item_id: itemId,
        subcategory_code: subcategoryCode,
        subcategory_description: subcategoryDescription,
        evidence_notes: notes,
        current_status: currentStatus || 'not_assessed',
      });
      setItemAnalysis(response.result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AI analysis failed. Please try again.';
      setError(message);
    } finally {
      setItemLoading(false);
    }
  };

  const handleGapAnalysis = async () => {
    setGapLoading(true);
    setError(null);
    try {
      const response = await vendorInvitationsApi.requestGapAnalysis(token);
      setGapAnalysis(response.recommendations);
      setExpandedSection('gap');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gap analysis failed. Please try again.';
      setError(message);
    } finally {
      setGapLoading(false);
    }
  };

  const handleExecutiveSummary = async () => {
    if (!stats) {
      setError('Assessment statistics are required for executive summary.');
      return;
    }
    setExecLoading(true);
    setError(null);
    try {
      const response = await vendorInvitationsApi.requestExecutiveSummary(token, {
        overall_score: stats.overall_score,
        function_scores: stats.function_breakdown.map(fb => ({
          code: fb.function_id,
          name: fb.function_name,
          score: fb.score,
          compliant: fb.compliant,
          partial: fb.partial,
          non_compliant: fb.non_compliant,
          total: fb.total,
        })),
        distribution: stats.distribution,
        top_gaps: [],
      });
      setExecSummary(response.summary);
      setExpandedSection('exec');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Executive summary failed. Please try again.';
      setError(message);
    } finally {
      setExecLoading(false);
    }
  };

  const statusColor = (status: string): string => {
    switch (status) {
      case 'compliant': return T.success;
      case 'partial': return T.warning;
      case 'non_compliant': return T.danger;
      default: return T.textMuted;
    }
  };

  const priorityColor = (priority: string): string => {
    switch (priority) {
      case 'quick_win': return T.success;
      case 'medium_term': return T.warning;
      case 'long_term': return T.danger;
      default: return T.textMuted;
    }
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    borderRadius: 8,
    border: `1px solid ${T.accentBorder}`,
    background: T.accentLight,
    color: T.accent,
    fontFamily: T.fontSans,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  const disabledButton: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.6,
    cursor: 'not-allowed',
  };

  const sectionHeader: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: '8px 0',
  };

  // ==================== ITEM MODE ====================
  if (mode === 'item') {
    return (
      <div style={{ ...card, padding: 16, marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: itemAnalysis ? 12 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Brain size={16} style={{ color: T.accent }} />
            <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textPrimary }}>
              AI Analysis
            </span>
          </div>
          <button
            onClick={handleItemAnalyze}
            disabled={itemLoading || !subcategoryCode}
            style={itemLoading || !subcategoryCode ? disabledButton : buttonStyle}
          >
            {itemLoading ? (
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Sparkles size={14} />
            )}
            {itemLoading ? 'Analyzing...' : itemAnalysis ? 'Re-analyze' : 'Analyze with AI'}
          </button>
        </div>

        {error && (
          <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.danger, margin: '8px 0 0 0' }}>
            {error}
          </p>
        )}

        {itemAnalysis && (
          <div style={{ marginTop: 8 }}>
            {/* Suggested status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textSecondary }}>
                Suggested Status:
              </span>
              <span style={{
                fontFamily: T.fontSans,
                fontSize: 11,
                fontWeight: 700,
                color: statusColor(itemAnalysis.suggestedStatus),
                textTransform: 'capitalize',
              }}>
                {itemAnalysis.suggestedStatus.replace('_', ' ')}
              </span>
              <span style={{
                fontFamily: T.fontSans,
                fontSize: 10,
                color: T.textMuted,
                background: T.bg,
                padding: '2px 8px',
                borderRadius: 4,
              }}>
                {Math.round(itemAnalysis.confidenceScore * 100)}% confidence
              </span>
            </div>

            {/* Reasoning */}
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textSecondary, display: 'block', marginBottom: 4 }}>
                Reasoning
              </span>
              <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary, margin: 0, lineHeight: 1.5 }}>
                {itemAnalysis.reasoning}
              </p>
            </div>

            {/* Gaps */}
            {itemAnalysis.gaps.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textSecondary, display: 'block', marginBottom: 4 }}>
                  Identified Gaps
                </span>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {itemAnalysis.gaps.map((gap, i) => (
                    <li key={i} style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary, marginBottom: 2 }}>
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {itemAnalysis.recommendations.length > 0 && (
              <div>
                <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, color: T.textSecondary, display: 'block', marginBottom: 4 }}>
                  Recommendations
                </span>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {itemAnalysis.recommendations.map((rec, i) => (
                    <li key={i} style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary, marginBottom: 2 }}>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ==================== REVIEW MODE ====================
  return (
    <div style={{ ...card, padding: 20 }}>
      <h3 style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.textPrimary, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Brain size={18} style={{ color: T.accent }} />
        AI-Powered Insights
      </h3>
      <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: '0 0 16px 0' }}>
        Get AI-generated analysis of your assessment results.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <button
          onClick={handleGapAnalysis}
          disabled={gapLoading || execLoading}
          style={gapLoading || execLoading ? disabledButton : buttonStyle}
        >
          {gapLoading ? (
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Target size={14} />
          )}
          {gapLoading ? 'Analyzing...' : 'Gap Analysis'}
        </button>

        <button
          onClick={handleExecutiveSummary}
          disabled={execLoading || gapLoading || !stats}
          style={execLoading || gapLoading || !stats ? disabledButton : buttonStyle}
        >
          {execLoading ? (
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <FileText size={14} />
          )}
          {execLoading ? 'Generating...' : 'Executive Summary'}
        </button>
      </div>

      {error && (
        <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.danger, margin: '0 0 12px 0' }}>
          {error}
        </p>
      )}

      {/* Gap Analysis Results */}
      {gapAnalysis && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={sectionHeader}
            onClick={() => setExpandedSection(expandedSection === 'gap' ? null : 'gap')}
          >
            <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.textPrimary }}>
              Gap Analysis ({gapAnalysis.length} recommendations)
            </span>
            {expandedSection === 'gap' ? <ChevronUp size={16} style={{ color: T.textMuted }} /> : <ChevronDown size={16} style={{ color: T.textMuted }} />}
          </div>

          {expandedSection === 'gap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {gapAnalysis.map((rec, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 8, border: `1px solid ${T.borderLight}`, background: T.bg }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontFamily: T.fontSans,
                      fontSize: 10,
                      fontWeight: 700,
                      color: priorityColor(rec.priority),
                      background: T.card,
                      padding: '2px 8px',
                      borderRadius: 4,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      {rec.priority.replace('_', ' ')}
                    </span>
                    <span style={{
                      fontFamily: T.fontSans,
                      fontSize: 10,
                      color: T.textMuted,
                    }}>
                      Effort: {rec.effort} | Impact: {rec.impact}
                    </span>
                  </div>
                  <p style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: '0 0 4px 0' }}>
                    {rec.title}
                  </p>
                  <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.5 }}>
                    {rec.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Executive Summary Results */}
      {execSummary && (
        <div>
          <div
            style={sectionHeader}
            onClick={() => setExpandedSection(expandedSection === 'exec' ? null : 'exec')}
          >
            <span style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.textPrimary }}>
              Executive Summary (Maturity Tier {execSummary.overallMaturityTier})
            </span>
            {expandedSection === 'exec' ? <ChevronUp size={16} style={{ color: T.textMuted }} /> : <ChevronDown size={16} style={{ color: T.textMuted }} />}
          </div>

          {expandedSection === 'exec' && (
            <div style={{ marginTop: 8 }}>
              {/* Summary text */}
              <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary, lineHeight: 1.6, margin: '0 0 16px 0', whiteSpace: 'pre-line' }}>
                {execSummary.summary}
              </p>

              {/* Strengths */}
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, color: T.success, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Top Strengths
                </span>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {execSummary.topStrengths.map((s, i) => (
                    <li key={i} style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary, marginBottom: 3 }}>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Gaps */}
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, color: T.danger, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Critical Gaps
                </span>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {execSummary.topGaps.map((g, i) => (
                    <li key={i} style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary, marginBottom: 3 }}>
                      {g}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Priority Actions */}
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, color: T.accent, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Priority Actions
                </span>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  {execSummary.priorityActions.map((a, i) => (
                    <li key={i} style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary, marginBottom: 3 }}>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Risk Assessment */}
              <div style={{ padding: 12, borderRadius: 8, background: T.warningLight, border: `1px solid ${T.warningBorder}` }}>
                <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 700, color: T.warning, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Risk Assessment
                </span>
                <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary, margin: 0, lineHeight: 1.5 }}>
                  {execSummary.riskAssessment}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VpAiPanel;
