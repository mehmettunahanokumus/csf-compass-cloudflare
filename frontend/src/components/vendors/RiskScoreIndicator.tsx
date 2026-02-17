interface RiskScoreIndicatorProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreColor(score: number): { bar: string; text: string } {
  if (score < 30) return { bar: '#10B981', text: 'text-emerald-400' };
  if (score <= 60) return { bar: '#F59E0B', text: 'text-amber-400' };
  return { bar: '#EF4444', text: 'text-red-400' };
}

const sizeConfig = {
  sm: { barWidth: 'w-16', barHeight: 'h-1', fontSize: 'text-xs', gap: 'gap-2' },
  md: { barWidth: 'w-20', barHeight: 'h-1.5', fontSize: 'text-sm', gap: 'gap-2.5' },
  lg: { barWidth: 'w-28', barHeight: 'h-2', fontSize: 'text-base', gap: 'gap-3' },
};

export default function RiskScoreIndicator({ score, size = 'md' }: RiskScoreIndicatorProps) {
  const colors = getScoreColor(score);
  const config = sizeConfig[size];
  const clampedScore = Math.min(100, Math.max(0, score));

  return (
    <div className={`inline-flex items-center ${config.gap}`}>
      {/* Score number */}
      <span className={`font-mono ${config.fontSize} font-bold tabular-nums ${colors.text}`}>
        {Math.round(clampedScore)}
      </span>

      {/* Horizontal bar */}
      <div className={`${config.barWidth} ${config.barHeight} bg-white/[0.06] rounded-full overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${clampedScore}%`, background: colors.bar }}
        />
      </div>
    </div>
  );
}
