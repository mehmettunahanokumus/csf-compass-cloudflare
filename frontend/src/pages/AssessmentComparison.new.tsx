/**
 * AssessmentComparison - Rebuilt from scratch
 * Side-by-side comparison of organization assessment vs vendor self-assessment
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Circle, AlertCircle, Filter } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type { ComparisonData } from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import Skeleton from '../components/Skeleton.new';

type FilterType = 'all' | 'matches' | 'differences';

export default function AssessmentComparisonNew() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ComparisonData | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadComparison();
    }
  }, [id]);

  const loadComparison = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const comparisonData = await vendorInvitationsApi.getComparison(id);
      setData(comparisonData);

      // Auto-select first function if available
      if (comparisonData.comparison_items.length > 0) {
        const firstFunction = comparisonData.comparison_items[0]?.function?.id;
        if (firstFunction) {
          setSelectedFunction(firstFunction);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle size={20} style={{ color: 'var(--green)' }} />;
      case 'partial':
        return <AlertCircle size={20} style={{ color: 'var(--orange)' }} />;
      case 'non_compliant':
        return <XCircle size={20} style={{ color: 'var(--red)' }} />;
      default:
        return <Circle size={20} style={{ color: 'var(--text-4)' }} />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'compliant':
        return { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: 'Compliant' };
      case 'partial':
        return { bg: 'var(--orange-subtle)', color: 'var(--orange-text)', label: 'Partial' };
      case 'non_compliant':
        return { bg: 'var(--red-subtle)', color: 'var(--red-text)', label: 'Non-Compliant' };
      case 'not_applicable':
        return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'N/A' };
      default:
        return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'Not Assessed' };
    }
  };

  const getMatchBadge = (matches: boolean, vendorItem: any) => {
    if (!vendorItem) {
      return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'Not Assessed' };
    }
    if (matches) {
      return { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: '✓ Match' };
    }
    return { bg: 'var(--orange-subtle)', color: 'var(--orange-text)', label: '⚠ Difference' };
  };

  if (loading) {
    return (
      <div>
        <Skeleton w="100%" h="200px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', margin: '24px 0' }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} w="100%" h="100px" />
          ))}
        </div>
        <Skeleton w="100%" h="500px" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: 'var(--red-subtle)',
          border: '1px solid var(--red)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          color: 'var(--red-text)',
        }}
      >
        {error}
      </div>
    );
  }

  if (!data || !data.organization_assessment) {
    return (
      <div
        style={{
          background: 'var(--orange-subtle)',
          border: '1px solid var(--orange)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          color: 'var(--orange-text)',
        }}
      >
        Comparison data not available
      </div>
    );
  }

  // Get unique functions
  const functions = Array.from(
    new Map(
      data.comparison_items
        .filter((item) => item.function)
        .map((item) => [item.function!.id, item.function!])
    ).values()
  );

  // Filter items
  let filteredItems = data.comparison_items;

  // Filter by function
  if (selectedFunction) {
    filteredItems = filteredItems.filter((item) => item.function?.id === selectedFunction);
  }

  // Filter by match/difference
  if (filter === 'matches') {
    filteredItems = filteredItems.filter((item) => item.matches && item.vendor_item);
  } else if (filter === 'differences') {
    filteredItems = filteredItems.filter((item) => !item.matches || !item.vendor_item);
  }

  // Calculate statistics
  const totalItems = data.comparison_items.length;
  const assessedByVendor = data.comparison_items.filter((item) => item.vendor_item).length;
  const matches = data.comparison_items.filter((item) => item.matches && item.vendor_item).length;
  const differences = data.comparison_items.filter(
    (item) => !item.matches && item.vendor_item
  ).length;
  const notAssessed = totalItems - assessedByVendor;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <Link
          to={`/assessments/${id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: 'var(--text-3)',
            textDecoration: 'none',
            marginBottom: '12px',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-1)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <ArrowLeft size={16} />
          Back to Assessment
        </Link>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>
          Assessment Comparison
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>{data.organization_assessment.name}</p>
      </div>

      {/* Status Summary */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            window.innerWidth < 640
              ? '1fr'
              : window.innerWidth < 1024
              ? 'repeat(2, 1fr)'
              : 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Total Items</div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-1)', marginTop: '4px' }}>
            {totalItems}
          </div>
        </div>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Matches</div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--green)', marginTop: '4px' }}>
            {matches}
          </div>
        </div>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Differences</div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--orange)', marginTop: '4px' }}>
            {differences}
          </div>
        </div>
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Not Assessed</div>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-4)', marginTop: '4px' }}>
            {notAssessed}
          </div>
        </div>
      </div>

      {/* Invitation Status */}
      {data.invitation && (
        <div
          style={{
            background: 'var(--blue-subtle)',
            border: '1px solid var(--blue)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--blue-text)', marginBottom: '4px' }}>
                Vendor Self-Assessment Status
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--blue-text)' }}>
                Invitation sent to {data.invitation.vendor_contact_email} on{' '}
                {formatDate(data.invitation.sent_at)}
              </p>
            </div>
            <div>
              {(() => {
                let badge;
                if (data.invitation.invitation_status === 'completed') {
                  badge = { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: 'Completed' };
                } else if (data.invitation.invitation_status === 'accessed') {
                  badge = { bg: 'var(--orange-subtle)', color: 'var(--orange-text)', label: 'In Progress' };
                } else {
                  badge = { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: data.invitation.invitation_status };
                }
                return (
                  <div
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 500,
                      background: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.label}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        {/* Filters */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} style={{ color: 'var(--text-4)' }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2)' }}>Filter:</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { value: 'all' as FilterType, label: `All Items (${totalItems})`, color: 'var(--accent)' },
                { value: 'matches' as FilterType, label: `Matches (${matches})`, color: 'var(--green)' },
                { value: 'differences' as FilterType, label: `Differences (${differences + notAssessed})`, color: 'var(--orange)' },
              ].map(({ value, label, color }) => {
                const isSelected = filter === value;
                return (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    style={{
                      background: isSelected ? color : 'var(--ground)',
                      color: isSelected ? 'white' : 'var(--text-2)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 14px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--raised)';
                        e.currentTarget.style.color = 'var(--text-1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'var(--ground)';
                        e.currentTarget.style.color = 'var(--text-2)';
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Function Tabs */}
        <div style={{ borderBottom: '2px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: '24px', padding: '0 20px', overflowX: 'auto' }}>
            {functions.map((func) => {
              const isSelected = selectedFunction === func.id;
              return (
                <button
                  key={func.id}
                  onClick={() => setSelectedFunction(func.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                    padding: '12px 4px',
                    fontSize: '14px',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? 'var(--accent)' : 'var(--text-3)',
                    cursor: 'pointer',
                    marginBottom: '-2px',
                    transition: 'all 150ms ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = 'var(--text-1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = 'var(--text-3)';
                    }
                  }}
                >
                  {func.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--ground)' }}>
              <tr>
                <th
                  style={{
                    padding: '12px 20px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-4)',
                    width: '25%',
                  }}
                >
                  Subcategory
                </th>
                <th
                  style={{
                    padding: '12px 20px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-4)',
                    width: '25%',
                  }}
                >
                  Your Assessment
                </th>
                <th
                  style={{
                    padding: '12px 20px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-4)',
                    width: '25%',
                  }}
                >
                  Vendor Self-Assessment
                </th>
                <th
                  style={{
                    padding: '12px 20px',
                    textAlign: 'left',
                    fontSize: '11px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-4)',
                    width: '25%',
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '48px 20px',
                      textAlign: 'center',
                      fontSize: '14px',
                      color: 'var(--text-3)',
                    }}
                  >
                    No items to display
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const orgBadge = getStatusBadge(item.org_item.status);
                  const vendorBadge = item.vendor_item ? getStatusBadge(item.vendor_item.status) : null;
                  const matchBadge = getMatchBadge(item.matches, item.vendor_item);
                  const hasWarning = item.vendor_item && !item.matches;

                  return (
                    <tr
                      key={item.subcategory_id}
                      style={{
                        background: hasWarning ? 'var(--orange-subtle)' : 'transparent',
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
                          {item.subcategory?.id}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '2px' }}>
                          {item.subcategory?.name}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          {getStatusIcon(item.org_item.status)}
                          <div
                            style={{
                              padding: '3px 8px',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '11px',
                              fontWeight: 500,
                              background: orgBadge.bg,
                              color: orgBadge.color,
                            }}
                          >
                            {orgBadge.label}
                          </div>
                        </div>
                        {item.org_item.notes && (
                          <div style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '4px' }}>
                            {item.org_item.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {item.vendor_item && vendorBadge ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              {getStatusIcon(item.vendor_item.status)}
                              <div
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: 'var(--radius-sm)',
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  background: vendorBadge.bg,
                                  color: vendorBadge.color,
                                }}
                              >
                                {vendorBadge.label}
                              </div>
                            </div>
                            {item.vendor_item.notes && (
                              <div style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '4px' }}>
                                {item.vendor_item.notes}
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--text-4)', fontStyle: 'italic' }}>
                            Not assessed
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '11px',
                            fontWeight: 500,
                            background: matchBadge.bg,
                            color: matchBadge.color,
                            display: 'inline-block',
                          }}
                        >
                          {matchBadge.label}
                        </div>
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
