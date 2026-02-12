/**
 * Assessments List Page
 * Fix 6: Assessment Cards Grid
 * Fix 7: Type Filter Buttons
 * Fix 9: Search Input
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import type { Assessment } from '../types';
import { getErrorMessage, formatDate } from '../api/client';

// Helper: Get score color class
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

export default function Assessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'organization' | 'vendor'>('all');

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
      <div className="flex items-center justify-center h-64">
        <div className="text-text-secondary">Loading assessments...</div>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Assessments</h1>
          <p className="text-text-secondary mt-1">Manage your NIST CSF 2.0 assessments</p>
        </div>
        <Link to="/assessments/new" className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          New Assessment
        </Link>
      </div>

      {/* Filters — Fix 9: Search Input + Fix 7: Type Filter Buttons */}
      <div className="card card-body">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Search Input — Fix 9 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-input-placeholder" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 w-full"
            />
          </div>

          {/* Type Filter Buttons — Fix 7 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-brand-primary text-white font-semibold'
                  : 'bg-transparent text-text-secondary border border-card-border hover:bg-card-bg hover:border-text-muted hover:text-text-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('organization')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'organization'
                  ? 'bg-brand-primary text-white font-semibold'
                  : 'bg-transparent text-text-secondary border border-card-border hover:bg-card-bg hover:border-text-muted hover:text-text-primary'
              }`}
            >
              Organization
            </button>
            <button
              onClick={() => setFilterType('vendor')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filterType === 'vendor'
                  ? 'bg-brand-primary text-white font-semibold'
                  : 'bg-transparent text-text-secondary border border-card-border hover:bg-card-bg hover:border-text-muted hover:text-text-primary'
              }`}
            >
              Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Assessments List — Fix 6: Assessment Cards Grid */}
      {filteredAssessments.length === 0 ? (
        <div className="card card-body text-center py-12">
          <p className="text-text-secondary mb-4">No assessments found</p>
          <Link to="/assessments/new" className="btn btn-primary mx-auto">
            Create Your First Assessment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => {
            const score = assessment.overall_score || 0;
            return (
              <Link
                key={assessment.id}
                to={`/assessments/${assessment.id}`}
                className="card p-5 hover:shadow-card-hover transition-all duration-200 border border-card-border"
                style={{
                  borderRadius: '12px',
                }}
              >
                {/* Header: Title + Status Badge */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-card-title line-clamp-2 flex-1 mr-2">
                    {assessment.name}
                  </h3>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-md flex-shrink-0 ${
                      assessment.status === 'completed'
                        ? 'bg-status-compliant-bg text-status-compliant-text border border-status-compliant-border'
                        : assessment.status === 'in_progress'
                        ? 'bg-status-inprogress-bg text-status-inprogress-text border border-status-inprogress-border'
                        : 'bg-status-draft-bg text-status-draft-text border border-status-draft-border'
                    }`}
                  >
                    {assessment.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Description */}
                {assessment.description && (
                  <p className="text-sm text-card-description mb-4 line-clamp-2">
                    {assessment.description}
                  </p>
                )}

                {/* Progress Bar — Fix 3 */}
                <div className="mb-4">
                  <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div
                      className={`h-full ${getScoreProgressColor(score)}`}
                      style={{ width: `${score}%`, minWidth: score > 0 ? '4px' : '0' }}
                    />
                  </div>
                </div>

                {/* Score + Created Date */}
                <div className="flex items-center justify-between pt-4 border-t border-card-border">
                  <div>
                    <p className="text-xs text-card-metadata mb-1">Score</p>
                    <p className={`text-lg font-bold font-mono ${getScoreColorClass(score)}`}>
                      {score.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-card-metadata mb-1">Created</p>
                    <p className="text-sm text-card-metadata">{formatDate(assessment.created_at)}</p>
                  </div>
                </div>

                {/* Vendor Info */}
                {assessment.assessment_type === 'vendor' && assessment.vendor && (
                  <div className="mt-3 pt-3 border-t border-card-border">
                    <p className="text-xs text-card-metadata mb-1">Vendor</p>
                    <p className="text-sm font-medium text-card-title">{assessment.vendor.name}</p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
