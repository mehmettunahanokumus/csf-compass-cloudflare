# CLAUDE.md - CSF Compass Project Context

**Son Guncelleme:** 2026-03-05 | **Versiyon:** 1.0.0 (Production)

## Proje Ozeti

NIST CSF 2.0 tabanli vendor security assessment platformu. Supabase'den Cloudflare'e migrate edildi.

**Temel Ozellikler:** Organizasyon self-assessment, vendor assessment, vendor self-assessment (magic link), grup sirketi yonetimi, assessment karsilastirma, Excel/PDF import, AI analiz, raporlama.

## Mimari

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 19 + TypeScript + Vite 7 + Tailwind 4 |
| Backend | Cloudflare Workers + Hono framework |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Storage | Cloudflare R2 (evidence files) |
| AI | Anthropic Claude Sonnet 4.5 |
| Auth | Demo mode (hardcoded org/user), Vendor portal: JWT magic link + session cookie |

**Production URLs:**
- Frontend: `https://csf-compass.pages.dev`
- Worker: `https://csf-compass-worker.mehmettunahanokumus.workers.dev`

**Hardcoded Demo:** `organization_id: demo-org-123`, `user_id: demo-user-456`

## Kritik Teknik Kararlar

- **D1 Bound Parameter Limiti: 100/query** (SQLite'in 999'undan farkli!). Raw SQL batch insert'lerde max 19 row (5 col x 19 = 95 < 100).
- **UUID:** TEXT(36), **Timestamp:** INTEGER (Unix ms), **Boolean:** INTEGER(0/1), **JSON:** TEXT
- **Vendor Portal Security:** JWT signed magic link (7-day expiry) -> one-time token consumption -> httpOnly session cookie (24h) -> KV rate limiting -> audit log

## Database Schema (6 migration, 15 tablo)

**Core:** organizations, profiles, company_groups, vendors (group_id FK), assessments, assessment_items, assessment_wizard_progress
**CSF Reference:** csf_functions(6), csf_categories(22), csf_subcategories(120)
**Evidence:** evidence_files (R2 metadata)
**Vendor Portal:** vendor_assessment_invitations, vendor_audit_log
**Other:** vendor_assessment_templates, action_plan_items

**Migration 0005:** company_groups table + vendors.group_id
**Migration 0006:** company_groups.risk_level + primary_contact

## API Endpoints (worker/src/routes/)

**CSF:** GET functions, categories, subcategories, subcategories/:id
**Vendors:** CRUD + GET /:id/stats | Query params: `organization_id`, `exclude_grouped=true`
**Assessments:** CRUD + GET /:id/items, PATCH /:id/items/:itemId (auto-recalc score), POST /:id/calculate-score, GET /compare?ids=id1,id2
**Evidence:** POST upload (multipart), GET download/:token (JWT), DELETE /:id, GET /item/:itemId, GET /assessment/:assessmentId
**AI:** POST analyze, gap-analysis, executive-summary, chat (SSE streaming)
**Vendor Invitations:** POST create, GET validate/:token, PATCH /:token/items/:itemId, POST /:token/complete, GET /:orgAssessmentId/comparison, GET /assessments/:id/invitation, POST /:invitationId/revoke
**Company Groups:** CRUD + GET /:id/summary (CSF function comparison)
**Import:** POST preview (no DB write), POST confirm (creates group+vendor+assessment+items)

## Frontend Yapisi

**Build:** Vite 7 | **Deps:** axios, framer-motion, lucide-react, recharts, xlsx, jspdf, pdfjs-dist

**Sayfa Dosyalari** (frontend/src/pages/): `.shadcn.tsx` en guncel versiyon, `.new.tsx` migration sureci.

| Sayfa | Aciklama |
|-------|----------|
| Dashboard | Stats, trend AreaChart, quick access kartlari |
| Assessments | Filtreler (type/entity/status/sort), URL param persist |
| NewAssessment | 3-step: Type(GroupCo/Vendor/Self) -> Entity secim -> Details |
| AssessmentDetail | Header card + 4 stat + 3 tab (Overview/Items/Vendor) |
| AssessmentWizard | 15-step guided, implementation guide per step |
| AssessmentChecklist | "What's Required" + "Guidance" dual panels |
| AssessmentReport | 4-section report, export PDF/Excel/CSV |
| AssessmentHistoryComparison | Side-by-side + per-function BarChart |
| Vendors | External vendors only (exclude_grouped) |
| VendorDetail | 3 tab (Overview/Assessments/Trend), edit modal |
| VendorPortal | Public magic-link portal, full-width, dark/light toggle |
| CompanyGroups | Internal subsidiaries, edit/delete per card |
| CompanyGroupDetail | 3 tab (Overview/Assessments/Trend), subsidiary CRUD |
| Analytics | Real API data, 5-option date range, 5 charts |
| Exports (Reporting Center) | 4 report types x 3 formats (PDF/Excel/CSV) |
| Organization | Branding: logo upload, company name, primary color (localStorage) |

