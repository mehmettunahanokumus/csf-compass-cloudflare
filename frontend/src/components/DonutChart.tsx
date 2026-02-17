/**
 * Donut Chart Component
 * SVG-based donut chart for compliance visualization
 */

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerText?: string;
  centerSubtext?: string;
}

export default function DonutChart({
  segments,
  size = 200,
  strokeWidth = 30,
  centerText,
  centerSubtext,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const centerX = size / 2;
  const centerY = size / 2;

  // Calculate total value
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);

  // Calculate segment angles and paths
  let currentAngle = -90; // Start at top
  const segmentData = segments.map((segment) => {
    const percentage = segment.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    // Calculate stroke-dasharray for this segment
    const segmentLength = (angle / 360) * circumference;

    return {
      ...segment,
      percentage,
      angle,
      startAngle,
      segmentLength,
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />

        {/* Segments */}
        {segmentData.map((segment, index) => {
          let offset = 0;
          for (let i = 0; i < index; i++) {
            offset += segmentData[i].segmentLength;
          }

          return (
            <circle
              key={segment.label}
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.segmentLength} ${circumference - segment.segmentLength}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          );
        })}

        {/* Center text */}
        {centerText && (
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="central"
            className="font-display font-bold text-3xl transform rotate-90"
            fill="#F0F0F5"
            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
          >
            {centerText}
          </text>
        )}

        {centerSubtext && (
          <text
            x={centerX}
            y={centerY + 20}
            textAnchor="middle"
            dominantBaseline="central"
            className="font-sans text-sm transform rotate-90"
            fill="#8E8FA8"
            style={{ transformOrigin: `${centerX}px ${centerY + 20}px` }}
          >
            {centerSubtext}
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="mt-5 space-y-2.5 w-full">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="font-sans text-xs text-[#8E8FA8]">{segment.label}</span>
            </div>
            <span className="font-mono text-xs font-semibold text-[#F0F0F5] tabular-nums">
              {segment.value}{' '}
              <span className="text-[#55576A] font-normal">
                ({((segment.value / total) * 100).toFixed(1)}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
