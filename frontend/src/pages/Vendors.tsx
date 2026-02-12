/**
 * Vendors List Page
 * Datadog-style: Grid of vendor cards with risk tiers and compliance scores
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Building2,
  Eye,
  ClipboardList,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import type { Vendor } from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import NewVendorModal from '../components/NewVendorModal';

// Helper: Get risk tier badge styling
function getRiskTierStyle(tier: string | undefined): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (tier) {
    case 'critical':
      return {
        bg: 'var(--status-danger-muted)',
        text: 'var(--status-danger-text)',
        border: 'var(--status-danger-border)',
        label: 'Critical',
      };
    case 'high':
      return {
        bg: 'var(--status-danger-muted)',
        text: 'var(--status-danger-text)',
        border: 'var(--status-danger-border)',
        label: 'High',
      };
    case 'medium':
      return {
        bg: 'var(--status-warning-muted)',
        text: 'var(--status-warning-text)',
        border: 'var(--status-warning-border)',
        label: 'Medium',
      };
    case 'low':
      return {
        bg: 'var(--status-success-muted)',
        text: 'var(--status-success-text)',
        border: 'var(--status-success-border)',
        label: 'Low',
      };
    default:
      return {
        bg: 'var(--status-neutral-muted)',
        text: 'var(--status-neutral-text)',
        border: 'var(--status-neutral-border)',
        label: 'Unrated',
      };
  }
}

// Helper: Get score color
function getScoreColor(score: number | undefined): string {
  if (!score || score === 0) return 'var(--status-neutral)';
  if (score >= 71) return 'var(--status-success)';
  if (score >= 41) return 'var(--status-warning)';
  return 'var(--status-danger)';
}

export default function Vendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterRiskTier, setFilterRiskTier] = useState<string>('all');

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

  const handleVendorCreated = (newVendor: Vendor) => {
    setVendors([...vendors, newVendor]);
  };

  const filteredVendors = vendors
    .filter(
      (vendor) =>
        (vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.industry?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterRiskTier === 'all' || vendor.risk_tier === filterRiskTier)
    )
    .sort((a, b) => {
      // Sort by risk tier (critical > high > medium > low)
      const tierOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aTier = tierOrder[a.risk_tier as keyof typeof tierOrder] ?? 999;
      const bTier = tierOrder[b.risk_tier as keyof typeof tierOrder] ?? 999;
      return aTier - bTier;
    });

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-32 mb-2" />
            <div className="skeleton h-4 w-56" />
          </div>
          <div className="skeleton h-10 w-36 rounded-md" />
        </div>

        {/* Search and Filters Skeleton */}
        <div
          className="rounded-xl p-4 border"
          style={{
            backgroundColor: 'var(--surface-base)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 skeleton h-10 rounded-[10px]" />
            <div className="md:col-span-2 skeleton h-10 rounded-[10px]" />
          </div>
        </div>

        {/* Vendor Cards Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5 border"
              style={{
                backgroundColor: 'var(--surface-base)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="skeleton h-5 w-32 mb-1" />
                  <div className="skeleton h-3 w-24" />
                </div>
                <div className="skeleton h-5 w-16 rounded-md ml-3" />
              </div>
              <div className="skeleton h-3 w-40 mb-4" />
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="skeleton h-2 w-32" />
                  <div className="skeleton h-4 w-16" />
                </div>
                <div className="skeleton h-1 w-full rounded-full" />
              </div>
              <div className="pt-4 border-t flex items-center gap-2" style={{ borderTopColor: 'var(--border-subtle)' }}>
                <div className="flex-1 skeleton h-8 rounded-[10px]" />
                <div className="flex-1 skeleton h-8 rounded-[10px]" />
                <div className="skeleton h-8 w-10 rounded-[10px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg p-4 border"
        style={{
          backgroundColor: 'var(--status-danger-muted)',
          borderColor: 'var(--status-danger-border)',
        }}
      >
        <p style={{ color: 'var(--status-danger-text)' }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Vendors
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage your third-party vendors (
            <span className="font-mono">{vendors.length}</span> total)
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors sm:w-auto w-full"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--text-inverse)',
            transitionDuration: 'var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Vendor
        </button>
      </div>

      {/* Search and Filters */}
      <div
        className="rounded-xl p-4 border"
        style={{
          backgroundColor: 'var(--surface-base)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--input-placeholder)' }}
            />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-[10px] border transition-all"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--input-text)',
                borderColor: 'var(--input-border)',
                transitionDuration: 'var(--transition-base)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--input-focus-border)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--input-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Risk Tier Filter */}
          <div className="md:col-span-2">
            <select
              value={filterRiskTier}
              onChange={(e) => setFilterRiskTier(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-[10px] border transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--input-text)',
                borderColor: 'var(--input-border)',
                transitionDuration: 'var(--transition-base)',
              }}
            >
              <option value="all">All Risk Tiers</option>
              <option value="critical">Critical Risk</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      {filteredVendors.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center border"
          style={{
            backgroundColor: 'var(--surface-base)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Building2
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--text-muted)' }}
          />
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            {searchTerm || filterRiskTier !== 'all'
              ? 'No vendors match your filters'
              : 'No vendors found'}
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-inverse)',
              transitionDuration: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
            }}
          >
            Add Your First Vendor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVendors.map((vendor, index) => {
            const riskStyle = getRiskTierStyle(vendor.risk_tier);
            const complianceScore = vendor.latest_assessment_score || 0;

            return (
              <div
                key={vendor.id}
                className={`rounded-xl p-5 border transition-all cursor-pointer ${index < 6 ? 'fade-in-stagger' : 'fade-in'}`}
                style={{
                  backgroundColor: 'var(--surface-base)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  transitionDuration: 'var(--transition-base)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--accent-border-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                {/* Header: Name + Risk Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-base truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {vendor.name}
                    </h3>
                    {vendor.industry && (
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {vendor.industry}
                      </p>
                    )}
                  </div>
                  <span
                    className="text-xs font-semibold uppercase px-2 py-0.5 rounded border ml-3 flex-shrink-0"
                    style={{
                      backgroundColor: riskStyle.bg,
                      color: riskStyle.text,
                      borderColor: riskStyle.border,
                    }}
                  >
                    {riskStyle.label}
                  </span>
                </div>

                {/* Last Assessment Date */}
                <div className="mb-4 text-sm">
                  {vendor.last_assessment_date ? (
                    <div style={{ color: 'var(--text-secondary)' }}>
                      Last assessed:{' '}
                      <span className="font-mono" style={{ color: 'var(--text-primary)' }}>
                        {formatDate(vendor.last_assessment_date)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>No assessments yet</div>
                  )}
                </div>

                {/* Compliance Score */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-medium uppercase tracking-wide"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Compliance Score
                    </span>
                    <span
                      className="text-sm font-bold font-mono"
                      style={{ color: getScoreColor(complianceScore) }}
                    >
                      {complianceScore > 0 ? `${complianceScore.toFixed(1)}%` : 'N/A'}
                    </span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--border-subtle)' }}
                  >
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${complianceScore}%`,
                        backgroundColor: getScoreColor(complianceScore),
                        transitionDuration: 'var(--transition-base)',
                      }}
                    />
                  </div>
                </div>

                {/* Open Findings */}
                {vendor.open_findings !== undefined && vendor.open_findings > 0 && (
                  <div
                    className="flex items-center gap-2 rounded-md px-3 py-2 mb-4 border"
                    style={{
                      backgroundColor: 'var(--status-warning-muted)',
                      borderColor: 'var(--status-warning-border)',
                      color: 'var(--status-warning-text)',
                    }}
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">
                      <span className="font-mono">{vendor.open_findings}</span> open finding
                      {vendor.open_findings !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Quick Actions */}
                <div
                  className="pt-4 border-t flex items-center gap-2"
                  style={{ borderTopColor: 'var(--border-subtle)' }}
                >
                  <button
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-[10px] border transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-default)',
                      transitionDuration: 'var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-highlight)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => navigate(`/assessments/new?vendor=${vendor.id}`)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-[10px] transition-colors"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--text-inverse)',
                      transitionDuration: 'var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent-primary-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                    }}
                    title="New Assessment"
                  >
                    <ClipboardList className="w-4 h-4" />
                    <span>Assess</span>
                  </button>
                  <button
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                    className="px-3 py-2 text-xs font-medium rounded-[10px] border transition-colors"
                    style={{
                      color: 'var(--text-secondary)',
                      borderColor: 'var(--border-default)',
                      transitionDuration: 'var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-highlight)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                    title="Send Invitation"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Vendor Modal */}
      <NewVendorModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreate={handleVendorCreated}
      />
    </div>
  );
}
