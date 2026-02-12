/**
 * Dashboard Page
 * Datadog-style: Data-dense overview with metrics and assessment rows
 */

import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { vendorsApi } from '../api/vendors';
import type { Assessment, Vendor } from '../types';
import { getErrorMessage } from '../api/client';

// Helper: Format relative time
function formatRelativeTime(timestamp: number | null | undefined): string {
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
    return 'just created';
  }

  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 0 || isNaN(diff)) {
    return 'just now';
  }

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

// Helper: Get status badge styling
function getStatusStyle(status: string): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'completed':
      return {
        bg: 'var(--status-success-muted)',
        text: 'var(--status-success-text)',
        border: 'var(--status-success-border)',
      };
    case 'in_progress':
      return {
        bg: 'var(--status-info-muted)',
        text: 'var(--status-info-text)',
        border: 'var(--status-info-border)',
      };
    case 'draft':
      return {
        bg: 'var(--status-neutral-muted)',
        text: 'var(--status-neutral-text)',
        border: 'var(--status-neutral-border)',
      };
    default:
      return {
        bg: 'var(--status-neutral-muted)',
        text: 'var(--status-neutral-text)',
        border: 'var(--status-neutral-border)',
      };
  }
}

// Helper: Get status dot color
function getStatusDotColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'var(--status-success)';
    case 'in_progress':
      return 'var(--status-info)';
    case 'draft':
      return 'var(--status-neutral)';
    default:
      return 'var(--status-neutral)';
  }
}

// Helper: Get assessment type badge styling
function getAssessmentTypeBadge(type: string): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  switch (type) {
    case 'vendor':
      return {
        bg: 'var(--status-vendor-muted)',
        text: 'var(--status-vendor-text)',
        border: 'var(--status-vendor-border)',
        label: 'Vendor',
      };
    case 'organization':
      return {
        bg: 'var(--status-neutral-muted)',
        text: 'var(--status-neutral-text)',
        border: 'var(--status-neutral-border)',
        label: 'Self',
      };
    default:
      return {
        bg: 'var(--status-neutral-muted)',
        text: 'var(--status-neutral-text)',
        border: 'var(--status-neutral-border)',
        label: type,
      };
  }
}

// Helper: Get score color
function getScoreColor(score: number): string {
  if (score >= 71) return 'var(--status-success)';
  if (score >= 41) return 'var(--status-warning)';
  return 'var(--status-danger)';
}

