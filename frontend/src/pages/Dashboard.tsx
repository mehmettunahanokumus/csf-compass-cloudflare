/**
 * Dashboard Page
 * Overview of assessments, vendors, and recent activity
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { vendorsApi } from '../api/vendors';
import type { Assessment, Vendor } from '../types';
import { getErrorMessage, formatDate } from '../api/client';

export default function Dashboard() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

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

  const inProgressAssessments = assessments.filter((a) => a.status === 'in_progress');
  const completedAssessments = assessments.filter((a) => a.status === 'completed');
  const criticalVendors = vendors.filter((v) => v.criticality_level === 'critical');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your cybersecurity assessments</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Assessments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{assessments.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <ClipboardList className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {inProgressAssessments.length}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {completedAssessments.length}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <ClipboardList className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical Vendors</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {criticalVendors.length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <Building2 className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Assessments */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Assessments</h2>
          <Link to="/assessments" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        <div className="card-body">
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No assessments yet</p>
              <Link to="/assessments/new" className="btn btn-primary">
                Create First Assessment
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.slice(0, 5).map((assessment) => (
                <Link
                  key={assessment.id}
                  to={`/assessments/${assessment.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{assessment.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Created {formatDate(assessment.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      {assessment.overall_score !== null && (
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {assessment.overall_score?.toFixed(1)}%
                          </p>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                      )}
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
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Critical Vendors */}
      {criticalVendors.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold">Critical Vendors</h2>
            </div>
            <Link to="/vendors" className="text-sm text-blue-600 hover:underline">
              View all vendors
            </Link>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {criticalVendors.slice(0, 3).map((vendor) => (
                <Link
                  key={vendor.id}
                  to={`/vendors/${vendor.id}`}
                  className="block p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{vendor.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{vendor.industry}</p>
                    </div>
                    <span className="badge badge-red">Critical</span>
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
