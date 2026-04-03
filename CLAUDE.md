# CLAUDE.md - CSF Compass Project Context

**Last Updated:** 2026-04-03 | **Version:** 2.0.0 (Production — Real Auth)

## Critical Rules

1. **All UI text in English.** Never write Turkish. `_tr` fields are optional i18n data only.
2. **Percentage format:** `{value}%` (English), never `%{value}`.
3. **Display `name`/`description`, not `name_tr`/`description_tr`.**
4. **Frontend uses T token design system (inline styles).** No Tailwind CSS. Use `T.*` from `tokens.ts`.
5. **After worker changes, redeploy:** `cd worker && npx wrangler deploy`. Stale deploys cause CORS/URL issues.
6. **`FRONTEND_URL`** in `worker/wrangler.toml` must be `https://assessment.tunahanokumus.com.tr`.
7. **Auth is Bearer token based.** Frontend stores JWT in localStorage, sends as `Authorization: Bearer <token>` header. Never use cookies for cross-origin auth.
8. **No DEMO_ORG_ID anywhere.** All org/user context comes from the authenticated JWT session. Never hardcode org or user IDs.

## Project Summary

NIST CSF 2.0 vendor security assessment platform on Cloudflare.

**Features:** Real email+password auth, org signup, team member invitations, vendor assessment with auto email invitations, vendor self-assessment (magic link), company groups, assessment comparison, Excel/PDF import, AI analysis, evidence upload, PDF/Excel/CSV export, password reset, reporting.

## Architecture

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite 7 (inline styles, T tokens) |
| Backend | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) + Drizzle ORM |
| Storage | Cloudflare R2 (evidence files) |
| AI | Anthropic Claude Sonnet 4.5 |
| Email | Resend API (REST, no SDK) |
| Auth | JWT Bearer token (PBKDF2 password hashing, 7-day session) |
| Vendor Auth | JWT magic link + session cookie (24h) |

**URLs:** Frontend `https://assessment.tunahanokumus.com.tr` (also `https://csf-compass.pages.dev`) | Worker `https://csf-compass-worker.mehmettunahanokumus.workers.dev`

## Authentication

- **Signup:** `POST /api/auth/signup` — creates org + user, returns JWT token
- **Login:** `POST /api/auth/login` — validates password, returns JWT token
- **Session:** `GET /api/auth/me` — validates Bearer token, returns user/org info
- **Logout:** `POST /api/auth/logout` — clears cookie (token removed client-side)
- **Password reset:** `POST /api/auth/forgot-password` + `POST /api/auth/reset-password`
- **Team invite:** `POST /api/auth/invite-member` + `POST /api/auth/accept-invite`
- **Middleware:** `requireOrgAuth` in `worker/src/lib/auth.ts` — extracts user/org from Bearer token, sets `c.get('organizationId')` and `c.get('userId')` for downstream handlers
- **Password hashing:** PBKDF2-SHA256 (100k iterations) via Web Crypto API (Cloudflare Workers native)
- **Frontend:** `AuthContext` stores token in localStorage, `apiClient` sends `Authorization: Bearer` header on all requests

## Email (Resend)

- **Config:** `RESEND_API_KEY` (secret), `FROM_EMAIL` (env var) = `noreply@assessment.tunahanokumus.com.tr`
- **Templates:** `worker/src/lib/email.ts` — `welcomeEmail`, `vendorInviteEmail`, `teamInviteEmail`, `passwordResetEmail`
- **Vendor invitations** automatically send email when created (+ link still returned in response for manual copy)

## Security

- **Download tokens:** JWT-signed (not base64) via `@tsndr/cloudflare-worker-jwt`
- **Org isolation:** `requireOrgAuth` middleware on all org-scoped routes — validates JWT, enforces org_id match
- **PATCH whitelisting:** assessments and vendors PATCH endpoints only accept specific fields
- **AI input sanitization:** `pageContext` validated against allowlist before injection into prompts
- **Rate limiter:** Uses only `cf-connecting-ip` (no x-forwarded-for), fails closed on KV errors
- **CORS:** Strict origin allowlist (no wildcard), credentials enabled for all routes
- **Security headers:** HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy
- **File upload:** Magic byte validation + MIME type + size check (10MB max)
- **Error responses:** Generic messages (no internal details leaked)

## Key Technical Constraints

