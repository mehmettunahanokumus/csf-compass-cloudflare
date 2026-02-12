/**
 * Vendors - Rebuilt from scratch
 * Grid of vendor cards with risk tiers and compliance scores
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
  ShieldAlert,
  BarChart3,
  Trophy,
  Layout,
} from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import type { Vendor } from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import NewVendorModal from '../components/NewVendorModal';
import Skeleton from '../components/Skeleton.new';
import RiskScoreIndicator from '../components/vendors/RiskScoreIndicator';
import CriticalityBadge from '../components/vendors/CriticalityBadge';

export default function VendorsNew() {
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

  const getScoreColor = (score: number | undefined) => {
    if (!score || score === 0) return 'var(--text-4)';
    if (score >= 71) return 'var(--green)';
    if (score >= 41) return 'var(--orange)';
    return 'var(--red)';
  };

  if (loading) {
    return (
      <div>
        {/* Header skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <Skeleton w="150px" h="28px" />
            <Skeleton w="200px" h="16px" />
          </div>
          <Skeleton w="130px" h="40px" />
        </div>

        {/* Search skeleton */}
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 2fr', gap: '16px' }}>
            <Skeleton w="100%" h="40px" />
            <Skeleton w="100%" h="40px" />
          </div>
        </div>

        {/* Cards skeleton */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              window.innerWidth < 1024
                ? window.innerWidth < 640
                  ? '1fr'
                  : 'repeat(2, 1fr)'
                : 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                boxShadow: 'var(--shadow-xs)',
                minHeight: '220px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <Skeleton w="60%" h="16px" />
                  <Skeleton w="40%" h="12px" />
                </div>
                <Skeleton w="60px" h="20px" />
              </div>
              <Skeleton w="70%" h="12px" />
              <Skeleton w="100%" h="40px" />
              <Skeleton w="100%" h="4px" />
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                <Skeleton w="33%" h="32px" />
                <Skeleton w="33%" h="32px" />
                <Skeleton w="33%" h="32px" />
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
      {/* Page Header */}
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
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-1)', marginBottom: '4px' }}>Vendors</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-2)' }}>
            Manage your third-party vendors (<span style={{ fontFamily: 'var(--font-mono)' }}>{vendors.length}</span>{' '}
            total)
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
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
          <Plus size={18} />
          New Vendor
        </button>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {(() => {
          const highRisk = vendors.filter((v) => (v.latest_assessment_score ?? 100) < 50);
          const critical = vendors.filter((v) => v.criticality_level === 'critical' || v.risk_tier === 'critical');
          const avgScore = vendors.length > 0
            ? vendors.reduce((sum, v) => sum + (v.latest_assessment_score ?? 0), 0) / vendors.length
            : 0;

          const stats = [
            { label: 'Total Vendors', value: vendors.length, color: 'var(--accent)', icon: Building2, bgColor: 'var(--accent-subtle)' },
            { label: 'High Risk', value: highRisk.length, color: 'var(--red)', icon: AlertTriangle, bgColor: 'var(--red-subtle)' },
            { label: 'Average Score', value: avgScore > 0 ? `${avgScore.toFixed(1)}%` : 'N/A', color: 'var(--blue)', icon: BarChart3, bgColor: 'var(--blue-subtle)' },
            { label: 'Critical', value: critical.length, color: 'var(--orange)', icon: ShieldAlert, bgColor: 'var(--orange-subtle)' },
          ];

          return stats.map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div
                key={stat.label}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-3)', marginBottom: '8px' }}>
                      {stat.label}
                    </p>
                    <p style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: stat.color }}>
                      {stat.value}
                    </p>
                  </div>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: stat.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StatIcon size={18} style={{ color: stat.color }} />
                  </div>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Quick Action Links */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          onClick={() => navigate('/vendors/ranking')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-2)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--raised)';
            e.currentTarget.style.color = 'var(--text-1)';
            e.currentTarget.style.borderColor = 'var(--border-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--card)';
            e.currentTarget.style.color = 'var(--text-2)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <Trophy size={16} />
          View Rankings
        </button>
        <button
          onClick={() => navigate('/vendors/templates')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-2)',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--raised)';
            e.currentTarget.style.color = 'var(--text-1)';
            e.currentTarget.style.borderColor = 'var(--border-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--card)';
            e.currentTarget.style.color = 'var(--text-2)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          <Layout size={16} />
          Manage Templates
        </button>
      </div>

      {/* Criticality Breakdown */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-1)', marginBottom: '16px' }}>
          Criticality Breakdown
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 640 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '12px',
          }}
        >
          {(['critical', 'high', 'medium', 'low'] as const).map((level) => {
            const count = vendors.filter(
              (v) => (v.criticality_level || v.risk_tier || 'medium') === level
            ).length;
            return (
              <div
                key={level}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--raised)',
                }}
              >
                <CriticalityBadge level={level} size="sm" />
                <span
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-1)',
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search and Filters */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '2fr 2fr',
            gap: '16px',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-4)',
              }}
            />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 38px',
                fontSize: '14px',
                color: 'var(--text-1)',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                outline: 'none',
                transition: 'all 150ms ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-focus)';
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Risk Tier Filter */}
          <select
            value={filterRiskTier}
            onChange={(e) => setFilterRiskTier(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 14px',
              fontSize: '14px',
              color: 'var(--text-1)',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              outline: 'none',
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

      {/* Vendors Grid */}
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
          <p style={{ fontSize: '14px', color: 'var(--text-3)', marginBottom: '20px' }}>
            {searchTerm || filterRiskTier !== 'all' ? 'No vendors match your filters' : 'No vendors found'}
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--accent)',
              color: 'var(--text-on-accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
          >
            Add Your First Vendor
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              window.innerWidth < 1024
                ? window.innerWidth < 640
                  ? '1fr'
                  : 'repeat(2, 1fr)'
                : 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          {filteredVendors.map((vendor) => {
            const complianceScore = vendor.latest_assessment_score || 0;
            const scoreColor = getScoreColor(complianceScore);

            return (
              <div
                key={vendor.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'all 200ms ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = 'var(--border-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                {/* Header: Name + Risk Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--text-1)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {vendor.name}
                    </h3>
                    {vendor.industry && (
                      <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '2px' }}>{vendor.industry}</p>
                    )}
                  </div>
                  <CriticalityBadge
                    level={(vendor.risk_tier || vendor.criticality_level || 'medium') as 'low' | 'medium' | 'high' | 'critical'}
                    size="sm"
                  />
                </div>

                {/* Last Assessment Date */}
                <div style={{ fontSize: '13px', marginBottom: '16px' }}>
                  {vendor.last_assessment_date ? (
                    <div style={{ color: 'var(--text-3)' }}>
                      Last assessed:{' '}
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>
                        {formatDate(vendor.last_assessment_date)}
                      </span>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-4)' }}>No assessments yet</div>
                  )}
                </div>

                {/* Compliance Score */}
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <RiskScoreIndicator score={complianceScore} size="sm" />
                  <div style={{ flex: 1 }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--text-4)',
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
                      Compliance Score
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: '4px',
                        borderRadius: '999px',
                        background: 'var(--border)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${complianceScore}%`,
                          height: '100%',
                          background: scoreColor,
                          transition: 'width 300ms ease',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Open Findings */}
                {vendor.open_findings !== undefined && vendor.open_findings > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 12px',
                      marginBottom: '16px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--orange-subtle)',
                      border: '1px solid var(--orange)',
                      color: 'var(--orange-text)',
                    }}
                  >
                    <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', fontWeight: 500 }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{vendor.open_findings}</span> open finding
                      {vendor.open_findings !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}

                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-2)',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--raised)';
                      e.currentTarget.style.color = 'var(--text-1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-2)';
                    }}
                  >
                    <Eye size={14} />
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/assessments/new?vendor=${vendor.id}`)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-on-accent)',
                      background: 'var(--accent)',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                  >
                    <ClipboardList size={14} />
                    Assess
                  </button>
                  <button
                    onClick={() => navigate(`/vendors/${vendor.id}`)}
                    style={{
                      padding: '8px 12px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-2)',
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--raised)';
                      e.currentTarget.style.color = 'var(--text-1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-2)';
                    }}
                  >
                    <Link2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Vendor Modal */}
      <NewVendorModal isOpen={showNewModal} onClose={() => setShowNewModal(false)} onCreate={handleVendorCreated} />
    </div>
  );
}
