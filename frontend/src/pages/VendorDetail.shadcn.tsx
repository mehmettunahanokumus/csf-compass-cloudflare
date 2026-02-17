import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, ClipboardList, Globe, Mail, User, Phone, Plus } from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import { assessmentsApi } from '../api/assessments';
import type { Vendor, Assessment, VendorStats } from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    website: '',
    contact_email: '',
    contact_name: '',
    description: '',
    risk_level: 'medium' as 'low' | 'medium' | 'high',
    risk_tier: 'medium' as 'low' | 'medium' | 'high' | 'critical',
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
      setAssessments(assessmentsData.filter((a) => a.vendor_id === id));
      setEditForm({
        name: vendorData.name,
        website: vendorData.website || '',
        contact_email: vendorData.contact_email || '',
        contact_name: vendorData.contact_name || '',
        description: vendorData.description || '',
        risk_level: vendorData.risk_level || 'medium',
        risk_tier: vendorData.risk_tier || 'medium',
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
    if (!id) return;
    try {
      await vendorsApi.delete(id);
      navigate('/vendors');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in-up space-y-6">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-14 bg-white/[0.06] rounded animate-pulse" />
          <span className="text-[#55576A] text-xs">/</span>
          <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse" />
        </div>
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/[0.06]" />
            <div className="space-y-2">
              <div className="h-6 w-48 bg-white/[0.06] rounded" />
              <div className="h-3 w-32 bg-white/[0.04] rounded" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-4 animate-pulse">
              <div className="h-8 w-16 bg-white/[0.06] rounded mb-1" />
              <div className="h-3 w-24 bg-white/[0.04] rounded" />
            </div>
          ))}
        </div>
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6 animate-pulse">
          <div className="h-40 w-full bg-white/[0.04] rounded" />
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="font-sans text-sm text-red-400">{error || 'Vendor not found'}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5">
        <Link to="/vendors" className="font-sans text-xs text-[#55576A] hover:text-[#8E8FA8] transition-colors">
          Vendors
        </Link>
        <span className="text-[#55576A] text-xs">/</span>
        <span className="font-sans text-xs text-[#8E8FA8]">{vendor.name}</span>
      </div>

      {/* Vendor header card */}
      <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Large avatar */}
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
              <span className="font-display text-xl font-bold text-amber-400">
                {vendor.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-[#F0F0F5] mb-1">{vendor.name}</h1>
              <div className="flex items-center gap-2.5">
                {vendor.industry && (
                  <span className="font-sans text-xs text-[#8E8FA8]">{vendor.industry}</span>
                )}
                {(vendor.risk_tier || vendor.criticality_level) && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-sans text-[10px] font-medium uppercase tracking-wide border ${
                    (vendor.risk_tier || vendor.criticality_level) === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    (vendor.risk_tier || vendor.criticality_level) === 'high' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                    (vendor.risk_tier || vendor.criticality_level) === 'medium' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {vendor.risk_tier || vendor.criticality_level || 'medium'}
                  </span>
                )}
                {vendor.last_assessment_date && (
                  <span className="font-sans text-[11px] text-[#55576A]">
                    Last assessed {formatDate(vendor.last_assessment_date)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] text-[#55576A] font-sans text-sm rounded-lg hover:border-red-500/30 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </>
            )}
            <Link to={`/assessments/new?vendor=${id}`}>
              <button className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors">
                <Plus className="w-3.5 h-3.5" />
                New Assessment
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Edit Vendor
            </h2>
          </div>
          <form onSubmit={handleEdit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Vendor Name *</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] placeholder-[#55576A] focus:outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Risk Tier</label>
                <select
                  value={editForm.risk_tier}
                  onChange={(e) => setEditForm({ ...editForm, risk_tier: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] focus:outline-none focus:border-amber-500/40 transition-colors appearance-none"
                >
                  <option value="low" className="bg-[#0E1018]">Low</option>
                  <option value="medium" className="bg-[#0E1018]">Medium</option>
                  <option value="high" className="bg-[#0E1018]">High</option>
                  <option value="critical" className="bg-[#0E1018]">Critical</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Risk Level (Technical)</label>
                <select
                  value={editForm.risk_level}
                  onChange={(e) => setEditForm({ ...editForm, risk_level: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] focus:outline-none focus:border-amber-500/40 transition-colors appearance-none"
                >
                  <option value="low" className="bg-[#0E1018]">Low Risk</option>
                  <option value="medium" className="bg-[#0E1018]">Medium Risk</option>
                  <option value="high" className="bg-[#0E1018]">High Risk</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Website</label>
                <input
                  type="url"
                  value={editForm.website}
                  onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] placeholder-[#55576A] focus:outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Contact Email</label>
                <input
                  type="email"
                  value={editForm.contact_email}
                  onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                  placeholder="contact@vendor.com"
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] placeholder-[#55576A] focus:outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Contact Name</label>
                <input
                  value={editForm.contact_name}
                  onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] placeholder-[#55576A] focus:outline-none focus:border-amber-500/40 transition-colors"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="font-display text-[10px] tracking-[0.08em] uppercase text-[#8E8FA8] font-semibold">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of the vendor's services..."
                  className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] placeholder-[#55576A] focus:outline-none focus:border-amber-500/40 transition-colors resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-white/[0.06]">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
              >
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
                    risk_tier: vendor.risk_tier || 'medium',
                  });
                }}
                className="inline-flex items-center px-4 py-2 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-white/[0.15] hover:text-[#F0F0F5] transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contact & Risk Info - shown when not editing */}
      {!editing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Contact Information */}
          <div className="lg:col-span-2 bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
              <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
                Contact Information
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 text-[#55576A]" />
                </div>
                <div>
                  <p className="font-display text-[10px] tracking-[0.08em] uppercase text-[#55576A] font-semibold mb-1">Email</p>
                  {vendor.contact_email ? (
                    <a href={`mailto:${vendor.contact_email}`} className="font-sans text-sm text-amber-400 hover:text-amber-300 transition-colors">
                      {vendor.contact_email}
                    </a>
                  ) : (
                    <p className="font-sans text-sm text-[#55576A]">Not provided</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Globe className="w-3.5 h-3.5 text-[#55576A]" />
                </div>
                <div>
                  <p className="font-display text-[10px] tracking-[0.08em] uppercase text-[#55576A] font-semibold mb-1">Website</p>
                  {vendor.website ? (
                    <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="font-sans text-sm text-amber-400 hover:text-amber-300 transition-colors">
                      {vendor.website}
                    </a>
                  ) : (
                    <p className="font-sans text-sm text-[#55576A]">Not provided</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-[#55576A]" />
                </div>
                <div>
                  <p className="font-display text-[10px] tracking-[0.08em] uppercase text-[#55576A] font-semibold mb-1">Phone</p>
                  {vendor.contact_phone ? (
                    <a href={`tel:${vendor.contact_phone}`} className="font-sans text-sm text-amber-400 hover:text-amber-300 transition-colors">
                      {vendor.contact_phone}
                    </a>
                  ) : (
                    <p className="font-sans text-sm text-[#55576A]">Not provided</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-[#55576A]" />
                </div>
                <div>
                  <p className="font-display text-[10px] tracking-[0.08em] uppercase text-[#55576A] font-semibold mb-1">Contact Name</p>
                  <p className="font-sans text-sm text-[#F0F0F5]">{vendor.contact_name || 'Not provided'}</p>
                </div>
              </div>
              {vendor.description && (
                <div className="sm:col-span-2">
                  <p className="font-display text-[10px] tracking-[0.08em] uppercase text-[#55576A] font-semibold mb-1">Description</p>
                  <p className="font-sans text-sm text-[#8E8FA8] leading-relaxed">{vendor.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Risk Score card */}
          <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6 flex flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-3 w-full mb-2">
              <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
              <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
                Risk Score
              </h2>
            </div>
            <div className={`font-display text-5xl font-bold tabular-nums ${
              (vendor.latest_assessment_score ?? 0) >= 80 ? 'text-emerald-400' :
              (vendor.latest_assessment_score ?? 0) >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {vendor.latest_assessment_score != null ? `${vendor.latest_assessment_score}%` : '—'}
            </div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-[11px] font-medium uppercase tracking-wide border ${
              (vendor.risk_tier || vendor.criticality_level || 'medium') === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
              (vendor.risk_tier || vendor.criticality_level || 'medium') === 'high' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              (vendor.risk_tier || vendor.criticality_level || 'medium') === 'medium' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {vendor.risk_tier || vendor.criticality_level || 'medium'} risk
            </span>
            {vendor.last_assessment_date && (
              <p className="font-sans text-[11px] text-[#55576A]">
                Last assessed: {formatDate(vendor.last_assessment_date)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Stats row - 4 cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-4 hover:border-amber-500/15 transition-all">
            <div className="font-display text-2xl font-bold text-amber-400 tabular-nums mb-1">
              {stats.totalAssessments ?? 0}
            </div>
            <div className="font-sans text-xs text-[#8E8FA8]">Total Assessments</div>
          </div>
          <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-4 hover:border-amber-500/15 transition-all">
            <div className="font-display text-2xl font-bold text-emerald-400 tabular-nums mb-1">
              {stats.completedAssessments ?? 0}
            </div>
            <div className="font-sans text-xs text-[#8E8FA8]">Completed</div>
          </div>
          <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-4 hover:border-amber-500/15 transition-all">
            <div className="font-display text-2xl font-bold text-indigo-400 tabular-nums mb-1">
              {stats.inProgressAssessments ?? 0}
            </div>
            <div className="font-sans text-xs text-[#8E8FA8]">In Progress</div>
          </div>
          <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-4 hover:border-amber-500/15 transition-all">
            <div className={`font-display text-2xl font-bold tabular-nums mb-1 ${
              (stats.averageScore ?? 0) >= 80 ? 'text-emerald-400' :
              (stats.averageScore ?? 0) >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {stats.averageScore != null ? `${stats.averageScore.toFixed(1)}%` : '—'}
            </div>
            <div className="font-sans text-xs text-[#8E8FA8]">Avg Score</div>
          </div>
        </div>
      )}

      {/* Assessment History */}
      <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Assessment History
            </h2>
          </div>
          <Link to={`/assessments/new?vendor=${id}`}>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-xs rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all">
              <ClipboardList className="w-3 h-3" />
              New Assessment
            </button>
          </Link>
        </div>

        {assessments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mb-3">
              <ClipboardList className="w-5 h-5 text-amber-500/50" />
            </div>
            <p className="font-display text-sm font-semibold text-[#F0F0F5] mb-1">No assessments yet</p>
            <p className="font-sans text-xs text-[#8E8FA8] mb-4">Create the first assessment for this vendor</p>
            <Link to={`/assessments/new?vendor=${id}`}>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors">
                Create First Assessment
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {assessments.map((assessment) => (
              <Link key={assessment.id} to={`/assessments/${assessment.id}`} className="block group">
                <div className="flex justify-between items-center gap-4 p-4 rounded-lg border border-white/[0.04] hover:border-amber-500/20 hover:bg-amber-500/[0.02] transition-all">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-sans text-sm font-medium text-[#F0F0F5] group-hover:text-amber-400 transition-colors">
                      {assessment.name}
                    </h3>
                    {assessment.description && (
                      <p className="font-sans text-xs text-[#55576A] mt-0.5 truncate">{assessment.description}</p>
                    )}
                    <p className="font-mono text-[10px] text-[#55576A] mt-1">
                      Started {formatDate(assessment.created_at)}
                      {assessment.completed_at && ` \u00B7 Completed ${formatDate(assessment.completed_at)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-[11px] font-medium border ${
                      assessment.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : assessment.status === 'in_progress'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : 'bg-white/[0.04] text-[#8E8FA8] border-white/[0.07]'
                    }`}>
                      {assessment.status === 'in_progress' ? 'In Progress' : assessment.status}
                    </span>
                    {assessment.overall_score != null && (
                      <span className={`font-display text-lg font-bold tabular-nums ${
                        assessment.overall_score >= 80 ? 'text-emerald-400' :
                        assessment.overall_score >= 50 ? 'text-amber-400' : 'text-red-400'
                      }`}>
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

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Vendor?"
        description="This will permanently delete this vendor and all associated assessments. This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