- **D1 bound parameter limit: 100/query** (not 999!). Raw SQL batch inserts max 19 rows.
- **UUID:** TEXT(36), **Timestamp:** INTEGER (Unix ms), **Boolean:** INTEGER(0/1), **JSON:** TEXT
- **Cross-origin auth:** Cookies don't work cross-origin between pages.dev and workers.dev — use Bearer tokens instead
- **Vendor Portal Security:** JWT magic link (configurable expiry) → one-time token → httpOnly session cookie (24h) → KV rate limiting → audit log

## Database (12 migrations, 18+ tables)

**Core:** organizations (+ logo_url, primary_color), profiles (+ password_hash, reset token, email_verified), company_groups, vendors, assessments, assessment_items, assessment_wizard_progress
**Auth:** org_invitations (team member invites)
**CSF:** csf_functions(6), csf_categories(22), csf_subcategories(120)
**Consolidated:** consolidated_questions(23), consolidated_question_mappings(120)
**Evidence:** evidence_files (R2 metadata)
**Vendor Portal:** vendor_assessment_invitations, vendor_audit_log
**Other:** vendor_assessment_templates, action_plan_items

## API Endpoints (worker/src/routes/)

- **Auth:** signup, login, logout, me, forgot-password, reset-password, invite-member, accept-invite
- **CSF:** GET functions, categories, subcategories
- **Vendors:** CRUD + stats + tiering | `exclude_grouped=true` for vendors page
- **Assessments:** CRUD + items + score calc + compare
- **Evidence:** upload (multipart, magic byte validation) + download (JWT-signed token) + delete + list by item/assessment
- **AI:** analyze, gap-analysis, executive-summary, chat (SSE)
- **Vendor Invitations:** create (+ auto email), validate, update items, complete, consolidated questions/answers, evidence (upload/list/delete), stats, export-data, AI (analyze/gap-analysis/executive-summary), revoke, comparison
- **Company Groups:** CRUD + summary
- **Import:** preview + confirm

## Frontend Pages

Active pages use `.shadcn.tsx` suffix. Dead `.tsx` and `.new.tsx` files have been removed.

| Page | Key |
|------|-----|
| Login | Email + password form |
| Signup | Org name + user details + password |
| ForgotPassword | Email input → reset link sent |
| ResetPassword | Token-based new password form |
| AcceptInvite | Team invitation acceptance + account creation |
| Dashboard | Stats + trend chart + quick access |
| Assessments | Filters, URL params |
| NewAssessment | 3-step wizard |
| AssessmentDetail | Header + stats + tabs (Overview/Vendor Responses/Vendor) |
| VendorPortal | Public magic-link portal, consolidated (23 questions) or legacy (120 items) mode |
| Analytics | Date range + 5 charts |
| Exports | 4 report types × 3 formats |
| Organization | Org settings + team members (coming soon) |
| Profile | User info from auth context + sign out |

## Key Components

- `AuthContext` — Global auth state (login/signup/logout), token in localStorage
- `ProtectedRoute` — Redirects unauthenticated users to `/login`
- `InviteVendorDialog` — Send vendor assessment invitation (auto email + copy link)
- `VendorTieringWizard` — 6-question criticality wizard
- `ChatAssistant` — Dual mode chatbot (Quick Help + AI SSE)
- `ExcelImportModal` — XLSX/CSV/PDF import with fuzzy column detection
- **Vendor Portal:** VpAssessment, VpConsolidatedQuestion, VpReview, VpHeader, VpFunctionNav, VpEvidencePanel, VpExportPanel, VpAiPanel, VpWelcome, VpComplete

## Scoring

`Score = (Met × 1 + Partially_Met × 0.5) / Total_Items × 100` — auto-recalculated on item update.

## Dev Commands

```bash
cd worker && npm run dev          # localhost:8787
cd frontend && npm run dev        # localhost:5173
cd worker && npm run deploy       # deploy worker
cd frontend && npm run build && npx wrangler pages deploy dist  # deploy frontend
cd worker && npm run db:migrate   # run migrations (local)
cd worker && npx wrangler d1 migrations apply csf-compass-db --remote  # run migrations (production)
npx wrangler secret put RESEND_API_KEY  # set email API key
```

## Important Files

**Backend:** `worker/src/index.ts`, `worker/src/db/schema.ts`, `worker/src/routes/*.ts`, `worker/src/lib/{auth,email,scoring,storage,ai,invitation-tokens,rate-limiter,audit-logger,tiering,maturity-levels}.ts`
**Frontend:** `frontend/src/tokens.ts` (design system), `frontend/src/types/index.ts`, `frontend/src/api/*.ts`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/pages/*.shadcn.tsx`
**Config:** `worker/wrangler.toml`, `worker/migrations/*.sql`
