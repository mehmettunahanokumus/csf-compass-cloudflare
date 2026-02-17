import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Circle, AlertCircle, Filter } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type { ComparisonData } from '../types';
import { getErrorMessage, formatDate } from '../api/client';

// ── Design tokens ─────────────────────────────────────────────
const T = {
  card: '#FFFFFF',
  border: '#E2E8F0',
  bg: '#F8FAFC',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  accent: '#4F46E5',
  accentLight: 'rgba(99,102,241,0.08)',
  accentBorder: 'rgba(99,102,241,0.2)',
  success: '#16A34A',
  successLight: 'rgba(22,163,74,0.08)',
  successBorder: 'rgba(22,163,74,0.2)',
  warning: '#D97706',
  warningLight: 'rgba(217,119,6,0.08)',
  warningBorder: 'rgba(217,119,6,0.2)',
  danger: '#DC2626',
  dangerLight: 'rgba(220,38,38,0.08)',
  dangerBorder: 'rgba(220,38,38,0.2)',
  fontSans: 'Manrope, sans-serif',
  fontMono: 'JetBrains Mono, monospace',
  fontDisplay: 'Barlow Condensed, sans-serif',
};

const cardStyle: React.CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

type FilterType = 'all' | 'matches' | 'differences';

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'compliant':    return <CheckCircle size={14} style={{ color: T.success }} />;
    case 'partial':      return <AlertCircle  size={14} style={{ color: T.warning }} />;
    case 'non_compliant':return <XCircle      size={14} style={{ color: T.danger  }} />;
    default:             return <Circle       size={14} style={{ color: T.textMuted }} />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, React.CSSProperties> = {
    compliant:     { background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` },
    partial:       { background: T.warningLight,  color: T.warning, border: `1px solid ${T.warningBorder}` },
    non_compliant: { background: T.dangerLight,   color: T.danger,  border: `1px solid ${T.dangerBorder}`  },
    not_applicable:{ background: '#F1F5F9', color: T.textMuted, border: `1px solid ${T.border}` },
  };
  const labels: Record<string, string> = {
    compliant: 'Compliant', partial: 'Partial', non_compliant: 'Non-Compliant', not_applicable: 'N/A',
  };
  return (
    <span style={{
      fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
      padding: '2px 8px', borderRadius: 20,
      ...(styles[status] || { background: '#F1F5F9', color: T.textMuted, border: `1px solid ${T.border}` }),
    }}>
      {labels[status] || 'Not Assessed'}
    </span>
  );
}

export default function AssessmentComparison() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ComparisonData | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  useEffect(() => { if (id) loadComparison(); }, [id]);

  const loadComparison = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const comparisonData = await vendorInvitationsApi.getComparison(id);
      setData(comparisonData);
      if (comparisonData.comparison_items.length > 0) {
        const firstFunction = comparisonData.comparison_items[0]?.function?.id;
        if (firstFunction) setSelectedFunction(firstFunction);
      }
    } catch (err) { setError(getErrorMessage(err)); } finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ height: 80, background: '#E2E8F0', borderRadius: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 96, background: '#E2E8F0', borderRadius: 12 }} />)}
        </div>
        <div style={{ height: 384, background: '#E2E8F0', borderRadius: 12 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <div style={{ textAlign: 'center' }}>
          <AlertCircle size={32} style={{ color: T.danger, margin: '0 auto 12px' }} />
          <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.organization_assessment) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256 }}>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>Comparison data not available</p>
      </div>
    );
  }

  const functions = Array.from(
    new Map(data.comparison_items.filter((item) => item.function).map((item) => [item.function!.id, item.function!])).values()
  );

  let filteredItems = data.comparison_items;
  if (selectedFunction) filteredItems = filteredItems.filter((item) => item.function?.id === selectedFunction);
  if (filter === 'matches') filteredItems = filteredItems.filter((item) => item.matches && item.vendor_item);
  else if (filter === 'differences') filteredItems = filteredItems.filter((item) => !item.matches || !item.vendor_item);

  const totalItems = data.comparison_items.length;
  const assessedByVendor = data.comparison_items.filter((item) => item.vendor_item).length;
  const matches = data.comparison_items.filter((item) => item.matches && item.vendor_item).length;
  const differences = data.comparison_items.filter((item) => !item.matches && item.vendor_item).length;
  const notAssessed = totalItems - assessedByVendor;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <Link to={`/assessments/${id}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12,
          fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, textDecoration: 'none',
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.textSecondary}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textMuted}
        >
          <ArrowLeft size={14} /> Back to Assessment
        </Link>
        <h1 style={{ fontFamily: T.fontSans, fontSize: 24, fontWeight: 800, color: T.textPrimary, margin: '0 0 4px' }}>
          Assessment Comparison
        </h1>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, margin: 0 }}>
          {data.organization_assessment.name}
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
        {[
          { label: 'Total Items',   value: totalItems,   color: T.accent  },
          { label: 'Matches',       value: matches,      color: T.success },
          { label: 'Differences',   value: differences,  color: T.warning },
          { label: 'Not Assessed',  value: notAssessed,  color: T.textMuted },
        ].map((stat) => (
          <div key={stat.label} style={{ ...cardStyle, padding: 20 }}>
            <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: '0 0 6px' }}>
              {stat.label}
            </p>
            <p style={{ fontFamily: T.fontDisplay, fontSize: 36, fontWeight: 700, color: stat.color, margin: 0, lineHeight: 1 }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Invitation Status */}
      {data.invitation && (
        <div style={{
          ...cardStyle, padding: '14px 20px',
          borderLeft: `4px solid ${T.accent}`,
          background: T.accentLight, borderColor: T.accentBorder, borderLeftWidth: 4,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <div>
            <p style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.textPrimary, margin: '0 0 2px' }}>
              Vendor Self-Assessment Status
            </p>
            <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: 0 }}>
              Invitation sent to {data.invitation.vendor_contact_email} on {formatDate(data.invitation.sent_at)}
            </p>
          </div>
          <span style={{
            fontFamily: T.fontSans, fontSize: 11, fontWeight: 600,
            padding: '4px 12px', borderRadius: 20,
            ...(data.invitation.invitation_status === 'completed'
              ? { background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` }
              : data.invitation.invitation_status === 'accessed'
              ? { background: T.warningLight, color: T.warning, border: `1px solid ${T.warningBorder}` }
              : { background: '#F1F5F9', color: T.textSecondary, border: `1px solid ${T.border}` }),
          }}>
            {data.invitation.invitation_status === 'completed' ? 'Completed'
              : data.invitation.invitation_status === 'accessed' ? 'In Progress'
              : data.invitation.invitation_status}
          </span>
        </div>
      )}

      {/* Comparison Table */}
      <div style={{ ...cardStyle, overflow: 'hidden' }}>
        {/* Filter Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
          borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap', background: T.bg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} style={{ color: T.textMuted }} />
            <span style={{ fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted }}>
              Filter
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { value: 'all' as FilterType, label: `All (${totalItems})` },
              { value: 'matches' as FilterType, label: `Matches (${matches})` },
              { value: 'differences' as FilterType, label: `Differences (${differences + notAssessed})` },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                style={{
                  padding: '5px 12px', borderRadius: 8,
                  background: filter === value ? T.accent : T.card,
                  border: filter === value ? 'none' : `1px solid ${T.border}`,
                  fontFamily: T.fontSans, fontSize: 12, fontWeight: filter === value ? 600 : 500,
                  color: filter === value ? '#FFF' : T.textSecondary,
                  cursor: 'pointer', transition: 'all 0.14s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Function Tabs */}
        <div style={{
          display: 'flex', gap: 0, padding: '0 20px',
          borderBottom: `1px solid ${T.border}`, overflowX: 'auto',
        }}>
          {functions.map((func) => {
            const isActive = selectedFunction === func.id;
            return (
              <button
                key={func.id}
                onClick={() => setSelectedFunction(func.id)}
                style={{
                  padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: T.fontSans, fontSize: 11, fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.accent : T.textMuted,
                  borderBottom: isActive ? `2px solid ${T.accent}` : '2px solid transparent',
                  whiteSpace: 'nowrap', transition: 'all 0.14s',
                }}
              >
                {func.name}
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
                {['Subcategory', 'Your Assessment', 'Vendor Self-Assessment', 'Status'].map((h) => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '10px 16px',
                    fontFamily: T.fontSans, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted,
                    width: '25%',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '48px 16px', textAlign: 'center', fontFamily: T.fontSans, fontSize: 13, color: T.textMuted }}>
                    No items to display
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const hasWarning = item.vendor_item && !item.matches;
                  return (
                    <tr
                      key={item.subcategory_id}
                      style={{
                        borderBottom: `1px solid ${T.border}`,
                        background: hasWarning ? T.warningLight : T.card,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!hasWarning) (e.currentTarget as HTMLElement).style.background = T.bg; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = hasWarning ? T.warningLight : T.card; }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontFamily: T.fontMono, fontSize: 11, fontWeight: 600, color: T.accent, marginBottom: 2 }}>
                          {item.subcategory?.id}
                        </div>
                        <div style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary }}>
                          {item.subcategory?.name}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <StatusIcon status={item.org_item.status} />
                          <StatusBadge status={item.org_item.status} />
                        </div>
                        {item.org_item.notes && (
                          <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, margin: 0 }}>
                            {item.org_item.notes}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {item.vendor_item ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <StatusIcon status={item.vendor_item.status} />
                              <StatusBadge status={item.vendor_item.status} />
                            </div>
                            {item.vendor_item.notes && (
                              <p style={{ fontFamily: T.fontSans, fontSize: 11, color: T.textMuted, margin: 0 }}>
                                {item.vendor_item.notes}
                              </p>
                            )}
                          </>
                        ) : (
                          <span style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textMuted, fontStyle: 'italic' }}>
                            Not assessed
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {!item.vendor_item ? (
                          <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#F1F5F9', color: T.textMuted, border: `1px solid ${T.border}` }}>
                            Not Assessed
                          </span>
                        ) : item.matches ? (
                          <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: T.successLight, color: T.success, border: `1px solid ${T.successBorder}` }}>
                            Match
                          </span>
                        ) : (
                          <span style={{ fontFamily: T.fontSans, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: T.warningLight, color: T.warning, border: `1px solid ${T.warningBorder}` }}>
                            Difference
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
