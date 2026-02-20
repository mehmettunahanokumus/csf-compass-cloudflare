interface CsfLogoProps {
  size?: number;
  className?: string;
}

/**
 * CSF Compass brand logo — shield with gradient and "C" lettermark.
 * Use in sidebar header, report covers, etc.
 */
export function CsfLogo({ size = 28, className }: CsfLogoProps) {
  const id = `csf-logo-grad-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CSF Compass"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="110%">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect x="1" y="1" width="30" height="30" rx="7" ry="7" fill={`url(#${id})`} />

      {/* Shield shape — subtle overlay */}
      <path
        d="M16 6.5 L23.5 9.8 L23.5 17.2 C23.5 21.4 20.2 24.2 16 25.5 C11.8 24.2 8.5 21.4 8.5 17.2 L8.5 9.8 Z"
        fill="rgba(255,255,255,0.13)"
      />

      {/* "C" lettermark */}
      <text
        x="16"
        y="22"
        textAnchor="middle"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"
        fontSize="14"
        fontWeight="700"
        fill="white"
        letterSpacing="-0.5"
      >
        C
      </text>
    </svg>
  );
}
