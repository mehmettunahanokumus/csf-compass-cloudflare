import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: string | number;
    positive: boolean;
  };
  subtitle?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  iconColor = "text-amber-400",
  trend,
  subtitle,
  className = "",
}: MetricCardProps) {
  return (
    <div
      className={`bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 hover:border-amber-500/15 transition-all ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="font-sans text-xs text-[#8E8FA8]">{label}</p>
          <p className="font-display text-2xl font-bold text-[#F0F0F5] tabular-nums">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 text-xs">
              {trend.positive ? (
                <TrendingUp className="h-3 w-3 text-emerald-400" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-400" />
              )}
              <span className={`font-mono text-[11px] font-medium ${trend.positive ? "text-emerald-400" : "text-red-400"}`}>
                {trend.value}
              </span>
            </div>
          )}
          {subtitle && (
            <p className="font-sans text-[11px] text-[#55576A]">{subtitle}</p>
          )}
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export type { MetricCardProps };
