# UI Migration Implementation Plan

## Current State Analysis
- Using `.new.tsx` pattern for rebuilt components (already migrated from original)
- Inline styles + CSS variables approach (no Tailwind classes in runtime)
- React Router v7, lucide-react icons, axios for API
- Current layout: Sidebar (250px, collapsible) + TopNav (56px) + Main content
- Dark/light theme via CSS variables + `data-theme` attribute
- API layer fully built (assessments, vendors, evidence, AI, CSF)

## Implementation Streams (Parallelizable)

### Stream 1: Design System + Layout Foundation
**Files to modify:** `index.css`, `index.html`, `AppShell.new.tsx`, `TopNav.new.tsx`, `Sidebar.new.tsx`

1. Add Navy color scale CSS variables (navy-50 through navy-950) to `:root` and dark mode
2. Change fonts: Playfair Display (display) + Inter (body) in index.html + CSS
3. Update `--accent` from teal to navy, update all accent-related vars
4. Rebuild TopNav: 64px height, fixed position, center nav links (Dashboard/Assessments/Vendors), "New Assessment" button, remove Bell/DEMO/avatar
5. Rebuild Sidebar: mobile-only drawer, remove desktop sidebar, NIST CSF info card at bottom
6. Update AppShell: Remove desktop sidebar, add padding-top for fixed header, max-w-7xl container
7. Add shadow-2xl, update focus states to navy ring
8. Install framer-motion

### Stream 2: Core Reusable Components
**New files to create:**
- `components/charts/ComplianceChart.tsx` - SVG animated circular progress
- `components/charts/FunctionScoreChart.tsx` - Horizontal bar chart per function
- `components/assessment/StatusSelector.tsx` - Custom compliance status dropdown
- `components/assessment/CategoryGroup.tsx` - Category header + subcategory list
- `components/vendors/CriticalityBadge.tsx` - Criticality pill badge
- `components/vendors/RiskScoreIndicator.tsx` - Circular risk score display

### Stream 3: Assessment Wizard Page + Sub-components
**New files to create:**
- `pages/AssessmentWizard.tsx` - 15-step wizard with 2-column layout
- `components/wizard/WizardStepper.tsx` - Vertical step list + progress
- `components/wizard/StepNavigation.tsx` - Sticky bottom nav (prev/save/next)
- `components/evidence/FileUploader.tsx` - Drag-drop upload zone
- `components/evidence/EvidenceList.tsx` - Uploaded files list

**Router update:** Add `/assessments/:id/wizard` route

### Stream 4: Report + Checklist Pages
**New files to create:**
- `pages/AssessmentChecklist.tsx` - Checklist view with function tabs + search
- `pages/AssessmentReport.tsx` - Report view with PDF export
- `components/report/ExecutiveSummaryCard.tsx` - AI summary card

**Router update:** Add `/assessments/:id/checklist` and `/assessments/:id/report` routes

### Stream 5: Existing Page Updates
**Files to modify:**
- `pages/Dashboard.new.tsx` - Add Vendor Risk section, Framework Overview, Getting Started
- `pages/AssessmentDetail.new.tsx` - Add Score Circle, Function Scores grid, Navigation Cards
- `pages/Assessments.new.tsx` - Change to type-based tabs (All/Organization/Vendor)
- `pages/Vendors.new.tsx` - Add stats grid, criticality breakdown, quick action links
- `pages/VendorDetail.new.tsx` - Add risk score card, contact info, edit/delete buttons

### Stream 6: New Vendor Pages
**New files to create:**
- `pages/VendorRanking.tsx` - Sortable ranking table with filters
- `pages/VendorTemplates.tsx` - Template card grid
- `pages/VendorNew.tsx` - Vendor creation form (or enhance existing modal)
- `pages/VendorEdit.tsx` - Vendor edit form

**Router update:** Add vendor routes

## Dependencies
- Stream 1 (Design System) should complete FIRST - all other streams depend on the color scheme
- Stream 2 (Core Components) should complete before Streams 3, 4, 5 (they use these components)
- Streams 3, 4, 5, 6 can run in parallel once Stream 2 is done
- Router updates from Streams 3, 4, 6 can be merged at the end

## Team Assignment
- **Agent 1 (design-system):** Stream 1 - Design System + Layout
- **Agent 2 (core-components):** Stream 2 - Core Reusable Components
- **Agent 3 (wizard):** Stream 3 - Assessment Wizard
- **Agent 4 (report-checklist):** Stream 4 - Report + Checklist
- **Agent 5 (page-updates):** Stream 5 - Existing Page Updates
- **Agent 6 (vendor-pages):** Stream 6 - New Vendor Pages
