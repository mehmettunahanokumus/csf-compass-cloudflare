/**
 * Vendor Detail Page
 * Full vendor view with information, statistics, and assessment history
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, ClipboardList, Calendar, Globe, Mail } from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import { assessmentsApi } from '../api/assessments';
import type { Vendor, Assessment, VendorStats } from '../types';
import { getErrorMessage, formatDate } from '../api/client';

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editForm, setEditForm] = useState({
    name: '',
    website: '',
    contact_email: '',
    contact_name: '',
    description: '',
    risk_level: 'medium' as 'low' | 'medium' | 'high',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [vendorData, statsData, assessmentsData] = await Promise.all([
        vendorsApi.get(id),
        vendorsApi.getStats(id),
        assessmentsApi.list('vendor'),
      ]);

      setVendor(vendorData);
      setStats(statsData);

      // Filter assessments for this vendor
      const vendorAssessments = assessmentsData.filter((a) => a.vendor_id === id);
      setAssessments(vendorAssessments);

      // Initialize edit form
      setEditForm({
        name: vendorData.name,
        website: vendorData.website || '',
        contact_email: vendorData.contact_email || '',
        contact_name: vendorData.contact_name || '',
        description: vendorData.description || '',
        risk_level: vendorData.risk_level || 'medium',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      await vendorsApi.update(id, editForm);
      setEditing(false);
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this vendor? This will also delete all associated assessments.')) {
      return;
    }

    try {
      await vendorsApi.delete(id);
      navigate('/vendors');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const getRiskColor = (risk: string | undefined) => {
    switch (risk) {
      case 'high':
        return 'badge-red';
      case 'medium':
        return 'badge-yellow';
      case 'low':
        return 'badge-green';
      default:
        return 'badge-gray';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-green';
      case 'in_progress':
        return 'badge-yellow';
      case 'draft':
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading vendor...</div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Vendor not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/vendors" className="btn btn-secondary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{vendor.name}</h1>
            <p className="text-gray-500 mt-1">
              Added {formatDate(vendor.created_at)}
              {vendor.last_assessment_date && ` • Last assessed ${formatDate(vendor.last_assessment_date)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`badge ${getRiskColor(vendor.risk_level)}`}>
            {vendor.risk_level || 'unknown'} risk
          </span>
          {!editing && (
            <>
              <button onClick={() => setEditing(true)} className="btn btn-secondary btn-sm">
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </button>
              <button onClick={handleDelete} className="btn btn-danger btn-sm">
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Vendor Information */}
      {editing ? (
        <form onSubmit={handleEdit} className="card card-body">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Vendor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Vendor Name *</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Risk Level</label>
              <select
                value={editForm.risk_level}
                onChange={(e) => setEditForm({ ...editForm, risk_level: e.target.value as any })}
                className="form-select"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>

            <div>
              <label className="form-label">Website</label>
              <input
                type="url"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                placeholder="https://example.com"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                value={editForm.contact_email}
                onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                placeholder="contact@vendor.com"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Contact Name</label>
              <input
                type="text"
                value={editForm.contact_name}
                onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                placeholder="John Doe"
                className="form-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Description</label>
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
                className="form-textarea"
                placeholder="Brief description of the vendor's services..."
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-6">
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setEditForm({
                  name: vendor.name,
                  website: vendor.website || '',
                  contact_email: vendor.contact_email || '',
                  contact_name: vendor.contact_name || '',
                  description: vendor.description || '',
                  risk_level: vendor.risk_level || 'medium',
                });
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="card card-body">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Vendor Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vendor.website && (
              <div className="flex items-start space-x-3">
                <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {vendor.website}
                  </a>
                </div>
              </div>
            )}

            {vendor.contact_email && (
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Contact Email</p>
                  <a href={`mailto:${vendor.contact_email}`} className="text-blue-600 hover:text-blue-800 font-medium">
                    {vendor.contact_email}
                  </a>
                </div>
              </div>
            )}

            {vendor.contact_name && (
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Contact Name</p>
                  <p className="font-medium text-gray-900">{vendor.contact_name}</p>
                </div>
              </div>
            )}

            {vendor.description && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Description</p>
                <p className="text-gray-900">{vendor.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card card-body text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalAssessments}</p>
            <p className="text-sm text-gray-600">Total Assessments</p>
          </div>
          <div className="card card-body text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completedAssessments}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          <div className="card card-body text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgressAssessments}</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="card card-body text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.averageScore?.toFixed(1) || '0.0'}%</p>
            <p className="text-sm text-gray-600">Avg Score</p>
          </div>
        </div>
      )}

      {/* Assessment History */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Assessment History</h2>
          <Link to={`/assessments/new?vendor=${id}`} className="btn btn-primary btn-sm">
            <ClipboardList className="w-4 h-4 mr-1" />
            New Assessment
          </Link>
        </div>
        <div className="card-body">
          {assessments.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No assessments yet</p>
              <Link to={`/assessments/new?vendor=${id}`} className="btn btn-primary">
                Create First Assessment
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <Link
                  key={assessment.id}
                  to={`/assessments/${assessment.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{assessment.name}</h3>
                      {assessment.description && (
                        <p className="text-sm text-gray-600 mt-1">{assessment.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Started {formatDate(assessment.created_at)}
                        {assessment.completed_at && ` • Completed ${formatDate(assessment.completed_at)}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <span className={`badge ${getStatusColor(assessment.status)}`}>
                        {assessment.status.replace('_', ' ')}
                      </span>
                      {assessment.overall_score !== null && assessment.overall_score !== undefined && (
                        <span className="text-lg font-bold text-gray-900">
                          {assessment.overall_score.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
