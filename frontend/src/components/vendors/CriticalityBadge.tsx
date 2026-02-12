interface CriticalityBadgeProps {
  level: 'low' | 'medium' | 'high' | 'critical';
  size?: 'sm' | 'md';
}

const colorMap = {
  low: { bg: '#dcfce7', text: '#166534' },
  medium: { bg: '#fef3c7', text: '#92400e' },
  high: { bg: '#ffedd5', text: '#9a3412' },
  critical: { bg: '#fecaca', text: '#991b1b' },
};

const sizeMap = {
  sm: { fontSize: 11, padding: '2px 8px' },
  md: { fontSize: 13, padding: '4px 12px' },
};

export default function CriticalityBadge({ level, size = 'md' }: CriticalityBadgeProps) {
  const colors = colorMap[level];
  const sizing = sizeMap[size];
  const label = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 9999,
        background: colors.bg,
        color: colors.text,
        fontSize: sizing.fontSize,
        fontWeight: 600,
        padding: sizing.padding,
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
