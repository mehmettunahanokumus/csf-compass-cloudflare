import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Search,
  Shield,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";
import { assessmentsApi } from "@/api/assessments";
import type { Assessment } from "@/types";
import { getErrorMessage } from "@/api/client";

function getStatusBadge(status: Assessment["status"]) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-400",
    in_progress: "bg-indigo-500/10 text-indigo-400",
    draft: "bg-white/[0.06] text-[#8E8FA8]",
    archived: "bg-white/[0.04] text-[#55576A]",
  };
  const labels: Record<string, string> = {
    completed: "Completed",
    in_progress: "In Progress",
    draft: "Draft",
    archived: "Archived",
  };
  return {
    className: styles[status] ?? styles.draft,
    label: labels[status] ?? status,
  };
}

function AssessmentCardSkeleton() {
  return (
    <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-16 bg-white/[0.06] rounded" />
        <div className="h-4 w-14 bg-white/[0.06] rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-white/[0.06] rounded mb-4" />
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-12 bg-white/[0.06] rounded" />
        <div className="flex-1 h-1.5 bg-white/[0.06] rounded-full" />
      </div>
      <div className="pt-3 border-t border-white/[0.05] flex justify-between">
        <div className="h-3 w-20 bg-white/[0.06] rounded" />
        <div className="h-3 w-10 bg-white/[0.06] rounded" />
      </div>
    </div>
  );
}

interface AssessmentCardProps {
  assessment: Assessment;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSendToVendor: () => void;
}

function AssessmentCard({ assessment, onView, onEdit, onDelete, onSendToVendor }: AssessmentCardProps) {
  const score = assessment.overall_score || 0;
  const statusBadge = getStatusBadge(assessment.status);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 hover:border-amber-500/20 hover:-translate-y-0.5 transition-all cursor-pointer group relative"
      onClick={onView}
    >
      {/* Top row: type badge + status badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[10px] bg-white/[0.05] text-[#8E8FA8] px-2 py-0.5 rounded uppercase tracking-wide">
          {assessment.assessment_type}
        </span>
        <div className="flex items-center gap-2">
          <span className={`font-sans text-[11px] font-medium px-2 py-0.5 rounded-full ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          {/* Dropdown menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md text-[#55576A] hover:text-[#8E8FA8] hover:bg-white/[0.04] transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-[#13151F] border border-white/[0.1] rounded-lg shadow-xl py-1">
                  <button
                    onClick={() => { onView(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 font-sans text-xs text-[#8E8FA8] hover:text-[#F0F0F5] hover:bg-white/[0.04] transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                  <button
                    onClick={() => { onEdit(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 font-sans text-xs text-[#8E8FA8] hover:text-[#F0F0F5] hover:bg-white/[0.04] transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  {assessment.assessment_type === "vendor" && (
                    <button
                      onClick={() => { onSendToVendor(); setMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 font-sans text-xs text-[#8E8FA8] hover:text-[#F0F0F5] hover:bg-white/[0.04] transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Send to Vendor
                    </button>
                  )}
                  <div className="my-1 border-t border-white/[0.06]" />
                  <button
                    onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 font-sans text-xs text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Name */}
      <h3 className="font-display text-base font-semibold text-[#F0F0F5] mb-1 group-hover:text-amber-400 transition-colors truncate">
        {assessment.name}
      </h3>

      {/* Vendor name if present */}
      {assessment.vendor && (
        <p className="font-sans text-xs text-[#55576A] mb-3 truncate">{assessment.vendor.name}</p>
      )}

      {/* Score + progress */}
      <div className="flex items-center gap-2 mb-4">
        <div className="font-display text-2xl font-bold text-amber-400 tabular-nums">
          {score > 0 ? `${score.toFixed(0)}` : "—"}
        </div>
        <div className="text-[#55576A] font-sans text-sm">/ 100</div>
        <div className="flex-1 ml-2 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${score}%`,
              background: score >= 80 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444",
            }}
          />
        </div>
      </div>

      {/* Footer: date + view */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <span className="font-mono text-[10px] text-[#55576A]">
          {new Date(assessment.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
        <span className="font-sans text-xs text-[#8E8FA8] group-hover:text-amber-400 transition-colors">
          View →
        </span>
      </div>
    </div>
  );
}

export default function AssessmentsShadcn() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await assessmentsApi.list();
      setAssessments(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await assessmentsApi.delete(id);
      setAssessments(assessments.filter((a) => a.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Filter by tab and search
  const filteredAssessments = assessments.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      filterTab === "all" ||
      (filterTab === "organization" && a.assessment_type === "organization") ||
      (filterTab === "vendor" && a.assessment_type === "vendor");
    return matchesSearch && matchesTab;
  });

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
          <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Assessments</h1>
          <p className="font-sans text-sm text-[#8E8FA8] mt-1">
            NIST CSF 2.0 security evaluations
            {assessments.length > 0 && (
              <span className="ml-2 font-mono text-[#55576A]">· {assessments.length} total</span>
            )}
          </p>
        </div>
        <Link to="/assessments/new">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors">
            <Plus className="w-4 h-4" />
            New Assessment
          </button>
        </Link>
      </div>

      {/* Filters row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Type filter tabs */}
        <div className="flex items-center gap-2">
          {["all", "organization", "vendor"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-sans text-sm font-medium transition-colors ${
                filterTab === tab
                  ? "bg-amber-500 text-[#08090E]"
                  : "bg-white/[0.04] text-[#8E8FA8] hover:bg-white/[0.07] hover:text-[#F0F0F5]"
              }`}
            >
              {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#55576A]" />
          <input
            type="text"
            placeholder="Search assessments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/[0.03] border border-white/[0.07] rounded-lg font-sans text-sm text-[#F0F0F5] placeholder:text-[#55576A] focus:outline-none focus:border-amber-500/30 transition-colors"
          />
        </div>
      </div>

      {/* Assessment grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <AssessmentCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredAssessments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-amber-500/50" />
          </div>
          <h3 className="font-display text-base font-semibold text-[#F0F0F5] mb-2">
            {searchTerm || filterTab !== "all" ? "No assessments match your filters" : "No assessments yet"}
          </h3>
          <p className="font-sans text-sm text-[#8E8FA8] text-center max-w-xs mb-6">
            {searchTerm || filterTab !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Create your first security assessment to start evaluating compliance"}
          </p>
          {!searchTerm && filterTab === "all" && (
            <Link to="/assessments/new">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors">
                <Plus className="w-4 h-4" />
                New Assessment
              </button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssessments.map((assessment) => (
            <AssessmentCard
              key={assessment.id}
              assessment={assessment}
              onView={() => navigate(`/assessments/${assessment.id}`)}
              onEdit={() => navigate(`/assessments/${assessment.id}`)}
              onDelete={() => handleDelete(assessment.id)}
              onSendToVendor={() => navigate(`/assessments/${assessment.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