export default function Dashboard() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  // Apply filter from URL params if present
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assessmentsData, vendorsData] = await Promise.all([
        assessmentsApi.list(),
        vendorsApi.list(),
      ]);
      setAssessments(assessmentsData);
      setVendors(vendorsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Check if filters are active
  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    typeFilter !== 'all' ||
    sortBy !== 'newest';

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setSortBy('newest');
  };

  // Filtered and sorted assessments
  const filteredAssessments = useMemo(() => {
    let filtered = assessments.filter((assessment) => {
      const matchesSearch =
        assessment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || assessment.status === statusFilter;
      const matchesType =
        typeFilter === 'all' || assessment.assessment_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    // Apply sorting
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => a.created_at - b.created_at);
        break;
      case 'score_high':
        filtered.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));
        break;
      case 'score_low':
        filtered.sort((a, b) => (a.overall_score || 0) - (b.overall_score || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.created_at - a.created_at);
        break;
    }

    return filtered;
  }, [assessments, searchQuery, statusFilter, typeFilter, sortBy]);

  // Paginated assessments
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const paginatedAssessments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAssessments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssessments, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, sortBy]);

  const inProgressAssessments = assessments.filter(
    (a) => a.status === 'in_progress'
  );
  const completedAssessments = assessments.filter((a) => a.status === 'completed');
  const draftAssessments = assessments.filter((a) => a.status === 'draft');
  const criticalVendors = vendors.filter(
    (v) => v.criticality_level === 'critical'
  );

  // Mock trend data
  const trends = {
    total: { value: 3, direction: 'up' as const },
    draft: { value: 0, direction: 'neutral' as const },
    inProgress: { value: 1, direction: 'up' as const },
    completed: { value: 2, direction: 'down' as const },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div>
          <div className="skeleton h-8 w-48 mb-2" />
          <div className="skeleton h-4 w-64" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl p-5 border"
              style={{
                backgroundColor: 'var(--surface-base)',
                borderColor: 'var(--border-subtle)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="skeleton h-3 w-32 mb-3" />
              <div className="skeleton h-9 w-16 mb-3" />
              <div className="skeleton h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Recent Assessments Skeleton */}
        <div
          className="rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-raised)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between border-b"
            style={{ borderBottomColor: 'var(--border-default)' }}
          >
            <div className="skeleton h-5 w-40" />
            <div className="skeleton h-4 w-16" />
          </div>
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <div className="skeleton h-2 w-2 rounded-full" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-48 mb-2" />
                  <div className="skeleton h-3 w-64" />
                </div>
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-6 w-24 rounded" />
              </div>
            ))}
          </div>
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
      <div className="mb-2">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Overview of your cybersecurity assessments
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assessments */}
        <Link
          to="/assessments"
          className="rounded-xl p-5 border transition-all cursor-pointer relative overflow-hidden fade-in-stagger"
          style={{
            backgroundColor: 'var(--surface-base)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            transitionDuration: 'var(--transition-slow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div className="text-[11px] font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Total Assessments
          </div>
          <div className="font-mono text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {assessments.length}
          </div>
          <div className="font-mono text-xs">
            {trends.total.direction === 'up' ? (
              <span style={{ color: 'var(--status-up-text)' }}>
                ↑ {((trends.total.value / Math.max(1, assessments.length - trends.total.value)) * 100).toFixed(1)}%{' '}
                <span style={{ color: 'var(--text-tertiary)' }}>
                  From {assessments.length - trends.total.value}
                </span>
              </span>
            ) : trends.total.direction === 'down' ? (
              <span style={{ color: 'var(--status-down-text)' }}>
                ↓ {((trends.total.value / Math.max(1, assessments.length + trends.total.value)) * 100).toFixed(1)}%{' '}
                <span style={{ color: 'var(--text-tertiary)' }}>
                  From {assessments.length + trends.total.value}
                </span>
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>— —</span>
            )}
          </div>
        </Link>

        {/* Draft */}
        <div
          onClick={() => navigate('/assessments?status=draft')}
          className="rounded-xl p-5 border transition-all cursor-pointer relative overflow-hidden fade-in-stagger"
          style={{
            backgroundColor: 'var(--surface-base)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            transitionDuration: 'var(--transition-slow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div className="text-[11px] font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Draft
          </div>
          <div className="font-mono text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {draftAssessments.length}
          </div>
          <div className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
            — —
          </div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => navigate('/assessments?status=in_progress')}
          className="rounded-xl p-5 border transition-all cursor-pointer relative overflow-hidden fade-in-stagger"
          style={{
            backgroundColor: 'var(--surface-base)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            transitionDuration: 'var(--transition-slow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div className="text-[11px] font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
            In Progress
          </div>
          <div className="font-mono text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {inProgressAssessments.length}
          </div>
          <div className="font-mono text-xs">
            <span style={{ color: 'var(--status-up-text)' }}>
              ↑ {((trends.inProgress.value / Math.max(1, inProgressAssessments.length - trends.inProgress.value)) * 100).toFixed(1)}%{' '}
              <span style={{ color: 'var(--text-tertiary)' }}>
                From {inProgressAssessments.length - trends.inProgress.value}
              </span>
            </span>
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => navigate('/assessments?status=completed')}
          className="rounded-xl p-5 border transition-all cursor-pointer relative overflow-hidden fade-in-stagger"
          style={{
            backgroundColor: 'var(--surface-base)',
            borderColor: 'var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
            transitionDuration: 'var(--transition-slow)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div className="text-[11px] font-medium uppercase tracking-wide mb-3" style={{ color: 'var(--text-tertiary)' }}>
            Completed
          </div>
          <div className="font-mono text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {completedAssessments.length}
          </div>
          <div className="font-mono text-xs">
            {completedAssessments.length === 0 ? (
              <span style={{ color: 'var(--text-muted)' }}>— —</span>
            ) : (
              <span style={{ color: 'var(--status-down-text)' }}>
                ↓ {((trends.completed.value / Math.max(1, completedAssessments.length + trends.completed.value)) * 100).toFixed(1)}%{' '}
                <span style={{ color: 'var(--text-tertiary)' }}>
                  From {completedAssessments.length + trends.completed.value}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Assessments */}
      <div
        className="rounded-xl border"
        style={{
          backgroundColor: 'var(--surface-base)',
          borderColor: 'var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between border-b"
          style={{ borderBottomColor: 'var(--border-default)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Assessments
          </h2>
          <Link
            to="/assessments"
            className="text-sm transition-colors"
            style={{
              color: 'var(--text-link)',
              transitionDuration: 'var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-link-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-link)';
            }}
          >
            View all
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div
          className="px-6 py-4 border-b"
          style={{
            borderBottomColor: 'var(--border-subtle)',
            backgroundColor: 'var(--surface-base)',
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--input-placeholder)' }}
              />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-md border transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--input-text)',
                borderColor: 'var(--input-border)',
                transitionDuration: 'var(--transition-fast)',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-md border transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--input-text)',
                borderColor: 'var(--input-border)',
                transitionDuration: 'var(--transition-fast)',
              }}
            >
              <option value="all">All Types</option>
              <option value="organization">Self-Assessment</option>
              <option value="vendor">Vendor Assessment</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm rounded-md border transition-colors"
              style={{
                backgroundColor: 'var(--input-bg)',
                color: 'var(--input-text)',
                borderColor: 'var(--input-border)',
                transitionDuration: 'var(--transition-fast)',
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score_high">Score (High to Low)</option>
              <option value="score_low">Score (Low to High)</option>
              <option value="name">Name (A-Z)</option>
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm rounded-md border flex items-center gap-1 transition-colors"
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
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Assessment List */}
        <div className="p-6">
          {paginatedAssessments.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: 'var(--text-muted)' }}
              />
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {assessments.length === 0
                  ? 'No assessments yet'
                  : 'No assessments match your filters'}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                {assessments.length === 0
                  ? 'Create your first assessment to get started'
                  : 'Try adjusting your search or filters'}
              </p>
              {assessments.length === 0 ? (
                <Link
                  to="/assessments/new"
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
                  Create First Assessment
                </Link>
              ) : (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 rounded-md border text-sm transition-colors"
                  style={{
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                    transitionDuration: 'var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-highlight)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-0">
                {paginatedAssessments.map((assessment, index) => {
                  const typeBadge = getAssessmentTypeBadge(assessment.assessment_type);
                  const statusStyle = getStatusStyle(assessment.status);
                  const isHovered = hoveredRow === assessment.id;

                  return (
                    <Link
                      key={assessment.id}
                      to={`/assessments/${assessment.id}`}
                      onMouseEnter={() => setHoveredRow(assessment.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className={`block px-4 py-3.5 border-b transition-colors ${index < 6 ? 'fade-in-stagger' : 'fade-in'}`}
                      style={{
                        borderBottomColor: 'var(--border-subtle)',
                        backgroundColor: isHovered
                          ? 'var(--surface-highlight)'
                          : 'transparent',
                        transitionDuration: 'var(--transition-base)',
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Status Dot */}
                        <div className="flex-shrink-0">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              assessment.status === 'in_progress' ? 'status-dot-active' : ''
                            }`}
                            style={{ backgroundColor: getStatusDotColor(assessment.status) }}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-medium text-sm mb-1.5"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {assessment.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {/* Type Badge */}
                            <span
                              className="px-2 py-0.5 rounded-md font-medium text-[11px]"
                              style={{
                                backgroundColor: typeBadge.bg,
                                color: typeBadge.text,
                              }}
                            >
                              {typeBadge.label}
                            </span>
                            {/* Date */}
                            <span
                              className="font-mono"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              {new Date(assessment.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            {/* Relative time */}
                            <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                            <span
                              className="font-mono"
                              style={{ color: 'var(--text-tertiary)' }}
                            >
                              {formatRelativeTime(assessment.updated_at)}
                            </span>
                          </div>
                        </div>

                        {/* Score */}
                        {assessment.overall_score !== null &&
                          assessment.overall_score !== undefined && (
                            <div className="flex-shrink-0 flex items-center gap-2">
                              <div
                                className="w-16 h-1 rounded-full overflow-hidden"
                                style={{
                                  backgroundColor: 'var(--border-subtle)',
                                }}
                              >
                                <div
                                  className="h-full"
                                  style={{
                                    width: `${Math.max(2, assessment.overall_score)}%`,
                                    backgroundColor: getScoreColor(assessment.overall_score),
                                  }}
                                />
                              </div>
                              <div
                                className="font-mono text-sm font-semibold"
                                style={{ color: getScoreColor(assessment.overall_score) }}
                              >
                                {assessment.overall_score.toFixed(1)}%
                              </div>
                            </div>
                          )}

                        {/* Status Badge */}
                        <span
                          className="flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: statusStyle.bg,
                            color: statusStyle.text,
                          }}
                        >
                          {assessment.status.replace('_', ' ')}
                        </span>

                        {/* Chevron */}
                        <ChevronRight
                          className="w-4 h-4 flex-shrink-0 transition-opacity"
                          style={{
                            color: 'var(--text-muted)',
                            opacity: isHovered ? 1 : 0,
                          }}
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between mt-6 pt-4 border-t"
                  style={{ borderTopColor: 'var(--border-default)' }}
                >
                  <p className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    Showing {(currentPage - 1) * itemsPerPage + 1}–
                    {Math.min(currentPage * itemsPerPage, filteredAssessments.length)} of{' '}
                    {filteredAssessments.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)',
                        transitionDuration: 'var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== 1) {
                          e.currentTarget.style.backgroundColor = 'var(--surface-highlight)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span
                      className="text-sm font-mono font-medium px-3"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        borderColor: 'var(--border-default)',
                        color: 'var(--text-primary)',
                        transitionDuration: 'var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        if (currentPage !== totalPages) {
                          e.currentTarget.style.backgroundColor = 'var(--surface-highlight)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Critical Vendors */}
      {criticalVendors.length > 0 && (
        <div
          className="rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-raised)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div
            className="px-6 py-4 flex items-center justify-between border-b"
            style={{ borderBottomColor: 'var(--border-default)' }}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" style={{ color: 'var(--status-danger)' }} />
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Critical Vendors
              </h2>
            </div>
            <Link
              to="/vendors"
              className="text-sm transition-colors"
              style={{
                color: 'var(--text-link)',
                transitionDuration: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-link-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-link)';
              }}
            >
              View all vendors
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {criticalVendors.slice(0, 3).map((vendor) => (
                <Link
                  key={vendor.id}
                  to={`/vendors/${vendor.id}`}
                  className="block p-4 border rounded-lg transition-colors"
                  style={{
                    backgroundColor: 'var(--status-danger-muted)',
                    borderColor: 'var(--status-danger-border)',
                    transitionDuration: 'var(--transition-base)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--surface-overlay)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--status-danger-muted)';
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                        {vendor.name}
                      </h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {vendor.industry}
                      </p>
                    </div>
                    <span
                      className="px-2.5 py-1 text-xs font-medium rounded border"
                      style={{
                        backgroundColor: 'var(--status-danger)',
                        color: 'var(--text-inverse)',
                        borderColor: 'var(--status-danger)',
                      }}
                    >
                      Critical
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
