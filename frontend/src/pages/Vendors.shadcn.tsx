import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Building2,
  Search,
  Trophy,
  Layout,
} from "lucide-react";
import { vendorsApi } from "@/api/vendors";
import type { Vendor } from "@/types";
import { getErrorMessage, formatDate } from "@/api/client";
import NewVendorModal from "@/components/NewVendorModal";

export default function VendorsShadcn() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [filterRiskTier, setFilterRiskTier] = useState("all");

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

  const handleDelete = async (vendor: Vendor) => {
    try {
      await vendorsApi.delete(vendor.id);
      setVendors(vendors.filter((v) => v.id !== vendor.id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const filteredVendors = vendors
    .filter(
      (vendor) =>
        (vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.industry?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterRiskTier === "all" || vendor.risk_tier === filterRiskTier)
    )
    .sort((a, b) => {
      const tierOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      const aTier = tierOrder[a.risk_tier || "medium"] ?? 999;
      const bTier = tierOrder[b.risk_tier || "medium"] ?? 999;
      return aTier - bTier;
    });

  // Stats
  const highRisk = vendors.filter((v) => (v.latest_assessment_score ?? 100) < 50);
  const critical = vendors.filter(
    (v) => v.criticality_level === "critical" || v.risk_tier === "critical"
  );
  const avgScore =
    vendors.length > 0
      ? vendors.reduce((sum, v) => sum + (v.latest_assessment_score ?? 0), 0) / vendors.length
      : 0;

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <p className="font-sans text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Vendors</h1>
          <p className="font-sans text-sm text-[#8E8FA8] mt-1">
            Third-party security posture management
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-4 hover:border-amber-500/15 transition-all">
          <div className="font-display text-2xl font-bold text-amber-400 tabular-nums mb-1">
            {loading ? '—' : vendors.length}
          </div>
          <div className="font-sans text-xs text-[#8E8FA8]">Total Vendors</div>
        </div>
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-4 hover:border-amber-500/15 transition-all">
          <div className="font-display text-2xl font-bold text-red-400 tabular-nums mb-1">
            {loading ? '—' : highRisk.length}
          </div>
          <div className="font-sans text-xs text-[#8E8FA8]">High Risk</div>
        </div>
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-4 hover:border-amber-500/15 transition-all">
          <div className={`font-display text-2xl font-bold tabular-nums mb-1 ${
            avgScore >= 80 ? 'text-emerald-400' :
            avgScore >= 50 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {loading ? '—' : avgScore > 0 ? `${avgScore.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="font-sans text-xs text-[#8E8FA8]">Average Score</div>
        </div>
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-4 hover:border-amber-500/15 transition-all">
          <div className="font-display text-2xl font-bold text-amber-400 tabular-nums mb-1">
            {loading ? '—' : critical.length}
          </div>
          <div className="font-sans text-xs text-[#8E8FA8]">Critical</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => navigate("/vendors/ranking")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all"
        >
          <Trophy className="w-3.5 h-3.5" />
          View Rankings
        </button>
        <button
          onClick={() => navigate("/vendors/templates")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-sm rounded-lg hover:border-amber-500/30 hover:text-[#F0F0F5] transition-all"
        >
          <Layout className="w-3.5 h-3.5" />
          Manage Templates
        </button>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#55576A]" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/[0.04] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] placeholder-[#55576A] focus:outline-none focus:border-amber-500/40 transition-colors"
          />
        </div>

        {/* Criticality filter chips */}
        <div className="flex items-center gap-1.5">
          {['all', 'critical', 'high', 'medium', 'low'].map((level) => (
            <button
              key={level}
              onClick={() => setFilterRiskTier(level)}
              className={`px-3 py-1.5 rounded-lg font-sans text-xs font-medium transition-colors ${
                filterRiskTier === level
                  ? 'bg-amber-500 text-[#08090E]'
                  : 'bg-white/[0.04] text-[#8E8FA8] hover:bg-white/[0.07]'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Table */}
      {loading ? (
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-white/[0.06] rounded" />
                  <div className="h-3 w-24 bg-white/[0.04] rounded" />
                </div>
                <div className="h-5 w-16 bg-white/[0.06] rounded-full" />
                <div className="h-4 w-24 bg-white/[0.06] rounded" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left px-5 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Vendor</th>
                <th className="text-left px-4 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Industry</th>
                <th className="text-left px-4 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Criticality</th>
                <th className="text-left px-4 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Risk Score</th>
                <th className="text-left px-4 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Last Assessment</th>
                <th className="text-right px-5 py-3.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="border-b border-white/[0.04] hover:bg-amber-500/[0.03] transition-colors"
                >
                  {/* Vendor name + initials */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0">
                        <span className="font-display text-xs font-bold text-amber-400">
                          {vendor.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <Link to={`/vendors/${vendor.id}`}>
                          <span className="font-sans text-sm font-medium text-[#F0F0F5] hover:text-amber-400 transition-colors">
                            {vendor.name}
                          </span>
                        </Link>
                        {vendor.contact_email && (
                          <div className="font-mono text-[10px] text-[#55576A]">{vendor.contact_email}</div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Industry */}
                  <td className="px-4 py-4">
                    <span className="font-sans text-sm text-[#8E8FA8]">{vendor.industry ?? '—'}</span>
                  </td>

                  {/* Criticality badge */}
                  <td className="px-4 py-4">
                    {(vendor.risk_tier || vendor.criticality_level) ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-[11px] font-medium uppercase tracking-wide border ${
                        (vendor.risk_tier || vendor.criticality_level) === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        (vendor.risk_tier || vendor.criticality_level) === 'high' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        (vendor.risk_tier || vendor.criticality_level) === 'medium' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {vendor.risk_tier || vendor.criticality_level || 'medium'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-sans text-[11px] font-medium uppercase tracking-wide border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        medium
                      </span>
                    )}
                  </td>

                  {/* Risk score bar */}
                  <td className="px-4 py-4">
                    {vendor.latest_assessment_score != null && vendor.latest_assessment_score > 0 ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-24 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${vendor.latest_assessment_score}%`,
                              background: vendor.latest_assessment_score < 30 ? '#EF4444' :
                                          vendor.latest_assessment_score < 60 ? '#F59E0B' : '#10B981'
                            }}
                          />
                        </div>
                        <span className={`font-display text-sm font-semibold tabular-nums ${
                          vendor.latest_assessment_score < 30 ? 'text-red-400' :
                          vendor.latest_assessment_score < 60 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {vendor.latest_assessment_score}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[#55576A] font-sans text-sm">—</span>
                    )}
                  </td>

                  {/* Last Assessment */}
                  <td className="px-4 py-4">
                    <span className="font-sans text-sm text-[#8E8FA8]">
                      {vendor.last_assessment_date ? formatDate(vendor.last_assessment_date) : 'Never'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link to={`/vendors/${vendor.id}`}>
                        <button className="font-sans text-xs text-[#8E8FA8] hover:text-amber-400 px-3 py-1.5 border border-white/[0.07] hover:border-amber-500/30 rounded-lg transition-all">
                          View
                        </button>
                      </Link>
                      <button
                        onClick={() => navigate(`/vendors/${vendor.id}/edit`)}
                        className="font-sans text-xs text-[#8E8FA8] hover:text-[#F0F0F5] px-3 py-1.5 border border-white/[0.07] hover:border-white/[0.15] rounded-lg transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vendor)}
                        className="font-sans text-xs text-[#55576A] hover:text-red-400 px-3 py-1.5 border border-white/[0.07] hover:border-red-500/30 rounded-lg transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty state */}
          {filteredVendors.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5 text-amber-500/50" />
              </div>
              <p className="font-display text-sm font-semibold text-[#F0F0F5] mb-1">No vendors found</p>
              <p className="font-sans text-xs text-[#8E8FA8]">
                {searchTerm || filterRiskTier !== 'all' ? 'Try a different search term' : 'Add your first vendor to get started'}
              </p>
              {!searchTerm && filterRiskTier === 'all' && (
                <button
                  onClick={() => setShowNewModal(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Add Your First Vendor
                </button>
              )}
            </div>
          )}
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
