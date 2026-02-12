/**
 * Dashboard Page
 * Overview of assessments, vendors, and recent activity
 */

import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ClipboardList, TrendingUp, AlertCircle, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, Eye, Edit, Send, X } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { vendorsApi } from '../api/vendors';
import type { Assessment, Vendor } from '../types';
import { getErrorMessage, formatDate } from '../api/client';

// Helper: Format relative time (e.g., "2 hours ago")
function formatRelativeTime(timestamp: number | null | undefined): string {
  // Handle null/undefined/invalid timestamps
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
    return 'just created';
  }

  const now = Date.now();
  const diff = now - timestamp;

  // Handle future timestamps or invalid diff
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
function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-status-compliant-bg text-status-compliant-text border border-status-compliant-border';
    case 'in_progress':
      return 'bg-status-inprogress-bg text-status-inprogress-text border border-status-inprogress-border';
    case 'draft':
      return 'bg-status-draft-bg text-status-draft-text border border-status-draft-border';
    default:
      return 'bg-status-draft-bg text-status-draft-text border border-status-draft-border';
  }
}

// Helper: Get status dot color
function getStatusDotColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-status-compliant';
    case 'in_progress':
      return 'bg-status-inprogress';
    case 'draft':
      return 'bg-status-draft';
    default:
      return 'bg-status-draft';
  }
}

// Helper: Get assessment type badge styling
function getAssessmentTypeBadge(type: string): { bg: string; text: string; border: string; label: string } {
  switch (type) {
    case 'vendor':
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: 'Vendor Assessment' };
    case 'organization':
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: 'Self-Assessment' };
    default:
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', label: type };
  }
}

// Helper: Get score color class (red/amber/green)
function getScoreColorClass(score: number): string {
  if (score >= 71) return 'text-status-compliant';
  if (score >= 41) return 'text-status-partial';
  return 'text-status-noncompliant';
}

