/**
 * VendorRanking - Sortable ranking table with filters and CSV export
 */

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
} from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import type { Vendor } from '../types';
import { getErrorMessage } from '../api/client';
import Skeleton from '../components/Skeleton.new';

type SortField = 'name' | 'industry' | 'score' | 'criticality' | 'status';
type SortDirection = 'asc' | 'desc';
type CriticalityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

const criticalityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const statusOrder: Record<string, number> = {
  active: 0,
  under_review: 1,
  inactive: 2,
  terminated: 3,
};

function getCriticalityBadge(level: string | undefined) {
  switch (level) {
    case 'critical':
      return { bg: 'var(--red-subtle)', color: 'var(--red-text)', label: 'Critical' };
    case 'high':
      return { bg: 'var(--orange-subtle)', color: 'var(--orange-text)', label: 'High' };
    case 'medium':
      return { bg: 'var(--orange-subtle)', color: 'var(--orange-text)', label: 'Medium' };
    case 'low':
      return { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: 'Low' };
    default:
      return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'N/A' };
  }
}

function getStatusBadge(status: string | undefined) {
  switch (status) {
    case 'active':
      return { bg: 'var(--green-subtle)', color: 'var(--green-text)', label: 'Active' };
    case 'inactive':
      return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'Inactive' };
    case 'under_review':
      return { bg: 'var(--orange-subtle)', color: 'var(--orange-text)', label: 'Under Review' };
    case 'terminated':
      return { bg: 'var(--red-subtle)', color: 'var(--red-text)', label: 'Terminated' };
    default:
      return { bg: 'var(--gray-subtle)', color: 'var(--gray-text)', label: 'Unknown' };
  }
}

function getScoreColor(score: number | undefined): string {
  if (score === undefined || score === null) return 'var(--text-4)';
  if (score >= 75) return 'var(--green)';
  if (score >= 50) return 'var(--orange)';
  return 'var(--red)';
}

export default function VendorRanking() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeFilter, setActiveFilter] = useState<CriticalityFilter>('all');

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorsApi.list();
      setVendors(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = useMemo(() => {
    let result = [...vendors];

    if (activeFilter !== 'all') {
      result = result.filter(
        (v) => (v.criticality_level || v.risk_tier || 'medium') === activeFilter
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'industry':
          cmp = (a.industry || '').localeCompare(b.industry || '');
          break;
        case 'score':
          cmp = (a.latest_assessment_score ?? -1) - (b.latest_assessment_score ?? -1);
          break;
        case 'criticality': {
          const aLevel = a.criticality_level || a.risk_tier || 'medium';
          const bLevel = b.criticality_level || b.risk_tier || 'medium';
          cmp = (criticalityOrder[aLevel] ?? 99) - (criticalityOrder[bLevel] ?? 99);
          break;
        }
        case 'status': {
          const aStatus = a.vendor_status || 'active';
          const bStatus = b.vendor_status || 'active';
          cmp = (statusOrder[aStatus] ?? 99) - (statusOrder[bStatus] ?? 99);
          break;
        }
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [vendors, activeFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'score' ? 'desc' : 'asc');
    }
  };

  const exportCsv = () => {
    const header = 'Rank,Name,Industry,Score,Criticality,Status';
    const rows = filteredVendors.map((v, i) => {
      const score = v.latest_assessment_score != null ? v.latest_assessment_score.toFixed(1) : 'N/A';
      const criticality = getCriticalityBadge(v.criticality_level || v.risk_tier).label;
      const status = getStatusBadge(v.vendor_status).label;
      const name = v.name.includes(',') ? `"${v.name}"` : v.name;
      const industry = (v.industry || 'N/A').includes(',')
        ? `"${v.industry}"`
        : v.industry || 'N/A';
      return `${i + 1},${name},${industry},${score},${criticality},${status}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor-rankings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={14} />;
    return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
  };

  const filterOptions: { value: CriticalityFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    color: 'var(--text-3)',
    textAlign: 'left',
    cursor: 'pointer',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid var(--border)',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: '14px',
    color: 'var(--text-1)',
    borderBottom: '1px solid var(--border)',
  };

  if (loading) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <Skeleton w="40px" h="40px" />
            <Skeleton w="200px" h="28px" />
          </div>
          <Skeleton w="140px" h="40px" />
        </div>
        <Skeleton w="100%" h="48px" />
        <div style={{ marginTop: '16px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} w="100%" h="52px" />
          ))}
        </div>
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

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link
            to="/vendors"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-3)',
              textDecoration: 'none',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--raised)';
              e.currentTarget.style.color = 'var(--text-1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card)';
              e.currentTarget.style.color = 'var(--text-3)';
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)' }}>
            Vendor Rankings
          </h1>
        </div>
        <button
          onClick={exportCsv}
          style={{
            background: 'var(--accent)',
            color: 'var(--text-on-accent)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
        >
          <FileDown size={18} />
          Export to CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setActiveFilter(opt.value)}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                background: activeFilter === opt.value ? '#102a43' : 'var(--ground)',
                color: activeFilter === opt.value ? '#fff' : 'var(--text-2)',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
          Showing{' '}
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-1)' }}>
            {filteredVendors.length}
          </span>{' '}
          vendor{filteredVendors.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Ranking Table */}
      {filteredVendors.length === 0 ? (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '64px 20px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <Building2 size={48} style={{ color: 'var(--text-4)', margin: '0 auto 20px' }} />
          <p style={{ fontSize: '14px', color: 'var(--text-3)' }}>
            {activeFilter !== 'all'
              ? 'No vendors match the selected filter'
              : 'No vendors found'}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xs)',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '50px' }}>#</th>
                <th style={thStyle} onClick={() => handleSort('name')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Vendor Name <SortIcon field="name" />
                  </span>
                </th>
                <th style={thStyle} onClick={() => handleSort('industry')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Industry <SortIcon field="industry" />
                  </span>
                </th>
                <th style={thStyle} onClick={() => handleSort('score')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Score <SortIcon field="score" />
                  </span>
                </th>
                <th style={thStyle} onClick={() => handleSort('criticality')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Criticality <SortIcon field="criticality" />
                  </span>
                </th>
                <th style={thStyle} onClick={() => handleSort('status')}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    Status <SortIcon field="status" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor, index) => {
                const criticality = getCriticalityBadge(
                  vendor.criticality_level || vendor.risk_tier
                );
                const status = getStatusBadge(vendor.vendor_status);
                const score = vendor.latest_assessment_score;
                const scoreColor = getScoreColor(score);

                return (
                  <tr
                    key={vendor.id}
                    style={{
                      background: index % 2 === 1 ? 'var(--raised)' : 'transparent',
                      transition: 'background 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--ground)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        index % 2 === 1 ? 'var(--raised)' : 'transparent';
                    }}
                  >
                    <td
                      style={{
                        ...tdStyle,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        color: 'var(--text-3)',
                      }}
                    >
                      {index + 1}
                    </td>
                    <td style={tdStyle}>
                      <Link
                        to={`/vendors/${vendor.id}`}
                        style={{
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          fontWeight: 600,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none';
                        }}
                      >
                        {vendor.name}
                      </Link>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-2)' }}>
                      {vendor.industry || 'N/A'}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          color: scoreColor,
                        }}
                      >
                        {score != null ? score.toFixed(1) : 'N/A'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: criticality.bg,
                          color: criticality.color,
                        }}
                      >
                        {criticality.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: status.bg,
                          color: status.color,
                        }}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
