interface CompassLogoProps {
  size?: number;
  className?: string;
}

const CompassLogo = ({ size = 28, className }: CompassLogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 96 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-label="Compass"
  >
    <rect x="4" y="4" width="88" height="88" rx="20" fill="url(#compass-grad)"/>
    <path d="M48 22 L62 48 L48 48 Z" fill="#FCD34D" opacity="0.95"/>
    <path d="M48 48 L48 74 L34 48 Z" fill="#FCD34D" opacity="0.35"/>
    <circle cx="48" cy="48" r="4" fill="#FCD34D"/>
    <circle cx="48" cy="48" r="22" fill="none" stroke="#FCD34D" strokeWidth="1" opacity="0.15"/>
    <defs>
      <linearGradient id="compass-grad" x1="4" y1="4" x2="92" y2="92" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0F172A"/>
        <stop offset="100%" stopColor="#1E293B"/>
      </linearGradient>
    </defs>
  </svg>
);

export default CompassLogo;
