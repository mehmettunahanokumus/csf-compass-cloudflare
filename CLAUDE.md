# CLAUDE.md - CSF Compass Project Context

**Last Updated:** 2026-03-11 | **Version:** 1.1.0 (Production)

## Critical Rules

1. **APPLICATION LANGUAGE IS ENGLISH.** All UI text, labels, buttons, error messages, placeholders, headings, tooltips, and any user-visible strings MUST be in English. Never write Turkish text in the codebase. The `_tr` fields in the database are optional translation data — never display them as primary text. When adding new features or components, always write all strings in English.
2. **Percentage format is English-style:** `{value}%` (number first, then %), never `%{value}` (Turkish style).
3. **Use `name`/`description` fields for display, not `name_tr`/`description_tr`.** The `_tr` fields exist for optional i18n data storage only.
4. **Backend static data (e.g. tiering questions, maturity levels) must also be in English.** Only the `_tr` fields may contain Turkish translations.
5. **Frontend uses T token design system (inline styles).** Do NOT use Tailwind CSS classes. All styling uses `T.*` tokens from `frontend/src/tokens.ts` with inline `style` props.
6. **After modifying worker code, always redeploy:** `cd worker && npx wrangler deploy`. Stale deployments cause CORS errors and wrong URLs.

## Project Summary

NIST CSF 2.0 based vendor security assessment platform. Migrated from Supabase to Cloudflare.

**Core Features:** Organization self-assessment, vendor assessment, vendor self-assessment (magic link), company group management, assessment comparison, Excel/PDF import, AI analysis, reporting.

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite 7 (inline styles with T tokens) |
| Backend | Cloudflare Workers + Hono framework |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Storage | Cloudflare R2 (evidence files) |
| AI | Anthropic Claude Sonnet 4.5 |
| Auth | Demo mode (hardcoded org/user), Vendor portal: JWT magic link + session cookie |

**Production URLs:**
- Frontend: `https://csf-compass.pages.dev`
- Worker: `https://csf-compass-worker.mehmettunahanokumus.workers.dev`

**Hardcoded Demo:** `organization_id: demo-org-123`, `user_id: demo-user-456`

## Critical Technical Decisions

