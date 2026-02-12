# CSF Compass Design System

## Color Palette

### Primary Colors (Deep Navy)
- **Purpose**: Header, sidebar, primary buttons
- `bg-primary` - #1E3A5F
- `bg-primary-light` - #2A4A73 (hover states)
- `bg-primary-dark` - #152D4A (active/pressed states)

### Secondary Colors (Bright Blue)
- **Purpose**: Links, active states, CTAs
- `bg-secondary` - #3B82F6
- `bg-secondary-light` - #60A5FA
- `bg-secondary-dark` - #2563EB

### Accent Colors (Emerald)
- **Purpose**: Compliant items, success, positive scores
- `bg-accent` - #10B981
- `bg-accent-light` - #34D399
- `bg-accent-dark` - #059669

### Warning Colors (Amber)
- **Purpose**: Partial compliance, attention needed
- `bg-warning` - #F59E0B
- `bg-warning-light` - #FBBF24
- `bg-warning-dark` - #D97706

### Danger Colors (Red)
- **Purpose**: Non-compliant, critical findings
- `bg-danger` - #EF4444
- `bg-danger-light` - #F87171
- `bg-danger-dark` - #DC2626

### Surface Colors
- `bg-surface` - #F8FAFC (page background)
- `bg-card` - #FFFFFF (card backgrounds)
- `border-border` - #E2E8F0 (borders, dividers)

### Text Colors
- `text-text-primary` - #0F172A (headings, primary text)
- `text-text-secondary` - #64748B (descriptions, metadata)
- `text-text-muted` - #94A3B8 (placeholders, disabled)

## Typography

### Font Families
- **Sans-serif**: Inter (default) - `font-sans`
- **Monospace**: JetBrains Mono - `font-mono`

### Usage Rules
- **Headings**: Use Inter 600 or 700 (`font-semibold` or `font-bold`)
- **Body text**: Use Inter 400 or 500 (`font-normal` or `font-medium`)
- **Technical data**: Use JetBrains Mono (`font-mono`) for scores, IDs, technical values
- **Minimum body size**: 14px (`text-sm`)
- **Line heights**:
  - Body text: 1.5 (`leading-normal`)
  - Headings: 1.2 (`leading-tight`)

### Size Scale
- `text-xs` - 12px (labels, metadata)
- `text-sm` - 14px (body text minimum)
- `text-base` - 16px (default body)
- `text-lg` - 18px (large body, small headings)
- `text-xl` - 20px (section headings)
- `text-2xl` - 24px (page headings)
- `text-3xl` - 30px (hero headings)

## Spacing & Layout

### Grid System
- Uses 8px grid (Tailwind default)
- Stack spacing: `space-y-2` (8px), `space-y-4` (16px), `space-y-8` (32px)

### Component Spacing
- **Card padding**: `p-6` (24px)
- **Section spacing**: `space-y-8` (32px between sections)
- **Sidebar width**: `w-[260px]` when open, `w-0` when closed
- **Main content**: `flex-1` (takes remaining space)

### Border Radius
- **Cards**: `rounded-lg` (8px)
- **Buttons/Badges**: `rounded-md` (6px)
- **Avatars**: `rounded-full` (50%)

## Component Examples

### Button Styles
```tsx
// Primary Button
<button className="bg-primary hover:bg-primary-light active:bg-primary-dark text-white font-medium px-4 py-2 rounded-md transition-colors">
  Primary Action
</button>

// Secondary Button
<button className="bg-secondary hover:bg-secondary-light text-white font-medium px-4 py-2 rounded-md transition-colors">
  Secondary Action
</button>

// Danger Button
<button className="bg-danger hover:bg-danger-light text-white font-medium px-4 py-2 rounded-md transition-colors">
  Delete
</button>
```

### Status Badges
```tsx
// Compliant
<span className="bg-accent text-white text-xs font-medium px-3 py-1 rounded-md">
  Compliant
</span>

// Partial
<span className="bg-warning text-white text-xs font-medium px-3 py-1 rounded-md">
  Partial
</span>

// Non-compliant
<span className="bg-danger text-white text-xs font-medium px-3 py-1 rounded-md">
  Non-Compliant
</span>
```

### Cards
```tsx
<div className="bg-card border border-border rounded-lg p-6 space-y-4">
  <h3 className="text-xl font-semibold text-text-primary leading-tight">
    Card Title
  </h3>
  <p className="text-sm text-text-secondary leading-normal">
    Card description text
  </p>
</div>
```

### Score Display
```tsx
// Use monospace font for scores
<span className="font-mono text-2xl font-bold text-accent">
  87.5%
</span>
```

## Usage Guidelines

1. **Always use semantic color names** (primary, accent, danger) instead of arbitrary colors
2. **Apply hover states** to interactive elements using the `-light` variant
3. **Use active states** on buttons with the `-dark` variant
4. **Maintain consistent spacing** using the 8px grid system
5. **Set minimum text size** to `text-sm` (14px) for readability
6. **Use monospace font** for all technical/numerical data
7. **Apply appropriate line heights** - tighter for headings, normal for body text
