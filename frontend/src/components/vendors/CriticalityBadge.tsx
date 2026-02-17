interface CriticalityBadgeProps {
  level: 'low' | 'medium' | 'high' | 'critical';
  size?: 'sm' | 'md';
}

const colorMap: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400',
  high: 'bg-amber-500/10 text-amber-400',
  medium: 'bg-indigo-500/10 text-indigo-400',
  low: 'bg-emerald-500/10 text-emerald-400',
};

const sizeMap = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-[11px] px-2.5 py-1',
};

export default function CriticalityBadge({ level, size = 'md' }: CriticalityBadgeProps) {
  const colorClass = colorMap[level] || colorMap.low;
  const sizeClass = sizeMap[size];
  const label = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <span className={`inline-block font-sans font-semibold uppercase tracking-wider rounded-full whitespace-nowrap ${colorClass} ${sizeClass}`}>
      {label}
    </span>
  );
}