- **D1 Bound Parameter Limit: 100/query** (different from SQLite's 999!). Raw SQL batch inserts max 19 rows (5 col x 19 = 95 < 100).
- **UUID:** TEXT(36), **Timestamp:** INTEGER (Unix ms), **Boolean:** INTEGER(0/1), **JSON:** TEXT
- **Vendor Portal Security:** JWT signed magic link (7-day expiry) -> one-time token consumption -> httpOnly session cookie (24h) -> KV rate limiting -> audit log
- **FRONTEND_URL** in `worker/wrangler.toml` must always be `https://csf-compass.pages.dev` (production). Never use preview URLs.

## Database Schema (10 migrations, 17+ tables)

**Core:** organizations, profiles, company_groups, vendors (group_id FK), assessments, assessment_items, assessment_wizard_progress
**CSF Reference:** csf_functions(6), csf_categories(22), csf_subcategories(120)
**Consolidated:** consolidated_questions(23), consolidated_question_mappings(120)
**Evidence:** evidence_files (R2 metadata)
**Vendor Portal:** vendor_assessment_invitations, vendor_audit_log
**Other:** vendor_assessment_templates, action_plan_items

## API Endpoints (worker/src/routes/)

**CSF:** GET functions, categories, subcategories, subcategories/:id
**Vendors:** CRUD + GET /:id/stats + GET/POST tiering | Query params: `organization_id`, `exclude_grouped=true`
**Assessments:** CRUD + GET /:id/items, PATCH /:id/items/:itemId (auto-recalc score), POST /:id/calculate-score, GET /compare?ids=id1,id2
**Evidence:** POST upload (multipart), GET download/:token (JWT), DELETE /:id, GET /item/:itemId, GET /assessment/:assessmentId
**AI:** POST analyze, gap-analysis, executive-summary, chat (SSE streaming)
**Vendor Invitations:** POST create, GET validate/:token, PATCH /:token/items/:itemId, POST /:token/complete, GET /:orgAssessmentId/comparison, GET /assessments/:id/invitation, POST /:invitationId/revoke, GET /:token/consolidated, POST /:token/consolidated-answer
**Consolidated Questions:** GET /api/consolidated-questions?tier=X
**Company Groups:** CRUD + GET /:id/summary (CSF function comparison)
**Import:** POST preview (no DB write), POST confirm (creates group+vendor+assessment+items)

## Frontend Structure

**Build:** Vite 7 | **Deps:** axios, framer-motion, lucide-react, recharts, xlsx, jspdf, pdfjs-dist

**Page Files** (frontend/src/pages/): `.shadcn.tsx` is the current version, `.new.tsx` is migration-era.

| Page | Description |
|------|------------|
| Dashboard | Stats, trend AreaChart, quick access cards |
| Assessments | Filters (type/entity/status/sort), URL param persistence |
| NewAssessment | 3-step: Type(GroupCo/Vendor/Self) -> Entity select -> Details |
| AssessmentDetail | Header card + 4 stats + 3 tabs (Overview/Items/Vendor) |
| AssessmentWizard | 15-step guided, implementation guide per step |
| AssessmentChecklist | "What's Required" + "Guidance" dual panels |
| AssessmentReport | 4-section report, export PDF/Excel/CSV |
| AssessmentHistoryComparison | Side-by-side + per-function BarChart |
| Vendors | External vendors only (exclude_grouped) |
| VendorDetail | 3 tabs (Overview/Assessments/Trend), edit modal |
| VendorPortal | Public magic-link portal, full-width, dark/light toggle, consolidated questions |
| CompanyGroups | Internal subsidiaries, edit/delete per card |
| CompanyGroupDetail | 3 tabs (Overview/Assessments/Trend), subsidiary CRUD |
| Analytics | Real API data, 5-option date range, 5 charts |
| Exports (Reporting Center) | 4 report types x 3 formats (PDF/Excel/CSV) |
| Organization | Branding: logo upload, company name, primary color (localStorage) |

**Key Components:**
- `ChatAssistant` - Global chatbot, dual mode (Quick Help + AI SSE streaming)
- `CsfLogo` - SVG brand component (teal gradient + shield + "C")
- `ExcelImportModal` - XLSX/CSV/PDF import with fuzzy column detection
- `Sidebar` - Branding-aware (localStorage logo/name/color)
- `VendorTieringWizard` - 6-question criticality assessment wizard
- `VpConsolidatedQuestion` - Maturity-level question card for vendor portal
- `SendToVendorModal` - Create vendor assessment link modal

**Vendor Portal Modes:**
- **Consolidated mode** (default): 23 category-level maturity questions, tier-filtered
- **Legacy mode**: 120 individual subcategory items

**API Services** (frontend/src/api/): assessments, vendors (.list() exclude_grouped, .listAll() all), csf, evidence, ai, vendor-invitations (separate axios, withCredentials), company-groups, import

## Scoring Algorithm (worker/src/lib/scoring.ts)

```
Score = (Met x 1 + Partially_Met x 0.5) / Total_Items x 100
```
Auto-recalculated on item update.

## Known Critical Issues

1. **D1 100 param limit** - Raw SQL, max 19 row/batch. Do NOT use Drizzle ORM batch insert!
2. **exclude_grouped filter** - Vendors page sends `exclude_grouped=true`. Group companies only appear in Group Companies section.
3. **Demo auth** - Hardcoded org/user. Production needs Cloudflare Access or custom auth.
4. **Worker redeployment** - After any worker code change, must redeploy. Stale deployments cause CORS/URL issues.

## Development Commands

```bash
# Dev
cd worker && npm run dev      # localhost:8787
cd frontend && npm run dev    # localhost:5173

# Deploy
cd worker && npm run deploy
cd frontend && npm run build && npx wrangler pages deploy dist

# DB
cd worker && npm run db:migrate        # production
cd worker && npm run db:migrate:local  # local
npx wrangler d1 execute csf-compass-db --command "SQL"
npx wrangler d1 execute csf-compass-db --local --command "SQL"

# Secrets & Logs
npx wrangler secret put JWT_SECRET
npx wrangler tail
```

## Important Files

**Backend:** `worker/src/index.ts` (entry), `worker/src/db/schema.ts` (Drizzle schema), `worker/src/routes/*.ts`, `worker/src/lib/*.ts` (scoring, storage, ai, invitation-tokens, rate-limiter, audit-logger, assessment-cloning, tiering, maturity-levels)
**Frontend:** `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/types/index.ts`, `frontend/src/api/*.ts`, `frontend/src/pages/*.tsx`, `frontend/src/tokens.ts` (design system)
**Config:** `worker/wrangler.toml`, `worker/migrations/*.sql`
