import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  FileCheck,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Send,
  Building2,
} from "lucide-react";
import { assessmentsApi } from "@/api/assessments";
import type { Assessment } from "@/types";
import { getErrorMessage } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/components/ui/utils";

function getStatusBadge(status: Assessment["status"]) {
  const configs = {
    draft: { label: "Draft", className: "bg-muted/50 text-muted-foreground border-muted" },
    in_progress: { label: "In Progress", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
    completed: { label: "Completed", className: "bg-green-500/10 text-green-400 border-green-500/20" },
    archived: { label: "Archived", className: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  };
  const config = configs[status];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function getTypeBadge(type: Assessment["assessment_type"]) {
  if (type === "organization") {
    return (
      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
        <FileCheck className="h-3 w-3" />
        Organization
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
      <Building2 className="h-3 w-3" />
      Vendor
    </Badge>
  );
}

function AssessmentCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-1 w-full" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-20" />
        </div>
      </CardContent>
    </Card>
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
  const scoreColor = score >= 70 ? "text-green-500" : score >= 40 ? "text-yellow-500" : "text-red-500";
  const barColor = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";

  return (
    <Card
      className="bg-card border-border hover:border-border/80 hover:shadow-md transition-all cursor-pointer"
      onClick={onView}
    >
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm truncate flex-1">{assessment.name}</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={onView}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {assessment.assessment_type === "vendor" && (
                <DropdownMenuItem onClick={onSendToVendor}>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Vendor
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Type + Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {getTypeBadge(assessment.assessment_type)}
          {getStatusBadge(assessment.status)}
        </div>

        {/* Score */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Score</span>
            <span className={cn("text-sm font-semibold tabular-nums", scoreColor)}>
              {score > 0 ? `${score.toFixed(1)}%` : "N/A"}
            </span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", barColor)}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
          <span>
            {new Date(assessment.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {assessment.vendor && (
            <span className="truncate ml-2">{assessment.vendor.name}</span>
          )}
        </div>
      </CardContent>
    </Card>
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
      (filterTab === "draft" && a.status === "draft") ||
      (filterTab === "in_progress" && a.status === "in_progress") ||
      (filterTab === "completed" && (a.status === "completed" || a.status === "archived"));
    return matchesSearch && matchesTab;
  });

  // Counts
  const draftCount = assessments.filter((a) => a.status === "draft").length;
  const inProgressCount = assessments.filter((a) => a.status === "in_progress").length;
  const completedCount = assessments.filter(
    (a) => a.status === "completed" || a.status === "archived"
  ).length;

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
          <h1 className="text-2xl font-bold">Assessments</h1>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{assessments.length}</span> total
          </p>
        </div>
        <Button onClick={() => navigate("/assessments/new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Assessment
        </Button>
      </div>

      {/* Tabs + Search */}
      <Tabs value={filterTab} onValueChange={setFilterTab}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList>
            <TabsTrigger value="all">All ({assessments.length})</TabsTrigger>
            <TabsTrigger value="draft">Draft ({draftCount})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({inProgressCount})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
          </TabsList>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Content for all tabs renders the same grid, just filtered differently */}
        {["all", "draft", "in_progress", "completed"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <AssessmentCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredAssessments.length === 0 ? (
              <Card className="bg-card border-border">
                <CardContent className="p-16 text-center">
                  <FileCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || filterTab !== "all"
                      ? "No assessments match your filters"
                      : "No assessments yet"}
                  </p>
                  <Button onClick={() => navigate("/assessments/new")}>
                    Create Your First Assessment
                  </Button>
                </CardContent>
              </Card>
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
