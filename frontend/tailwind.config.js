/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sidebar (always dark)
        sidebar: {
          bg: 'var(--sidebar-bg)',
          'bg-hover': 'var(--sidebar-bg-hover)',
          'bg-active': 'var(--sidebar-bg-active)',
          text: 'var(--sidebar-text)',
          'text-active': 'var(--sidebar-text-active)',
          'text-muted': 'var(--sidebar-text-muted)',
          border: 'var(--sidebar-border)',
          'section-label': 'var(--sidebar-section-label)',
          accent: 'var(--sidebar-accent)',
          'user-bg': 'var(--sidebar-user-bg)',
        },

        // Top Navigation
        topnav: {
          bg: 'var(--topnav-bg)',
          border: 'var(--topnav-border)',
          text: 'var(--topnav-text)',
          'text-secondary': 'var(--topnav-text-secondary)',
        },

        // Content Area
        page: {
          bg: 'var(--page-bg)',
        },
        card: {
          bg: 'var(--card-bg)',
          border: 'var(--card-border)',
        },

        // Text
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
        },

        // Card-specific text (dark mode readability)
        'card-title': 'var(--card-title)',
        'card-description': 'var(--card-description)',
        'card-metadata': 'var(--card-metadata)',

        // Links
        link: {
          DEFAULT: 'var(--link-color)',
          hover: 'var(--link-hover)',
        },

        // Borders & Dividers
        border: {
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
        divider: 'var(--divider)',

        // Interactive / Brand
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          active: 'var(--primary-active)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          hover: 'var(--secondary-hover)',
          light: 'var(--secondary-light)',
        },

        // Status Colors
        status: {
          compliant: 'var(--status-compliant)',
          'compliant-bg': 'var(--status-compliant-bg)',
          'compliant-text': 'var(--status-compliant-text)',
          'compliant-border': 'var(--status-compliant-border)',

          partial: 'var(--status-partial)',
          'partial-bg': 'var(--status-partial-bg)',
          'partial-text': 'var(--status-partial-text)',
          'partial-border': 'var(--status-partial-border)',

          noncompliant: 'var(--status-noncompliant)',
          'noncompliant-bg': 'var(--status-noncompliant-bg)',
          'noncompliant-text': 'var(--status-noncompliant-text)',
          'noncompliant-border': 'var(--status-noncompliant-border)',

          draft: 'var(--status-draft)',
          'draft-bg': 'var(--status-draft-bg)',
          'draft-text': 'var(--status-draft-text)',
          'draft-border': 'var(--status-draft-border)',

          inprogress: 'var(--status-inprogress)',
          'inprogress-bg': 'var(--status-inprogress-bg)',
          'inprogress-text': 'var(--status-inprogress-text)',
          'inprogress-border': 'var(--status-inprogress-border)',

          critical: 'var(--status-critical)',
          'critical-bg': 'var(--status-critical-bg)',
          'critical-text': 'var(--status-critical-text)',
          'critical-border': 'var(--status-critical-border)',
        },

        // Inputs & Forms
        input: {
          bg: 'var(--input-bg)',
          border: 'var(--input-border)',
          'border-focus': 'var(--input-border-focus)',
          placeholder: 'var(--input-placeholder)',
          text: 'var(--input-text)',
        },

        // Misc
        'focus-ring': 'var(--focus-ring)',
        overlay: 'var(--overlay)',
        scrollbar: {
          thumb: 'var(--scrollbar-thumb)',
          track: 'var(--scrollbar-track)',
        },
      },
      boxShadow: {
        'card': 'var(--card-shadow)',
        'card-hover': 'var(--card-shadow-hover)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
