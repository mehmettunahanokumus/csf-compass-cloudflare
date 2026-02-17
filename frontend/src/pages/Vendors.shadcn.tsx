import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Building2,
  Eye,
  Pencil,
  Trash2,
  ClipboardList,
  AlertTriangle,
  ShieldAlert,
  BarChart3,
  Trophy,
  Layout,
} from "lucide-react";
import { vendorsApi } from "@/api/vendors";
import type { Vendor } from "@/types";
import { getErrorMessage, formatDate } from "@/api/client";
import { DataTable, type ColumnDef, type RowAction } from "@/components/DataTable";
import { MetricCard } from "@/components/MetricCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/components/ui/utils";
import NewVendorModal from "@/components/NewVendorModal";

function getCriticalityBadge(level: string) {
  const configs: Record<string, string> = {
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };
  return (
    <Badge variant="outline" className={cn(configs[level] || configs.medium, "capitalize")}>
      {level || "medium"}
    </Badge>
  );
}

function getRiskScoreDisplay(score: number | undefined) {
  if (!score || score === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  const color =
    score > 70 ? "text-red-500" : score > 40 ? "text-orange-500" : "text-green-500";
  return <span className={cn("font-semibold tabular-nums", color)}>{score}</span>;
}

function getStatusBadge(status: string | undefined) {
  const configs: Record<string, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-green-500/10 text-green-400 border-green-500/20" },
    inactive: { label: "Inactive", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
    under_review: { label: "Under Review", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
    terminated: { label: "Terminated", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const config = configs[status || "active"] || configs.active;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

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

  // DataTable columns
  const columns: ColumnDef<Vendor>[] = [
    {
      key: "name",
      header: "Vendor Name",
      render: (vendor) => (
        <Link
          to={`/vendors/${vendor.id}`}
          className="flex items-center gap-2 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-medium text-primary">
              {vendor.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <span className="font-medium block truncate">{vendor.name}</span>
            {vendor.industry && (
              <span className="text-xs text-muted-foreground">{vendor.industry}</span>
            )}
          </div>
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (vendor) => getStatusBadge(vendor.vendor_status),
    },
    {
      key: "risk_score",
      header: "Risk Score",
      render: (vendor) => getRiskScoreDisplay(vendor.latest_assessment_score),
    },
    {
      key: "criticality",
      header: "Criticality",
      render: (vendor) =>
        getCriticalityBadge(vendor.risk_tier || vendor.criticality_level || "medium"),
    },
    {
      key: "last_assessment",
      header: "Last Assessment",
      render: (vendor) => (
        <span className="text-muted-foreground text-sm">
          {vendor.last_assessment_date ? formatDate(vendor.last_assessment_date) : "Never"}
        </span>
      ),
    },
  ];

  // Row actions
  const rowActions: RowAction<Vendor>[] = [
    {
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (vendor) => navigate(`/vendors/${vendor.id}`),
    },
    {
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      onClick: (vendor) => navigate(`/vendors/${vendor.id}/edit`),
    },
    {
      label: "New Assessment",
      icon: <ClipboardList className="h-4 w-4" />,
      onClick: (vendor) => navigate(`/assessments/new?vendor=${vendor.id}`),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDelete,
      variant: "destructive",
    },
  ];

  if (error) {
    return (
      <Card className="border-destructive bg-destructive/10">
        <CardContent className="p-4 text-destructive">{error}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Vendors</h1>
          <p className="text-sm text-muted-foreground">
            Manage your third-party vendors (
            <span className="font-mono">{vendors.length}</span> total)
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Vendor
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Vendors"
          value={vendors.length}
          icon={Building2}
          iconColor="text-primary"
        />
        <MetricCard
          label="High Risk"
          value={highRisk.length}
          icon={AlertTriangle}
          iconColor="text-red-500"
        />
        <MetricCard
          label="Average Score"
          value={avgScore > 0 ? `${avgScore.toFixed(1)}%` : "N/A"}
          icon={BarChart3}
          iconColor="text-blue-500"
        />
        <MetricCard
          label="Critical"
          value={critical.length}
          icon={ShieldAlert}
          iconColor="text-orange-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => navigate("/vendors/ranking")}>
          <Trophy className="h-4 w-4 mr-2" />
          View Rankings
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate("/vendors/templates")}>
          <Layout className="h-4 w-4 mr-2" />
          Manage Templates
        </Button>
      </div>

      {/* Criticality Breakdown */}
      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4">Criticality Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["critical", "high", "medium", "low"] as const).map((level) => {
              const count = vendors.filter(
                (v) => (v.criticality_level || v.risk_tier || "medium") === level
              ).length;
              return (
                <div
                  key={level}
                  className="flex items-center justify-between p-3 rounded-md border border-border bg-secondary/20"
                >
                  {getCriticalityBadge(level)}
                  <span className="text-lg font-bold font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filter bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Select value={filterRiskTier} onValueChange={setFilterRiskTier}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Risk Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Tiers</SelectItem>
                <SelectItem value="critical">Critical Risk</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Table */}
      {loading ? (
        <DataTable
          title="All Vendors"
          data={[]}
          columns={columns}
          keyExtractor={(v) => v.id}
          loading={true}
          loadingRows={5}
        />
      ) : filteredVendors.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-16 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              {searchTerm || filterRiskTier !== "all"
                ? "No vendors match your filters"
                : "No vendors found"}
            </p>
            <Button onClick={() => setShowNewModal(true)}>Add Your First Vendor</Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          title="All Vendors"
          data={filteredVendors}
          columns={columns}
          rowActions={rowActions}
          keyExtractor={(v) => v.id}
          searchPlaceholder="Search vendors..."
          onSearch={setSearchTerm}
          searchValue={searchTerm}
        />
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