**Key Components:**
- `ChatAssistant` - Global chatbot, dual mode (Quick Help + AI SSE streaming)
- `CsfLogo` - SVG brand component (teal gradient + shield + "C")
- `ExcelImportModal` - XLSX/CSV/PDF import with fuzzy column detection
- `Sidebar` - Branding-aware (localStorage logo/name/color)

**API Services** (frontend/src/api/): assessments, vendors (.list() exclude_grouped, .listAll() all), csf, evidence, ai, vendor-invitations (separate axios, withCredentials), company-groups, import

## Scoring Algorithm (worker/src/lib/scoring.ts)

```
Score = (Met x 1 + Partially_Met x 0.5) / Total_Items x 100
```
Auto-recalculated on item update.

## Bilinen Kritik Sorunlar

1. **D1 100 param limit** - Raw SQL, max 19 row/batch. Drizzle ORM batch insert kullanma!
2. **exclude_grouped filtresi** - Vendors sayfasi `exclude_grouped=true` gonderiyor. Grup sirketleri sadece Group Companies'de gorunur.
3. **Demo auth** - Hardcoded org/user. Production icin Cloudflare Access veya custom auth gerekli.

## Gelistirme Komutlari

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

## Onemli Dosyalar

**Backend:** `worker/src/index.ts` (entry), `worker/src/db/schema.ts` (Drizzle schema), `worker/src/routes/*.ts`, `worker/src/lib/*.ts` (scoring, storage, ai, invitation-tokens, rate-limiter, audit-logger, assessment-cloning)
**Frontend:** `frontend/src/main.tsx`, `frontend/src/App.tsx`, `frontend/src/types/index.ts`, `frontend/src/api/*.ts`, `frontend/src/pages/*.tsx`
**Config:** `worker/wrangler.toml`, `worker/migrations/*.sql`

## Phase Ozeti (Kronolojik)

| # | Tarih | Ozet |
|---|-------|------|
| 1-4 | Feb 10-11 | Infra + DB(14 tablo, CSF seed, demo data) + Worker API(23 endpoint) + Frontend(31 sayfa) |
| 5 | Feb 11 | Vendor self-assessment: JWT magic link, session, rate limit, audit log |
| 6 | Feb 12 | UI theme: Teal->Navy Blue, dark mode, Inter+Playfair Display |
| 7 | Feb 11 | Production deployment |
| 8 | Feb 12 | Claude Code + Serena + Context7 integration |
| 9 | Feb 18 | Company groups + historical comparison + Excel import + XYZ Holding demo (11 sirket) |
| 10 | Feb 19 | Bug fixes, visual improvements, reporting center, checklist details, wizard generalization |
| 11 | Feb 20 | Dark mode contrast audit (CSS token fixes) |
| 12 | Feb 21 | Groups -> Group Companies rename |
| 13 | Feb 21 | Wizard implementation guide + checklist enhanced details |
| 14 | Feb 21 | Assessment report redesign (4-section, SheetJS export) |
| 15 | Feb 19 | Historical comparison: recharts AreaChart + filters + per-function BarChart |
| 16 | Feb 19 | Reporting Center: jsPDF + xlsx real file generation (4 report types) |
| 17 | Feb 19 | VendorDetail profile editing bug fixes (6 bugs: notes mapping, missing fields, toast, optimistic UI) |
| 18 | Feb 19 | CompanyGroupDetail subsidiary CRUD + backend group_id POST fix |
| 19 | Feb 19 | Analytics: static demo -> real API data + date range filter + 5 reactive charts |
| 20 | Feb 19 | Assessment type/company tags (Self=indigo, Vendor=purple, GroupCo=blue) |
| 21 | Feb 19 | AssessmentChecklist: "What's Required" + "Guidance" dual panels |
| 22 | Feb 19 | Multi-format export dropdown (PDF/Excel/CSV per report) |
| 23 | Feb 19 | Contextual AI chatbot (pre-built QA, keyword matching, page-aware greetings) |
| 24 | Feb 19 | Global chatbot + AI Assistant dual mode (SSE streaming, POST /api/ai/chat) |
| 25 | Feb 20 | Group company edit/delete + corporate identity branding (localStorage) |
| 26 | Feb 20 | Assessments page: type/entity/status/sort filters + URL param persistence |
| 27 | Feb 20 | New Assessment 3-step flow (GroupCo/Vendor/Self -> entity select -> details) |
| 28 | Feb 20 | Assessments entity filter bug fix (vendor JOIN missing in list endpoint) |
| 29 | Feb 20 | XLSX + PDF import (pdfjs-dist, fuzzy column detection, single_mapping step) |
| 30 | Feb 20 | Favicon (SVG+ICO) + CsfLogo React component |
| 31 | Feb 20 | CompanyGroupDetail redesign: tabs, collapsible months, LineChart trend |
| 32 | Feb 20 | VendorDetail redesign: tabs, letter avatar, edit modal, AreaChart trend |
| 33 | Feb 20 | AssessmentDetail redesign: header card, stat cards, 3 tabs, overflow menu |
| 34 | Feb 20 | Dashboard redesign: real data AreaChart, quick access cards, dynamic stats |
