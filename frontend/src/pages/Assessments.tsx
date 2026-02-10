/**
 * Assessments List Page
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import type { Assessment } from '../types';
import { getErrorMessage, formatDate } from '../api/client';

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
        <div className="text-gray-500">Loading assessments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-500 mt-1">Manage your NIST CSF 2.0 assessments</p>
        </div>
        <Link to="/assessments/new" className="btn btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          New Assessment
        </Link>
      </div>

      {/* Filters */}
      <div className="card card-body">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`btn btn-sm ${
                filterType === 'all' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('organization')}
              className={`btn btn-sm ${
                filterType === 'organization' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Organization
            </button>
            <button
              onClick={() => setFilterType('vendor')}
              className={`btn btn-sm ${
                filterType === 'vendor' ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              Vendor
            </button>
          </div>
        </div>
      </div>

      {/* Assessments List */}
      {filteredAssessments.length === 0 ? (
        <div className="card card-body text-center py-12">
          <p className="text-gray-500 mb-4">No assessments found</p>
          <Link to="/assessments/new" className="btn btn-primary mx-auto">
            Create Your First Assessment
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssessments.map((assessment) => (
            <Link
              key={assessment.id}
              to={`/assessments/${assessment.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="card-body">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {assessment.name}
                  </h3>
                  <span
                    className={`badge ${
                      assessment.status === 'completed'
                        ? 'badge-green'
                        : assessment.status === 'in_progress'
                        ? 'badge-yellow'
                        : 'badge-gray'
                    }`}
                  >
                    {assessment.status.replace('_', ' ')}
                  </span>
                </div>

                {assessment.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {assessment.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="text-lg font-bold text-gray-900">
                      {assessment.overall_score?.toFixed(1) || '0.0'}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="text-sm text-gray-700">{formatDate(assessment.created_at)}</p>
                  </div>
                </div>

                {assessment.assessment_type === 'vendor' && assessment.vendor && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Vendor</p>
                    <p className="text-sm font-medium text-gray-900">{assessment.vendor.name}</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
