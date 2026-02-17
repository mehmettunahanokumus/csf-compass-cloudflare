import { Circle, XCircle, CircleDot, CheckCircle2, type LucideIcon } from "lucide-react";

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
    className: "bg-white/[0.04] text-[#55576A] border-white/[0.07]",
  },
  not_met: {
    icon: XCircle,
    label: "Not Met",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  partially_met: {
    icon: CircleDot,
    label: "Partially Met",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  met: {
    icon: CheckCircle2,
    label: "Met",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
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
  className = "",
}: StatusBadgeProps) {
  const config = statusConfigs[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-sans text-[11px] font-medium border ${config.className} ${className}`}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {showText && config.label}
    </span>
  );
}

export type { AssessmentItemStatus, StatusBadgeProps };