// Helper: Get score progress bar color
function getScoreProgressColor(score: number): string {
  if (score >= 71) return 'bg-status-compliant';
  if (score >= 41) return 'bg-status-partial';
  return 'bg-status-noncompliant';
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
  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all' || typeFilter !== 'all' || sortBy !== 'newest';

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
      // Search filter
      const matchesSearch =
        assessment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.vendor?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      // Status filter
      const matchesStatus = statusFilter === 'all' || assessment.status === statusFilter;

      // Type filter
      const matchesType = typeFilter === 'all' || assessment.assessment_type === typeFilter;

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

  const inProgressAssessments = assessments.filter((a) => a.status === 'in_progress');
  const completedAssessments = assessments.filter((a) => a.status === 'completed');
  const draftAssessments = assessments.filter((a) => a.status === 'draft');
  const criticalVendors = vendors.filter((v) => v.criticality_level === 'critical');

  // Mock trend data (would come from backend in real app)
  const trends = {
    total: { value: 3, direction: 'up' as const },
    draft: { value: 0, direction: 'neutral' as const },
    inProgress: { value: 1, direction: 'up' as const },
    completed: { value: 2, direction: 'down' as const },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-status-noncompliant-bg border border-status-noncompliant-border rounded-lg p-4">
        <p className="text-status-noncompliant-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Overview of your cybersecurity assessments</p>
      </div>

      {/* Stats Grid - Enhanced Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Assessments */}
        <Link
          to="/assessments"
          className="bg-card-bg border border-card-border border-l-4 border-l-primary rounded-lg p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--stat-total-icon-bg)' }}
            >
              <ClipboardList className="w-5 h-5" style={{ color: 'var(--stat-total-icon)' }} />
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary mb-1">Total Assessments</p>
              <p className="text-3xl font-bold text-text-primary">{assessments.length}</p>
            </div>
          </div>
          <div className="flex items-center text-xs text-text-secondary">
            {trends.total.direction === 'up' ? (
              <>
                <ArrowUp className="w-3 h-3 text-status-compliant mr-1" />
                <span className="text-status-compliant">↑{trends.total.value} this month</span>
              </>
            ) : trends.total.direction === 'down' ? (
              <>
                <ArrowDown className="w-3 h-3 text-status-noncompliant mr-1" />
                <span className="text-status-noncompliant">↓{trends.total.value} this month</span>
              </>
            ) : (
              <>
                <Minus className="w-3 h-3 text-text-muted mr-1" />
                <span>No change</span>
              </>
            )}
          </div>
        </Link>

        {/* Draft */}
        <div
          onClick={() => navigate('/assessments?status=draft')}
          className="bg-card-bg border border-card-border border-l-4 border-l-status-draft rounded-lg p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--stat-draft-icon-bg)' }}
            >
              <ClipboardList className="w-5 h-5" style={{ color: 'var(--stat-draft-icon)' }} />
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary mb-1">Draft</p>
              <p className="text-3xl font-bold text-text-primary">{draftAssessments.length}</p>
            </div>
          </div>
          <div className="flex items-center text-xs text-text-muted">
            <Minus className="w-3 h-3 mr-1" />
            <span>—</span>
          </div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => navigate('/assessments?status=in_progress')}
          className="bg-card-bg border border-card-border border-l-4 border-l-status-inprogress rounded-lg p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--stat-progress-icon-bg)' }}
            >
              <TrendingUp className="w-5 h-5" style={{ color: 'var(--stat-progress-icon)' }} />
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary mb-1">In Progress</p>
              <p className="text-3xl font-bold text-text-primary">{inProgressAssessments.length}</p>
            </div>
          </div>
          <div className="flex items-center text-xs text-text-secondary">
            <ArrowUp className="w-3 h-3 text-status-compliant mr-1" />
            <span className="text-status-compliant">↑{trends.inProgress.value} this month</span>
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => navigate('/assessments?status=completed')}
          className="bg-card-bg border border-card-border border-l-4 border-l-status-compliant rounded-lg p-6 shadow-card hover:shadow-card-hover transition-shadow duration-200 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--stat-completed-icon-bg)' }}
            >
              <ClipboardList className="w-5 h-5" style={{ color: 'var(--stat-completed-icon)' }} />
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary mb-1">Completed</p>
              <p className="text-3xl font-bold text-text-primary">{completedAssessments.length}</p>
            </div>
          </div>
          {completedAssessments.length === 0 ? (
            <div className="text-xs text-text-secondary">
              Complete your first assessment →
            </div>
          ) : (
            <div className="flex items-center text-xs text-text-secondary">
              <ArrowDown className="w-3 h-3 text-status-noncompliant mr-1" />
              <span className="text-status-noncompliant">↓{trends.completed.value} this month</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Assessments */}
      <div className="bg-card-bg rounded-lg shadow-card border border-card-border">
        <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Recent Assessments</h2>
          <Link to="/assessments" className="text-sm text-link hover:text-link-hover transition-colors">
            View all
          </Link>
        </div>

        {/* Search and Filter Bar */}
        <div className="px-6 py-4 border-b border-card-border bg-page-bg">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-input-placeholder" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-input-bg text-input-text border border-input-border rounded-md focus:ring-2 focus:ring-secondary-light focus:border-input-border-focus transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-input-bg text-input-text border border-input-border rounded-md focus:ring-2 focus:ring-secondary-light focus:border-input-border-focus transition-colors"
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
              className="px-3 py-2 text-sm bg-input-bg text-input-text border border-input-border rounded-md focus:ring-2 focus:ring-secondary-light focus:border-input-border-focus transition-colors"
            >
              <option value="all">All Types</option>
              <option value="organization">Self-Assessment</option>
              <option value="vendor">Vendor Assessment</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm bg-input-bg text-input-text border border-input-border rounded-md focus:ring-2 focus:ring-secondary-light focus:border-input-border-focus transition-colors"
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
                className="px-3 py-2 text-sm text-text-secondary hover:text-text-primary border border-border-default rounded-md hover:bg-page-bg transition-colors flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {paginatedAssessments.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {assessments.length === 0 ? 'No assessments yet' : 'No assessments match your filters'}
              </h3>
              <p className="text-sm text-text-secondary mb-4">
                {assessments.length === 0
                  ? 'Create your first assessment to get started'
                  : 'Try adjusting your search or filters'}
              </p>
              {assessments.length === 0 ? (
                <Link to="/assessments/new" className="inline-flex items-center px-4 py-2 bg-primary text-text-inverse rounded-md hover:bg-primary-hover transition-colors">
                  Create First Assessment
                </Link>
              ) : (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-border-default rounded-md hover:bg-page-bg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-0">
                {paginatedAssessments.map((assessment) => {
                  const typeBadge = getAssessmentTypeBadge(assessment.assessment_type);
                  return (
                    <div
                      key={assessment.id}
                      onMouseEnter={() => setHoveredRow(assessment.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      className="relative py-4 transition-colors cursor-pointer group border-b"
                      style={{
                        borderBottomColor: 'rgba(255, 255, 255, 0.06)',
                        backgroundColor: hoveredRow === assessment.id ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                      }}
                    >
                      <Link to={`/assessments/${assessment.id}`} className="block">
                        <div className="flex items-start gap-4">
                          {/* Status Dot */}
                          <div className="pt-1.5">
                            <div className={`w-2 h-2 rounded-full ${getStatusDotColor(assessment.status)}`}></div>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Title — Fix 8: use card-title */}
                            <h3 className="font-semibold text-card-title mb-2">{assessment.name}</h3>

                            {/* Metadata — Fix 8: use card-metadata */}
                            <div className="flex flex-wrap items-center gap-2 text-xs text-card-metadata">
                              <span className={`px-2 py-0.5 rounded-full border ${typeBadge.bg} ${typeBadge.text} ${typeBadge.border} font-medium`}>
                                {typeBadge.label}
                              </span>
                              <span className="text-card-metadata">Created {formatDate(assessment.created_at)}</span>
                              <span>•</span>
                              <span className="text-card-metadata">Updated {formatRelativeTime(assessment.updated_at)}</span>
                            </div>
                          </div>

                          {/* Score Section — Fix 3: better progress bar */}
                          {assessment.overall_score !== null && assessment.overall_score !== undefined && (
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-16 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                                    <div
                                      className={`h-full ${getScoreProgressColor(assessment.overall_score)}`}
                                      style={{ width: `${Math.max(2, assessment.overall_score)}%`, minWidth: assessment.overall_score > 0 ? '4px' : '0' }}
                                    />
                                  </div>
                                  <span className={`font-mono font-bold text-sm ${getScoreColorClass(assessment.overall_score)}`}>
                                    {assessment.overall_score.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${getStatusBadgeClass(assessment.status)}`}>
                              {assessment.status.replace('_', ' ')}
                            </span>
                            {/* Chevron indicator */}
                            <ChevronRight className="w-4 h-4 text-card-metadata group-hover:text-text-secondary transition-colors" />
                          </div>
                        </div>
                      </Link>

                      {/* Quick Actions (on hover) */}
                      {hoveredRow === assessment.id && (
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 bg-card-bg px-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/assessments/${assessment.id}`);
                            }}
                            className="p-2 rounded-md hover:bg-secondary-light text-text-secondary hover:text-secondary transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(`/assessments/${assessment.id}`);
                            }}
                            className="p-2 rounded-md hover:bg-secondary-light text-text-secondary hover:text-secondary transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {assessment.assessment_type === 'vendor' && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/assessments/${assessment.id}`);
                              }}
                              className="p-2 rounded-md hover:bg-secondary-light text-text-secondary hover:text-secondary transition-colors"
                              title="Send to Vendor"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-card-border">
                  <p className="text-sm text-text-secondary">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAssessments.length)} of {filteredAssessments.length} assessments
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 text-sm border border-border-default rounded-md hover:bg-page-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-text-primary font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 text-sm border border-border-default rounded-md hover:bg-page-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="bg-card-bg rounded-lg shadow-card border border-card-border">
          <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-status-critical" />
              <h2 className="text-lg font-semibold text-text-primary">Critical Vendors</h2>
            </div>
            <Link to="/vendors" className="text-sm text-link hover:text-link-hover transition-colors">
              View all vendors
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {criticalVendors.slice(0, 3).map((vendor) => (
                <Link
                  key={vendor.id}
                  to={`/vendors/${vendor.id}`}
                  className="block p-4 border border-status-critical-border bg-status-critical-bg rounded-lg hover:bg-status-noncompliant-bg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">{vendor.name}</h3>
                      <p className="text-sm text-text-secondary mt-1">{vendor.industry}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-status-critical text-text-inverse text-xs font-medium rounded-md">
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
