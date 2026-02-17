/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Primary accent – Violet ──────────────
        primary: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
          dim:     'var(--accent-dim)',
          glow:    'var(--accent-glow)',
        },

        // ── Violet scale ─────────────────────────
        violet: {
          DEFAULT: '#7C3AED',
          dim:     'rgba(124,58,237,0.10)',
          glow:    'rgba(124,58,237,0.25)',
          50:  '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },

        // ── Emerald (success / met) ───────────────
        emerald: {
          DEFAULT: '#059669',
          dim:     'rgba(5,150,105,0.08)',
          glow:    'rgba(5,150,105,0.2)',
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },

        // ── Legacy cyber aliases ──────────────────
        cyber: {
          DEFAULT: '#7C3AED',
          dim:     'rgba(124,58,237,0.10)',
          glow:    'rgba(124,58,237,0.25)',
          green:   '#059669',
          red:     '#DC2626',
        },

        // ── Legacy jade alias ─────────────────────
        jade: {
          DEFAULT: '#059669',
          dim:     'rgba(5,150,105,0.08)',
          glow:    'rgba(5,150,105,0.2)',
        },

        // ── Amber (warning only) ──────────────────
        amber: {
          DEFAULT: '#D97706',
          dim:     'rgba(217,119,6,0.08)',
          glow:    'rgba(217,119,6,0.2)',
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },

        // ── Surfaces ──────────────────────────────
        ground:  'var(--ground)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: '#D8E0ED',
        },
        card: {
          DEFAULT:  'var(--card)',
          elevated: 'var(--card-elevated)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
        },

        // ── Text ──────────────────────────────────
        text: {
          1:       'var(--text-1)',
          2:       'var(--text-2)',
          3:       'var(--text-3)',
          inverse: 'var(--text-inverse)',
        },

        // ── Borders ───────────────────────────────
        border: {
          DEFAULT: 'var(--border)',
          muted:   'var(--border-muted)',
          accent:  'var(--border-accent)',
        },

        // ── Accent alias ──────────────────────────
        accent: {
          DEFAULT: 'var(--accent)',
          hover:   'var(--accent-hover)',
          dim:     'var(--accent-dim)',
          glow:    'var(--accent-glow)',
        },

        // ── Status ────────────────────────────────
        status: {
          met:           'var(--status-met)',
          'met-bg':      'var(--status-met-bg)',
          'met-text':    'var(--status-met-text)',
          partial:       'var(--status-partial)',
          'partial-bg':  'var(--status-partial-bg)',
          'partial-text':'var(--status-partial-text)',
          'not-met':     'var(--status-not-met)',
          'not-met-bg':  'var(--status-not-met-bg)',
          'not-met-text':'var(--status-not-met-text)',
          draft:         'var(--status-draft)',
          'draft-bg':    'var(--status-draft-bg)',
          inprogress:    'var(--status-inprogress)',
          'inprogress-bg':'var(--status-inprogress-bg)',
          critical:      'var(--status-critical)',
          success:       'var(--status-success)',
          'success-bg':  'var(--status-success-bg)',
          'success-text':'var(--status-success-text)',
          warning:       'var(--status-warning)',
          'warning-bg':  'var(--status-warning-bg)',
          'warning-text':'var(--status-warning-text)',
          danger:        'var(--status-danger)',
          'danger-bg':   'var(--status-danger-bg)',
          'danger-text': 'var(--status-danger-text)',
          info:          'var(--status-info)',
          'info-bg':     'var(--status-info-bg)',
          'info-text':   'var(--status-info-text)',
        },
      },

      boxShadow: {
        'xs':     'var(--shadow-xs)',
        'sm':     'var(--shadow-sm)',
        'md':     'var(--shadow-md)',
        'lg':     'var(--shadow-lg)',
        '2xl':    'var(--shadow-2xl)',
        'accent': 'var(--shadow-accent)',
        'green':  'var(--shadow-green)',
        'red':    'var(--shadow-red)',
      },

      fontFamily: {
        display: ['Barlow Condensed', 'sans-serif'],
        sans:    ['Manrope', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },

      borderRadius: {
        sm:  'var(--radius-sm)',
        md:  'var(--radius-md)',
        lg:  'var(--radius-lg)',
        xl:  'var(--radius-xl)',
      },

      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.35s ease-out both',
        'shimmer':    'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
}
