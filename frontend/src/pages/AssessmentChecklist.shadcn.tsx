import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { getErrorMessage } from '../api/client';
import type { Assessment, AssessmentItem, CsfFunction } from '../types';
import { T, card } from '../tokens';
const cardStyle = card;

const FUNCTION_TABS = ['All', 'GV', 'ID', 'PR', 'DE', 'RS', 'RC'];

function statusBadgeStyle(status: string): React.CSSProperties {
  const base: React.CSSProperties = { fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20 };
  const map: Record<string, React.CSSProperties> = {
    compliant:     { ...base, background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` },
    partial:       { ...base, background: T.warningLight, color: T.warning, border: `1px solid ${T.warningBorder}` },
    non_compliant: { ...base, background: T.dangerLight, color: T.danger, border: `1px solid ${T.dangerBorder}` },
    not_assessed:  { ...base, background: '#F1F5F9', color: T.textMuted, border: `1px solid ${T.border}` },
    not_applicable:{ ...base, background: '#F1F5F9', color: T.textMuted, border: `1px solid ${T.border}` },
  };
  return map[status] || { ...base, background: '#F1F5F9', color: T.textMuted, border: `1px solid ${T.border}` };
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    compliant: 'Compliant', partial: 'Partial', non_compliant: 'Non-Compliant',
    not_assessed: 'Not Assessed', not_applicable: 'N/A',
  };
  return map[status] || status.replace('_', ' ');
}

function getTipForItem(subcategoryId: string | undefined): string {
  const prefix = subcategoryId?.split('.')[0] || '';
  const tips: Record<string, string> = {
    GV: 'Tip: Policy documents, board approvals, risk register exports, and compliance framework mappings are strong evidence for Govern controls.',
    ID: 'Tip: Asset inventory exports, vulnerability scan results, and data flow diagrams are commonly accepted for Identify controls.',
    PR: 'Tip: Configuration baselines, access control reports, encryption settings, and training completion records support Protect controls.',
    DE: 'Tip: SIEM alert rules, anomaly detection configs, log retention policies, and monitoring dashboards cover Detect controls.',
    RS: 'Tip: Incident response plan, playbooks, MTTR metrics, and post-incident reviews are required for Respond controls.',
    RC: 'Tip: Business continuity plans, DR test results, RTO/RPO documentation, and backup job reports support Recover controls.',
  };
  return tips[prefix] || 'Tip: Policies, configuration exports, audit logs, and third-party certifications are common evidence types for this control.';
}

export default function AssessmentChecklist() {
  const { id } = useParams<{ id: string }>();

  const [_assessment, setAssessment] = useState<Assessment | null>(null);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true); setError(null);
      const [assessmentData, functionsData, itemsData] = await Promise.all([
        assessmentsApi.get(id),
        csfApi.getFunctions(),
        assessmentsApi.getItems(id),
      ]);
      setAssessment(assessmentData);
      setFunctions(functionsData);
      setItems(itemsData);
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  };

  const distribution = useMemo(() => {
    const d = { compliant: 0, partial: 0, non_compliant: 0, not_assessed: 0, not_applicable: 0 };
    items.forEach((item) => { if (item.status in d) d[item.status as keyof typeof d]++; });
    return d;
  }, [items]);

  const complianceScore = useMemo(() => {
    const assessed = items.filter((i) => i.status !== 'not_assessed' && i.status !== 'not_applicable').length;
    return assessed === 0 ? 0 : (distribution.compliant / assessed) * 100;
  }, [items, distribution]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (activeTab !== 'All') {
      filtered = filtered.filter((item) => {
        const funcName = item.function?.name || '';
        const catName = item.category?.name || '';
        return funcName.startsWith(activeTab) || catName.startsWith(activeTab) || item.subcategory?.name?.startsWith(activeTab);
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        (item.subcategory?.name || '').toLowerCase().includes(q) ||
        (item.subcategory?.description || '').toLowerCase().includes(q) ||
        (item.category?.name || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [items, activeTab, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, { categoryId: string; categoryName: string; functionName: string; items: AssessmentItem[] }> = {};
    filteredItems.forEach((item) => {
      const catId = item.category?.id || 'unknown';
      if (!groups[catId]) {
        groups[catId] = { categoryId: catId, categoryName: item.category?.name || 'Unknown Category', functionName: item.function?.name || '', items: [] };
      }
      groups[catId].items.push(item);
    });
    return Object.values(groups).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [filteredItems]);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
      return next;
    });
  }, []);

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    if (!id) return;
    try {
      const updated = await assessmentsApi.updateItem(id, itemId, { status: newStatus as AssessmentItem['status'] });
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updated } : item)));
    } catch (err) { console.error('Failed to update status:', getErrorMessage(err)); }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[1,2,3,4].map(i => <div key={i} style={{ height: i === 1 ? 40 : i === 2 ? 160 : 40, background: '#E2E8F0', borderRadius: 12 }} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', padding: '40px 0' }}>
        <div style={{ ...cardStyle, padding: 16, background: T.dangerLight, borderColor: T.dangerBorder, marginBottom: 16 }}>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.danger, margin: 0 }}>{error}</p>
        </div>
        <button onClick={loadData} style={{
          padding: '9px 20px', borderRadius: 8, background: T.accent, border: 'none',
          fontFamily: T.fontSans, fontSize: 13, fontWeight: 600, color: '#FFF', cursor: 'pointer',
        }}>
          Retry
        </button>
      </div>
    );
  }

  const scoreColor = complianceScore >= 80 ? T.success : complianceScore >= 50 ? T.warning : T.danger;
  const circumference = 2 * Math.PI * 50;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <Link to={`/assessments/${id}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
          fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, textDecoration: 'none',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textSecondary}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textMuted}
        >
          <ChevronLeft size={14} /> Back to Assessment
        </Link>
        <h1 style={{ fontFamily: T.fontSans, fontSize: 24, fontWeight: 800, color: T.textPrimary, margin: '0 0 4px' }}>
          Assessment Checklist
        </h1>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0 }}>
          <span style={{ fontFamily: T.fontMono, color: T.accent }}>{items.length}</span> subcategories across{' '}
          <span style={{ fontFamily: T.fontMono, color: T.accent }}>{functions.length}</span> functions
        </p>
      </div>

      {/* Score Overview */}
      <div style={{ ...cardStyle, padding: 24 }}>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Circle */}
          <div style={{ position: 'relative', width: 128, height: 128, flexShrink: 0 }}>
            <svg viewBox="0 0 120 120" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
              <circle cx="60" cy="60" r="50" fill="none" stroke={T.border} strokeWidth="14" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={scoreColor}
                strokeWidth="14"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={`${circumference * (1 - complianceScore / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: T.fontDisplay, fontSize: 28, fontWeight: 700, color: T.textPrimary }}>
                {Math.round(complianceScore)}
              </span>
              <span style={{ fontFamily: T.fontSans, fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Score
              </span>
            </div>
          </div>

          {/* Distribution bars */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Compliant',    count: distribution.compliant,     color: T.success },
              { label: 'Partial',      count: distribution.partial,       color: T.warning },
              { label: 'Non-Compliant',count: distribution.non_compliant, color: T.danger  },
              { label: 'Not Assessed', count: distribution.not_assessed,  color: T.textMuted },
              { label: 'N/A',          count: distribution.not_applicable,color: T.border  },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: item.color }} />
                <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, width: 110 }}>
                  {item.label}
                </span>
                <div style={{ flex: 1, height: 6, background: T.bg, borderRadius: 3, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  <div style={{
                    height: '100%', borderRadius: 3, background: item.color,
                    width: items.length > 0 ? `${(item.count / items.length) * 100}%` : '0%',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
                <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.textPrimary, width: 28, textAlign: 'right' }}>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Function Tabs + Search */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
          {FUNCTION_TABS.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 14px', borderRadius: 8, whiteSpace: 'nowrap',
                  background: isActive ? T.accent : T.card,
                  border: isActive ? 'none' : `1px solid ${T.border}`,
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFF' : T.textSecondary,
                  cursor: 'pointer', transition: 'all 0.14s',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280, marginLeft: 'auto' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textMuted }} />
          <input
            type="text"
            placeholder="Search subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 8, paddingBottom: 8,
              boxSizing: 'border-box', borderRadius: 8,
              background: T.card, border: `1px solid ${T.border}`,
              fontFamily: T.fontSans, fontSize: 13, color: T.textPrimary, outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0 }}>
          Showing <span style={{ fontFamily: T.fontMono, color: T.accent }}>{filteredItems.length}</span> of {items.length} subcategories
        </p>
      )}

      {/* Grouped Items */}
      {groupedItems.length === 0 ? (
        <div style={{ ...cardStyle, padding: '48px 20px', textAlign: 'center' }}>
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted, margin: 0 }}>
            No items found matching your filters.
          </p>
        </div>
      ) : (
        groupedItems.map((group) => (
          <div key={group.categoryId} style={{ ...cardStyle, overflow: 'hidden' }}>
            {/* Category header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px', borderBottom: `1px solid ${T.border}`,
              background: T.bg,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 3, height: 14, background: T.accent, borderRadius: 2, flexShrink: 0 }} />
                <h3 style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.textPrimary, margin: 0 }}>
                  {group.categoryName}
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: T.fontMono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em',
                  padding: '2px 8px', borderRadius: 6, background: T.accentLight, color: T.accent,
                  border: `1px solid ${T.accentBorder}`,
                }}>
                  {group.functionName}
                </span>
                <span style={{ fontFamily: T.fontMono, fontSize: 10, color: T.textMuted }}>
                  {group.items.length} items
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              {group.items.map((item, idx) => {
                const isExpanded = expandedItems.has(item.id);
                const detailText = item.subcategory?.description
                  ? item.subcategory.description
                  : `This subcategory covers ${item.subcategory?.id || 'this area'} implementation. Gather relevant documentation, screenshots, or audit logs as evidence.`;
                return (
                  <div key={item.id} style={{
                    borderBottom: idx < group.items.length - 1 ? `1px solid ${T.border}` : 'none',
                  }}>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 20px',
                      transition: 'background 0.1s',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.bg}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.card}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontFamily: T.fontMono, fontSize: 12, fontWeight: 600, color: T.accent }}>
                            {item.subcategory?.id}
                          </span>
                          <span style={statusBadgeStyle(item.status || 'not_assessed')}>
                            {statusLabel(item.status || 'not_assessed')}
                          </span>
                        </div>
                        <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.6 }}>
                          {item.subcategory?.description}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => toggleExpand(item.id)}
                          title={isExpanded ? 'Hide details' : 'Show details'}
                          style={{
                            padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap',
                            background: isExpanded ? T.accentLight : 'transparent',
                            border: `1px solid ${isExpanded ? T.accentBorder : T.border}`,
                            fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
                            color: isExpanded ? T.accent : T.textMuted,
                            cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                          }}
                        >
                          ℹ️ Details
                        </button>
                        <div style={{ width: 180 }}>
                          <select
                            value={item.status || 'not_assessed'}
                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                            style={{
                              width: '100%', padding: '6px 10px', borderRadius: 8,
                              background: T.bg, border: `1px solid ${T.border}`,
                              fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary,
                              outline: 'none', cursor: 'pointer',
                            }}
                          >
                            <option value="not_assessed">Not Assessed</option>
                            <option value="compliant">Compliant</option>
                            <option value="partial">Partial</option>
                            <option value="non_compliant">Non-Compliant</option>
                            <option value="not_applicable">N/A</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{
                        padding: '12px 20px 16px 20px',
                        background: T.bg,
                        borderTop: `1px solid ${T.borderLight || T.border}`,
                      }}>
                        <div style={{
                          padding: '14px 16px', borderRadius: 8,
                          background: T.card, border: `1px solid ${T.border}`,
                          display: 'flex', flexDirection: 'column', gap: 10,
                        }}>
                          {/* ID + name header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{
                              fontFamily: T.fontMono, fontSize: 11, fontWeight: 700, color: T.accent,
                              background: T.accentLight, border: `1px solid ${T.accentBorder}`,
                              padding: '2px 6px', borderRadius: 4,
                            }}>
                              {item.subcategory?.id}
                            </span>
                            <span style={{ fontFamily: T.fontSans, fontSize: 12, fontWeight: 600, color: T.textPrimary }}>
                              {item.subcategory?.name || item.subcategory?.id}
                            </span>
                          </div>
                          {/* Description */}
                          <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.65 }}>
                            {detailText}
                          </p>
                          {/* Evidence examples */}
                          <div style={{
                            fontFamily: T.fontSans, fontSize: 11, color: T.textSecondary,
                            lineHeight: 1.5, padding: '8px 12px', borderRadius: 6,
                            background: T.bg, border: `1px solid ${T.borderLight || T.border}`,
                          }}>
                            <span style={{ fontWeight: 600, color: T.textPrimary }}>Example evidence: </span>
                            policies, screenshots, audit logs, configuration exports, compliance reports, or third-party certifications (SOC 2, ISO 27001).
                          </div>
                          {/* Function-specific tip */}
                          <div style={{
                            fontFamily: T.fontSans, fontSize: 11, color: T.warning,
                            lineHeight: 1.5, padding: '8px 12px', borderRadius: 6,
                            background: T.warningLight, border: `1px solid ${T.warningBorder}`,
                          }}>
                            {getTipForItem(item.subcategory?.id)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
