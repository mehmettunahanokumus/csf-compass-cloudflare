/**
 * Assessments List Page
 * Datadog-style: Grid of assessment cards with filters
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import type { Assessment } from '../types';
import { getErrorMessage } from '../api/client';

// Helper: Get score color
function getScoreColor(score: number): string {
  if (score >= 71) return 'var(--status-success)';
  if (score >= 41) return 'var(--status-warning)';
  return 'var(--status-danger)';
}

// Helper: Get status style
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

export default function Assessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'organization' | 'vendor'>(
    'all'
  );

  useEffect(() => {
    loadAssessments();
  }, [filterType]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      const type = filterType === 'all' ? undefined : filterType;
      const data = await assessmentsApi.list(type);
      setAssessments(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter((assessment) =>
    assessment.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="skeleton h-8 w-40 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
          <div className="skeleton h-10 w-40 rounded-md" />
        </div>

        {/* Filters Skeleton */}
        <div
          className="rounded-lg p-4 border"
          style={{
            backgroundColor: 'var(--surface-raised)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="flex gap-4">
            <div className="flex-1 skeleton h-10 rounded-md" />
            <div className="skeleton h-10 w-32 rounded-md" />
          </div>
        </div>

        {/* Assessment Cards Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-5 w-16 rounded-md" />
              </div>
              <div className="skeleton h-3 w-full mb-1" />
              <div className="skeleton h-3 w-2/3 mb-3" />
              <div className="skeleton h-1 w-full rounded-full my-3" />
              <div className="flex items-end justify-between">
                <div>
                  <div className="skeleton h-2 w-12 mb-1" />
                  <div className="skeleton h-6 w-16" />
                </div>
                <div className="text-right">
                  <div className="skeleton h-2 w-16 mb-1" />
                  <div className="skeleton h-3 w-20" />
                </div>
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
            Assessments
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Manage your NIST CSF 2.0 assessments
          </p>
        </div>
        <Link
          to="/assessments/new"
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
          New Assessment
        </Link>
      </div>

      {/* Filters */}
      <div
        className="rounded-lg p-4 border"
        style={{
          backgroundColor: 'var(--surface-raised)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--input-placeholder)' }}
            />
            <input
              type="text"
              placeholder="Search assessments..."
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

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all border"
              style={{
                backgroundColor:
                  filterType === 'all' ? 'var(--accent-primary)' : 'transparent',
                color:
                  filterType === 'all' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                borderColor:
                  filterType === 'all' ? 'var(--accent-primary)' : 'var(--border-default)',
                transitionDuration: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (filterType !== 'all') {
                  e.currentTarget.style.backgroundColor = 'var(--surface-highlight)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (filterType !== 'all') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('organization')}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all border"
              style={{
                backgroundColor:
                  filterType === 'organization'
                    ? 'var(--accent-primary)'
                    : 'transparent',
                color:
                  filterType === 'organization'
                    ? 'var(--text-inverse)'
                    : 'var(--text-secondary)',
                borderColor:
                  filterType === 'organization'
                    ? 'var(--accent-primary)'
                    : 'var(--border-default)',
                transitionDuration: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (filterType !== 'organization') {
                  e.currentTarget.style.backgroundColor = 'var(--surface-highlight)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (filterType !== 'organization') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              Organization
            </button>
            <button
              onClick={() => setFilterType('vendor')}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all border"
              style={{
                backgroundColor:
                  filterType === 'vendor' ? 'var(--accent-primary)' : 'transparent',
                color:
                  filterType === 'vendor'
                    ? 'var(--text-inverse)'
                    : 'var(--text-secondary)',
                borderColor:
                  filterType === 'vendor'
                    ? 'var(--accent-primary)'
                    : 'var(--border-default)',
                transitionDuration: 'var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (filterType !== 'vendor') {
                  e.currentTarget.style.backgroundColor = 'var(--surface-highlight)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (filterType !== 'vendor') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Assessments Grid */}
      {filteredAssessments.length === 0 ? (
        <div
          className="rounded-lg p-12 text-center border"
          style={{
            backgroundColor: 'var(--surface-raised)',
            borderColor: 'var(--border-default)',
          }}
        >
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
            No assessments found
          </p>
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
            Create Your First Assessment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssessments.map((assessment, index) => {
            const score = assessment.overall_score || 0;
            const statusStyle = getStatusStyle(assessment.status);

            return (
              <Link
                key={assessment.id}
                to={`/assessments/${assessment.id}`}
                className={`rounded-xl p-5 border transition-all cursor-pointer ${index < 6 ? 'fade-in-stagger' : 'fade-in'}`}
                style={{
                  backgroundColor: 'var(--surface-base)',
                  borderColor: 'var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  transitionDuration: 'var(--transition-slow)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.borderColor = 'var(--accent-border-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                {/* Header: Title + Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3
                    className="font-medium text-sm line-clamp-2 flex-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {assessment.name}
                  </h3>
                  <span
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md flex-shrink-0"
                    style={{
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.text,
                    }}
                  >
                    {assessment.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Description */}
                {assessment.description && (
                  <p
                    className="text-xs mb-3 line-clamp-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {assessment.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div
                  className="h-1 rounded-full overflow-hidden my-3"
                  style={{ backgroundColor: 'var(--border-subtle)' }}
                >
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${Math.max(2, score)}%`,
                      backgroundColor: getScoreColor(score),
                      transitionDuration: 'var(--transition-slow)',
                    }}
                  />
                </div>

                {/* Footer: Score + Created Date */}
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      Score
                    </div>
                    <div
                      className="font-mono text-lg font-bold"
                      style={{ color: score === 0 ? 'var(--text-muted)' : getScoreColor(score) }}
                    >
                      {score.toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wide mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      Created
                    </div>
                    <div className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(assessment.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
