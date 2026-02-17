/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent - Amber Gold
        primary: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          dim: 'var(--accent-dim)',
          glow: 'var(--accent-glow)',
        },

        // Amber
        amber: {
          DEFAULT: '#F59E0B',
          dim: 'rgba(245,158,11,0.12)',
          glow: 'rgba(245,158,11,0.3)',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
          950: '#1C0A00',
        },

        // Jade Green
        jade: {
          DEFAULT: '#10B981',
          dim: 'rgba(16,185,129,0.12)',
          glow: 'rgba(16,185,129,0.2)',
        },

        // Legacy cyber palette (keep for compatibility)
        cyber: {
          DEFAULT: '#F59E0B',
          dim: 'rgba(245,158,11,0.12)',
          glow: 'rgba(245,158,11,0.3)',
          green: '#10B981',
          red: '#EF4444',
        },

        // Surfaces
        ground: 'var(--ground)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        card: {
          DEFAULT: 'var(--card)',
          elevated: 'var(--card-elevated)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
        },

        // Text
        text: {
          1: 'var(--text-1)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
          inverse: 'var(--text-inverse)',
        },

        // Borders
        border: {
          DEFAULT: 'var(--border)',
          muted: 'var(--border-muted)',
          accent: 'var(--border-accent)',
        },

        // Accent
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          dim: 'var(--accent-dim)',
          glow: 'var(--accent-glow)',
        },

        // Status Colors
        status: {
          met: 'var(--status-met)',
          'met-bg': 'var(--status-met-bg)',
          'met-text': 'var(--status-met-text)',
          partial: 'var(--status-partial)',
          'partial-bg': 'var(--status-partial-bg)',
          'partial-text': 'var(--status-partial-text)',
          'not-met': 'var(--status-not-met)',
          'not-met-bg': 'var(--status-not-met-bg)',
          'not-met-text': 'var(--status-not-met-text)',
          draft: 'var(--status-draft)',
          'draft-bg': 'var(--status-draft-bg)',
          inprogress: 'var(--status-inprogress)',
          'inprogress-bg': 'var(--status-inprogress-bg)',
          critical: 'var(--status-critical)',
          success: 'var(--status-success)',
          'success-bg': 'var(--status-success-bg)',
          'success-text': 'var(--status-success-text)',
          warning: 'var(--status-warning)',
          'warning-bg': 'var(--status-warning-bg)',
          'warning-text': 'var(--status-warning-text)',
          danger: 'var(--status-danger)',
          'danger-bg': 'var(--status-danger-bg)',
          'danger-text': 'var(--status-danger-text)',
          info: 'var(--status-info)',
          'info-bg': 'var(--status-info-bg)',
          'info-text': 'var(--status-info-text)',
        },
      },
      boxShadow: {
        'xs': 'var(--shadow-xs)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        '2xl': 'var(--shadow-2xl)',
        'accent': 'var(--shadow-accent)',
        'green': 'var(--shadow-green)',
        'red': 'var(--shadow-red)',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out both',
        'shimmer': 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
