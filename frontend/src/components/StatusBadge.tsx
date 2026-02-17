import { Circle, XCircle, CircleDot, CheckCircle2, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/utils";

type AssessmentItemStatus = "not_assessed" | "not_met" | "partially_met" | "met";

interface StatusConfig {
  icon: LucideIcon;
  label: string;
  className: string;
}

const statusConfigs: Record<AssessmentItemStatus, StatusConfig> = {
  not_assessed: {
    icon: Circle,
    label: "Not Assessed",
    className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  },
  not_met: {
    icon: XCircle,
    label: "Not Met",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  partially_met: {
    icon: CircleDot,
    label: "Partially Met",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  met: {
    icon: CheckCircle2,
    label: "Met",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
};

interface StatusBadgeProps {
  status: AssessmentItemStatus;
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
}

export function StatusBadge({
  status,
  showIcon = true,
  showText = true,
  className,
}: StatusBadgeProps) {
  const config = statusConfigs[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn(config.className, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {showText && config.label}
    </Badge>
  );
}

export type { AssessmentItemStatus, StatusBadgeProps };
