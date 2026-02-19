# CLAUDE.md - CSF Compass Proje Geçmişi

> Bu dosya, Claude Code için proje bağlamını hızlıca anlamak amacıyla hazırlanmıştır. Tüm geçmiş değişiklikleri, kararları ve önemli dönüm noktalarını içerir.

**Son Güncelleme:** 2026-02-19 (Phase 19)
**Proje Adı:** CSF Compass - Cloudflare Edition
**Versiyon:** 1.0.0 (Production)

---

## İçindekiler

1. [Proje Özeti](#proje-özeti)
2. [Mimari Kararlar](#mimari-kararlar)
3. [Geçmiş ve Dönüm Noktaları](#geçmiş-ve-dönüm-noktaları)
4. [Teknik Stack ve Bağımlılıklar](#teknik-stack-ve-bağımlılıklar)
5. [Database Schema ve Migrasyonlar](#database-schema-ve-migrasyonlar)
6. [API Endpoints](#api-endpoints)
7. [Frontend Yapısı](#frontend-yapısı)
8. [Önemli Özellikler](#önemli-özellikler)
9. [Production Deployment](#production-deployment)
10. [Bilinen Sorunlar ve Çözümler](#bilinen-sorunlar-ve-çözümler)
11. [Gelecek İyileştirmeler](#gelecek-iyileştirmeler)

---

## Proje Özeti

CSF Compass, NIST Cybersecurity Framework (CSF) 2.0'a dayalı vendor security assessment yönetim platformudur. Orijinal Supabase tabanlı versiyondan Cloudflare Developer Platform'a tam migration yapılmıştır.

**Temel Amaç:**
- Organizasyonların kendi güvenlik durumunu değerlendirmesi
- Vendor'ların (tedarikçilerin) güvenlik değerlendirmesi
- NIST CSF 2.0 framework'üne göre kapsamlı assessment
- Vendor self-assessment özelliği (magic link ile)
- Assessment karşılaştırma ve gap analizi

**Neden Cloudflare?**
- Global edge network (düşük latency)
- Uygun maliyet (aylık ~$10-15)
- Entegre ekosistem (D1, R2, Workers, Pages)
- Kolay deployment ve scaling

---

## Mimari Kararlar

### 1. Platform Seçimi: Cloudflare

**Önceki Stack:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
**Yeni Stack:** Cloudflare (D1 + R2 + Workers + Pages)

**Neden değiştik?**
- Maliyet optimizasyonu
- Daha iyi global performans
- Entegre developer experience
- Supabase free tier limitasyonları

### 2. Database: D1 (SQLite)

**PostgreSQL → SQLite Dönüşüm Kararları:**
- **UUID:** TEXT olarak saklanıyor (36 karakter)
- **Timestamp:** INTEGER olarak (Unix milliseconds)
- **JSONB:** TEXT olarak (JSON.stringify/parse)
- **Boolean:** INTEGER (0/1)
- **Decimal:** REAL (floating point)

**Önemli Not:** Cloudflare D1'in bound parameter limiti **100 per query** (SQLite'ın 999 limitinden farklı!). Raw SQL batch insert'lerde max **19 row** kullanıyoruz (5 col × 19 = 95 params < 100 limit).

### 3. Authentication: Demo Mode

**Kritik Karar:** İlk versiyonda authentication yok!

**Hardcoded değerler:**
- Organization ID: `demo-org-123`
- User ID: `demo-user-456`

**Gelecek Plan:** Cloudflare Access veya custom auth eklenebilir.

### 4. AI Integration: Anthropic Claude

**Model:** Claude Sonnet 4.5
**Kullanım Alanları:**
- Evidence analizi (subcategory bazında)
- Gap analysis (eksiklikleri belirle)
- Executive summary (yönetici raporu)

**API Key:** Environment variable (`ANTHROPIC_API_KEY`)

### 5. File Storage: R2

**JWT-based Presigned URLs:**
- Download için token-based güvenlik
- 1 saatlik geçerlilik süresi
- httpOnly cookies (vendor portal için)

---

## Geçmiş ve Dönüm Noktaları

### Phase 1: Infrastructure Setup (Gün 1-3)
**Tamamlanma:** 2026-02-10

✅ Tamamlanan:
- Repository oluşturuldu (`csf-cloudflare/`)
- Worker projesi (Hono framework)
- Frontend projesi (Vite + React + TypeScript)
- D1 database: `csf-compass-db` (ID: `4dfa232a-bb0e-4576-8a67-ae787ca0f996`)
- R2 bucket: `csf-evidence-files`
- KV namespace: Rate limiting için (`RATE_LIMIT_KV`)

**İlk Commit:** `28d4561` - Initial commit: Complete CSF Compass migration to Cloudflare

---

### Phase 2: Database Migration (Gün 4-7)
**Tamamlanma:** 2026-02-10

✅ Tamamlanan:
- **Migration 0001:** 14 tablo oluşturuldu
- **Migration 0002:** CSF 2.0 seed data (6 function, 22 category, 120 subcategory)
- **Migration 0003:** Demo data (organization, user, 3 vendor, 2 assessment)
- **Migration 0004:** Vendor invitation tables

**Kritik Çözümler:**
- **Batch Insert Problemi:** SQLite 999 variable limit
  - Commit: `1fb0923` - Fix: Batch insert assessment items to avoid SQLite variable limit
  - Çözüm: 25 row/batch
- **Boolean Problemi:** SQLite 0/1 kullanımı
  - Commit: `cfc5aab` - Fix: Use 0 for boolean in SQLite wizard progress

**Database İstatistikleri:**
- Toplam 14 tablo
- 6 CSF Function
- 22 CSF Category
- 120 CSF Subcategory
- 3 Demo Vendor
- 2 Demo Assessment (240 assessment item)

---

### Phase 3: Worker API Development (Gün 8-12)
**Tamamlanma:** 2026-02-11

✅ Tamamlanan API Endpoints (23 toplam):

**CSF Reference (4 endpoint):**
- `GET /api/csf/functions`
- `GET /api/csf/categories`
- `GET /api/csf/subcategories`
- `GET /api/csf/subcategories/:id`

**Vendors (6 endpoint):**
- `GET /api/vendors`
- `POST /api/vendors`
- `GET /api/vendors/:id`
- `PATCH /api/vendors/:id`
- `DELETE /api/vendors/:id`
- `GET /api/vendors/:id/stats`

**Assessments (8 endpoint):**
- `GET /api/assessments`
- `POST /api/assessments` (auto-creates 120 items + 15 wizard steps)
- `GET /api/assessments/:id`
- `PATCH /api/assessments/:id`
- `DELETE /api/assessments/:id`
- `GET /api/assessments/:id/items`
- `PATCH /api/assessments/:id/items/:itemId`
- `POST /api/assessments/:id/calculate-score`

**Evidence (4 endpoint):**
- `POST /api/evidence/upload`
- `GET /api/evidence/download/:token`
- `DELETE /api/evidence/:id`
- `GET /api/evidence/item/:itemId`

**AI Services (3 endpoint):**
- `POST /api/ai/analyze`
- `POST /api/ai/gap-analysis`
- `POST /api/ai/executive-summary`

**Vendor Invitations (7 endpoint):**
- `POST /api/vendor-invitations` (send invitation)
- `GET /api/vendor-invitations/validate/:token` (validate & consume)
- `PATCH /api/vendor-invitations/:token/items/:itemId` (update item)
- `POST /api/vendor-invitations/:token/complete` (submit)
- `GET /api/vendor-invitations/:orgAssessmentId/comparison` (comparison)
- `GET /api/assessments/:id/invitation` (get status)
- `POST /api/vendor-invitations/:invitationId/revoke` (revoke)

---

### Phase 4: Frontend Development (Gün 13-15)
**Tamamlanma:** 2026-02-11

✅ Tamamlanan:
- Tailwind CSS setup
- TypeScript types
- API client layer (5 service modülü)
- React Router (7+ route)
- Layout components (AppLayout, Header, Sidebar)
- **31 Page Component** (Dashboard, Assessments, Vendors, Analytics, vb.)

**Frontend Özellikleri:**
- Assessment wizard (15-step guided assessment)
- Evidence upload (drag & drop, R2 storage)
- Vendor portal (public, token-based)
- Assessment comparison (org vs vendor)
- Dashboard analytics
- Export functionality

---

### Phase 5: Vendor Self-Assessment Feature (Gün 16-18)
**Tamamlanma:** 2026-02-11

✅ Security Architecture:
- **JWT Signing:** Magic link imzalama (`@tsndr/cloudflare-worker-jwt`)
- **One-Time Token:** Token sadece bir kez kullanılabilir
- **Session Management:** 24-saatlik httpOnly cookie
- **Rate Limiting:** KV-based (10 req/min validation, 30 req/min update)
- **Audit Logging:** Tüm vendor actions loglanıyor
- **Token Revocation:** Organization tarafından iptal edilebilir

**Güvenlik Katmanları:**
1. JWT imzalama (7-gün max expiry)
2. One-time consumption (`token_consumed_at`)
3. Session cookie (httpOnly + Secure + SameSite=Strict)
4. Rate limiting (per-IP)
5. Token revocation
6. Audit trail (D1'de)

---

### Phase 6: UI Theme Migration (Gün 19-20)
**Tamamlanma:** 2026-02-12

✅ Tamamlanan:
- **Renk Paleti:** Teal → Navy Blue
- **Tipografi:** Plus Jakarta Sans → Inter + Playfair Display
- **Dark Mode:** Slate Professional theme
- **Critical Fixes:**
  - Commit: `cc6ccbc` - Apply Slate Professional theme with critical visibility fixes
  - Commit: `2a48340` - Apply critical dark mode readability fixes

**Design System Updates:**
- Navy color scale (50-950)
- Focus states (navy ring)
- Shadow depths (5 level)
- Border radius (8px, 12px, 16px)

---

### Phase 7: Production Deployment (Gün 21)
**Tamamlanma:** 2026-02-11

✅ Production URLs:
- **Frontend:** https://a5637370.csf-compass.pages.dev
- **Worker:** https://csf-compass-worker.mehmettunahanokumus.workers.dev

✅ Deployment Checklist:
- JWT_SECRET set via `wrangler secret`
- Database migrations applied
- Environment variables configured
- CORS origins whitelisted
- Rate limiting KV namespace bound

**Production Stats:**
- Frontend bundle: 338 KB JS, 17 KB CSS
- Database: 106 CSF subcategories, 240+ assessment items
- Worker: 23 API endpoints
- Security: JWT + Session + Rate Limit + Audit Log

---

### Phase 8: Agentic Development (Gün 22)
**Tamamlanma:** 2026-02-12

Commit: `c86edb5` - Cladude Code Agentic Devs

**Claude Code Integration:**
- Serena MCP server konfigürasyonu
- Context7 for library documentation
- Cloudflare Developer Platform MCP

---

### Phase 9: Company Groups + Historical Comparison + Excel Import (Gün 23)
**Tamamlanma:** 2026-02-18

✅ Tamamlanan:

**Yeni Özellikler:**
- **Company Groups (Grup Şirketleri):** Holding/bağlı ortaklık yapısını modelleme
- **Historical Assessment Comparison:** İki assessment'ı subkategori bazında karşılaştırma
- **Excel Import:** Mevcut Excel değerlendirmelerini sisteme aktarma
- **XYZ Holding Demo Data:** Gerçek Excel verisinden 11 şirket import edildi

**Backend Değişiklikleri:**
- `worker/migrations/0005_company_groups.sql` — `company_groups` tablosu + `vendors.group_id`
- `worker/src/db/schema.ts` — `company_groups` table, `group_id` field vendors'a eklendi
- `worker/src/routes/company-groups.ts` — CRUD + summary endpoint (CSF function bazında)
- `worker/src/routes/import.ts` — Preview + confirm import (Excel → JSON → DB)
- `worker/src/routes/assessments.ts` — `GET /compare?ids=id1,id2` endpoint eklendi
- `worker/src/routes/vendors.ts` — `group_id` query param filter eklendi
- `worker/src/index.ts` — Yeni route'lar register edildi

**Frontend Değişiklikleri:**
- `frontend/src/types/index.ts` — `CompanyGroup`, `GroupSummary`, `AssessmentComparison` tipleri
- `frontend/src/api/company-groups.ts` — Company groups API client
- `frontend/src/api/import.ts` — Import API client
- `frontend/src/pages/CompanyGroups.shadcn.tsx` — Grup listesi + oluşturma modal
- `frontend/src/pages/CompanyGroupDetail.shadcn.tsx` — Grup detayı + CSF karşılaştırma tablosu
- `frontend/src/pages/AssessmentHistoryComparison.shadcn.tsx` — İki assessment yan yana karşılaştırma
- `frontend/src/components/import/ExcelImportModal.tsx` — 4-step Excel import modal
- `frontend/src/router.tsx` — `/company-groups`, `/company-groups/:id`, `/vendors/:id/compare` route'ları
- `frontend/src/components/layout/Sidebar.shadcn.tsx` — "Groups" menü öğesi eklendi
- `frontend/src/pages/VendorDetail.shadcn.tsx` — Assessment comparison checkbox + skor trend grafiği

**Excel Import Süreci:**
- Kullanıcının `CSF_Assessment-2023.xlsx` dosyası analiz edildi (XYZ Holding, 2023 değerlendirmesi)
- CSF 1.1 → CSF 2.0 ID mapping tablosu oluşturuldu (107 subcategory)
- Durum XYZ Holding Yorum kolonundan türetildi (OK→compliant, OK?→partial, boş→not_assessed)
- Sonuç: 3 compliant, 54 partial, 63 not_assessed (120 item)
- 10 bağlı şirket için rastgele gerçekçi skorlar üretildi (%26-81 aralığı)
- Tüm 11 şirket production'a başarıyla import edildi

**Kritik Bulunan Sorun & Çözüm:**
- **D1 Bound Parameter Limiti:** Cloudflare D1, sorgu başına max **100 bound parameter** destekliyor
- Drizzle ORM batch insert: 5 col × 25 row = 125 params → **BAŞARISIZ**
- Çözüm: Raw SQL ile 5 col × 19 row = 95 params → **BAŞARILI**
- `import.ts` route'u `c.env.DB.prepare(...).bind(...params).run()` kullanacak şekilde güncellendi
- Ek özellik: `group_id` optional field → mevcut gruba şirket ekleme (batch import için)

**CI/CD:**
- `.github/workflows/deploy.yml` — Otomatik deploy GitHub Actions workflow'u eklendi

**Import Edilen Demo Data (Production DB):**

| Şirket | Skor | Kaynak |
|--------|------|--------|
| XYZ Holding A.Ş. | 25.0% | Gerçek Excel verisi |
| XYZ Enerji A.Ş. | 71.7% | Rastgele üretildi |
| XYZ Finans A.Ş. | 62.5% | Rastgele üretildi |
| XYZ Lojistik A.Ş. | 47.5% | Rastgele üretildi |
| XYZ Teknoloji A.Ş. | 80.8% | Rastgele üretildi |
| XYZ Gayrimenkul A.Ş. | 37.5% | Rastgele üretildi |
| XYZ Sigorta A.Ş. | 69.6% | Rastgele üretildi |
| XYZ Sağlık A.Ş. | 47.9% | Rastgele üretildi |
| XYZ Perakende A.Ş. | 26.2% | Rastgele üretildi |
| XYZ İnşaat A.Ş. | 42.1% | Rastgele üretildi |
| XYZ Medya A.Ş. | 57.5% | Rastgele üretildi |

**Commits:**
- `5f57a86` — feat: Company groups + historical comparison + Excel import
- `78c4063` — fix: Use raw SQL for assessment_items insert (D1 100 param limit)
- `8a20801` — ci: Add GitHub Actions workflow for automatic deploy on push

---

### Phase 10: Bug Fixes, Visual Improvements & Reporting Center (Gün 24)
**Tamamlanma:** 2026-02-19

✅ Tamamlanan:

**Fonksiyonel Buglar:**
- **A1 — VendorDetail Criticality Bug:** `editForm`'daki `risk_level` + `risk_tier` alanları kaldırıldı, tek `criticality_level` dropdown'a birleştirildi (low/medium/high/critical). Save işlemi artık DB'ye doğru kaydediyor.
- **A2 — Grup Şirketleri Tam Ayrımı:** `GET /api/vendors` endpoint'ine `exclude_grouped=true` query param desteği eklendi (`WHERE group_id IS NULL` filtresi). Frontend `vendors.ts` ve `Vendors.shadcn.tsx` güncellendi. Vendors listesi artık sadece external tedarikçileri gösteriyor; grup şirketleri Groups menüsünde yönetiliyor.

**Görsel Buglar:**
- **B1 — CompanyGroups Kartları:** Kart arkaplan `rgba(255,255,255,0.03)` → `rgba(255,255,255,0.06)`, border `rgba(255,255,255,0.07)` → `rgba(255,255,255,0.12)`, stats text `#64748B` → `#94A3B8`
- **B2 — CompanyGroupDetail Tablo:** Header cell `#475569` → `#94A3B8`, assessment name alt text güncellendi
- **B3 — Vendors Tablo Header:** Hardcoded `#F8FAFC` → `var(--surface-1)` (dark mode uyumlu)
- **B4 — Dark Mode Secondary Text:** `index.css` dark mode `--text-3: #64748B` → `#94A3B8`

**Assessment Report İyileştirmeleri:**
- **Cover Section:** Sayfanın üstünde assessment adı, vendor adı, tarih, durum büyük ve temiz gösteriliyor
- **Büyük Overall Score:** Circle 180×180 → 220×220, skor font text-4xl → text-5xl
- **Güçlü Section Başlıkları:** `border-b` divider'lar, kalın accent bar (h-5)
- **Export PDF:** `window.print()` tetikleyen "Export PDF" butonu eklendi
- **@media print CSS:** Kapsamlı print kuralları — sidebar/nav/buton gizleme, beyaz arkaplan, A4 format, sayfa kırılmaları
- **Export Excel (.csv):** Structured CSV (function/category header grupları), BOM eklendi, dosya adı `assessment-report-[name]-[date].csv`

**Reporting Center:**
- **İsim Değişikliği:** "Exports" → "Reporting Center" (sayfa başlığı + sidebar), "Export Types" → "Available Reports", badge "6 reports available"
- **6 Export Tipi Aktifleştirildi:** Tüm "Coming Soon" badge'leri kaldırıldı
  1. Assessment Reports (PDF) — assessment seçici + rapor sayfasına yönlendirme
  2. Assessment Data (CSV) — assessment seçici + items CSV download
  3. Comparison Reports — 2 assessment seçici + comparison sayfasına yönlendirme
  4. Vendor Scorecards (CSV) — vendor seçici + vendor özet CSV
  5. Executive Dashboard (CSV) — tüm vendor'ların özet skorları CSV
  6. Audit Evidence Package (CSV) — assessment seçici + evidence listesi CSV
- `downloadCSV()` helper fonksiyonu (blob + trigger download)
- Component mount'ta assessments + vendors state yükleniyor
- Per-card loading state + inline hata mesajları

**Medium Features:**
- **AssessmentChecklist "More Details":** Her item row'a ChevronDown toggle eklendi. Tıklayınca subcategory açıklaması + örnek kanıt türleri içeren expandable panel açılıyor (API'den `subcategory.description`, yoksa statik fallback)
- **AssessmentWizard Genelleştirme:** Product-specific isimler generic hale getirildi:
  - "Entra ID / Azure AD" → "Identity & Access Management (IAM)"
  - "Microsoft Defender" → "Endpoint & Cloud Security"
  - "AWS Security" → "Cloud Infrastructure Security"
  - Tüm 15 adıma vendor-neutral guidance text eklendi (Okta/AD/Qualys/Splunk gibi araçları örnek olarak referans veriyor ama bağlı değil)

**Commit:** `090097b` — fix: Bug fixes, visual improvements, and reporting center overhaul

---

### Phase 11: Dark Mode Contrast & Visibility Audit (Gün 25)
**Tamamlanma:** 2026-02-20

✅ Tamamlanan:

**CSS Token Düzeltmesi (index.css):**
- `--t-text-muted: #64748B` → `#94A3B8` (dark mode'da slate-500 ~3.7:1 kontrastı yetersizdi; slate-400 ~4.5:1 AA standardını karşılıyor)
- `--t-text-faint: #475569` → `#64748B` (slate-700 dark bg üzerinde neredeyse görünmezdi; artık sadece placeholder/disabled için kullanılıyor)
- Bu iki değişiklik T token sistemi kullanan tüm sayfaları (Vendors, Assessments, Dashboard, Exports, VendorDetail vb.) otomatik olarak düzeltiyor

**Vendors Tablo Header (Vendors.shadcn.tsx):**
- Background: `var(--surface-1)` → `var(--card)` (kart ile uyumlu, harsh ayrım yok)
- Border-bottom: `T.borderLight` → `1px solid var(--border)` (semantik token)
- Header text: `T.textMuted` → `var(--text-2)` (açık ve koyu modda uygun kontrast)

**CompanyGroups Kartları (CompanyGroups.shadcn.tsx):**
- Kart default state: `rgba(255,255,255,0.06)` bg + `rgba(255,255,255,0.12)` border → `var(--card)` + `var(--border)` + `var(--shadow-xs)` (ışık ve karanlık modda görünür kart)
- Hover state restore: artık rgba yerine `var(--card)` ve `var(--border)` restore ediyor
- Hover gölge efekti: `0 4px 16px rgba(99,102,241,0.15)` eklendi
- Grup adı: `#CBD5E1` → `var(--text-1)` (maksimum kontrast)
- Sektör/açıklama/şirket sayısı: `#94A3B8` → `var(--text-2)` (CSS var)
- ChevronRight ikonu + boş durum ikonu: `#334155` → `var(--text-3)` (neredeyse görünmezden görünür)
- Loading/boş durum metni: `#64748B` / `#475569` → `var(--text-2)`

**CompanyGroupDetail Tablo ve Stat Kartlar (CompanyGroupDetail.shadcn.tsx):**
- Stat kartlar: `rgba(255,255,255,0.03)` bg + near-invisible border → `var(--card)` + `var(--border)` (proper elevated cards)
- Karşılaştırma tablosu container: aynı opacity fix → `var(--card)` + `var(--border)`
- Tablo başlığı "CSF Function Scores by Company": `#CBD5E1` → `var(--text-1)`, fontWeight 700→600
- Tüm `<th>` header hücreleri: `#94A3B8` → `var(--text-2)`
- Tablo header row border: `rgba(255,255,255,0.06)` → `var(--border)`
- Şirket isimleri (tbody): `#E2E8F0` → `var(--text-1)`, fontWeight 600→500
- Assessment alt metni: `#64748B` → `var(--text-3)` (metadata için uygun)
- ScoreCell placeholder `—`: `#334155` → `var(--text-3)`
- Back button, loading, description metinleri: `#64748B` → `var(--text-2)`

**Commit:** `3659bf7` — fix: Improve dark mode text contrast and card/table visibility

---

### Phase 12: Groups → Group Companies Rename & Conceptual Clarification (Gün 26)
**Tamamlanma:** 2026-02-21

✅ Tamamlanan:

**Kavramsal Düzeltme:**
- Önceki model yanlıştı: "Groups" kullanıcı tarafından oluşturulan gruplar gibi görünüyordu
- Doğru model: Bunlar organizasyonun altındaki **iç bağlı ortaklıklar (subsidiaries)** — dış tedarikçi değil
- Şirket yapısı: Parent Organization → Subsidiary A, Subsidiary B, Subsidiary C

**UI Label Değişiklikleri:**

| Konum | Önce | Sonra |
|-------|------|-------|
| Sidebar nav | `Groups` | `Group Companies` |
| Sayfa başlığı | `Company Groups` | `Group Companies` |
| Sayfa alt başlığı | `Manage holding structures...` | `Internal subsidiaries and group entities under your organization` |
| Ekle butonu | `New Group` | `Add Subsidiary` |
| Modal başlığı | `New Company Group` | `Add Group Company` |
| Modal submit | `Create Group` | `Add Company` |
| Boş durum metni | `No company groups yet...` | `No group companies yet. Add your first subsidiary...` |
| Geri linki | `Back to Groups` | `Back to Group Companies` |
| Vendors bilgi notu | `...under the Groups menu` | `...under Group Companies` |

**Filtreleme (Phase 10'dan beri aktif — değişiklik yok):**
- `vendorsApi.list()` her zaman `exclude_grouped: 'true'` gönderiyor
- Backend `WHERE group_id IS NULL` filtresi uyguluyor
- Vendors sayfası: sadece external tedarikçiler görünür
- Group Companies sayfası: sadece internal bağlı ortaklıklar görünür

**Değişen Dosyalar:**
- `frontend/src/components/layout/Sidebar.shadcn.tsx`
- `frontend/src/pages/CompanyGroups.shadcn.tsx`
- `frontend/src/pages/CompanyGroupDetail.shadcn.tsx`
- `frontend/src/pages/Vendors.shadcn.tsx`

**Commit:** `ae6e472` — refactor: Rename Groups → Group Companies throughout UI

---

### Phase 13: Wizard Implementation Guide + Checklist Enhanced Details (Gün 27)
**Tamamlanma:** 2026-02-21

✅ Tamamlanan:

**Feature 1 — AssessmentWizard: Collapsible Implementation Guide**
- Her wizard adımının info banner'ına `📘 Implementation Guide` toggle butonu eklendi
- Tıklayınca araç bazlı kanıt toplama rehberi açılır (3-4 araç/adım)
- `STEP_GUIDANCE` constant: 15 adım × 3-4 araç = ~50 tool-specific guidance entry
- Örnek araçlar: Entra ID, Okta, CrowdStrike, AWS Security Hub, Splunk, Qualys, KnowBe4, vb.
- Stil: `T.accentLight` arka plan, `3px solid T.accent` sol kenar, `T.accentBorder` border
- Adım değişiminde `useEffect` ile otomatik kapanır (`setShowGuide(false)`)

**STEP_GUIDANCE araç başvuruları (her adım için):**

| Adım | Araçlar |
|------|---------|
| 0 — Governance & Policy | SharePoint, Azure Policy, AWS Organizations, ServiceNow GRC |
| 1 — IAM | Entra ID/Azure AD, Okta, Google Workspace, AWS IAM |
| 2 — Endpoint & Cloud Security | Microsoft Defender, CrowdStrike, SentinelOne, Palo Alto XDR |
| 3 — Cloud Infrastructure | AWS Security Hub, Defender for Cloud, Google SCC, Terraform |
| 4 — Network Security | Cisco/Meraki, Palo Alto, FortiGate, AWS/Azure VPC |
| 5 — Endpoint Protection | Intune+Defender, CrowdStrike, Symantec, Carbon Black |
| 6 — Data Protection | Microsoft Purview, AWS Macie, Google DLP, Varonis |
| 7 — Access Control | Azure PIM, CyberArk, BeyondTrust, Active Directory |
| 8 — Security Monitoring | Microsoft Sentinel, Splunk, QRadar, Elastic SIEM |
| 9 — Incident Response | ServiceNow/Jira, PagerDuty, Palo Alto XSOAR |
| 10 — Backup & Recovery | Veeam, Azure/AWS Backup, Commvault |
| 11 — Vulnerability Mgmt | Qualys VMDR, Tenable/Nessus, Rapid7, Defender VM |
| 12 — Vendor Risk | ServiceNow GRC, OneTrust/BitSight, SAP Ariba |
| 13 — Security Awareness | KnowBe4, Proofpoint, Mimecast |
| 14 — Business Continuity | ServiceNow BCM, Fusion Risk, IBM OpenPages |

**Feature 2 — AssessmentChecklist: Enhanced ℹ️ Details Panel**
- ChevronDown icon butonu → `ℹ️ Details` metin butonu olarak değiştirildi
- Expanded panel 3 kademeli yapıya dönüştürüldü:
  1. **Control ID badge** (accent rengi, monospace) + **tam kontrol adı** (subcategory.name)
  2. **Açıklama** (subcategory.description, DB'den)
  3. **Evidence examples** kutusu (policies, audit logs, SOC 2, ISO 27001 vb.)
  4. **Function-specific auditor tip** sarı warning kutusunda — CSF function prefix'ine göre (GV/ID/PR/DE/RS/RC)
- `getTipForItem(subcategoryId)` fonksiyonu: 6 CSF fonksiyonu için özel denetçi ipuçları

**Değişen Dosyalar:**
- `frontend/src/pages/AssessmentWizard.shadcn.tsx` — STEP_GUIDANCE const (15 adım), showGuide state, useEffect reset, guide UI
- `frontend/src/pages/AssessmentChecklist.shadcn.tsx` — getTipForItem() fonksiyonu, Details butonu, gelişmiş panel

**Commit:** `99cf8d3` — feat: Add Implementation Guide to Wizard and enhanced Details panel to Checklist

---

### Phase 20: Assessment Type/Company Tags (Gün 34)
**Tamamlanma:** 2026-02-19

✅ Tamamlanan:

**Sorun:** Assessment listelerinde hangi tipin (Vendor / Group Company / Self) hangi şirkete ait olduğu görsel olarak belli değildi. Ham `assessment_type` metni düz monospace badge olarak gösteriliyordu.

**Çözüm — İki Yeni Tag:**

1. **Type Tag** (renk kodlu):
   - `assessment_type === 'organization'` → **"Self"** — indigo `rgba(99,102,241,0.12)` bg / `#6366F1` text
   - `assessment_type === 'vendor'` + `vendor.group_id` set → **"Group Company"** — blue `rgba(59,130,246,0.12)` / `#3B82F6`
   - `assessment_type === 'vendor'` + no `group_id` → **"Vendor"** — purple `rgba(139,92,246,0.12)` / `#8B5CF6`

2. **Company Name Tag** (gri pill):
   - Vendor/Group Company assessments için şirket ismini gri pill tag olarak gösteriyor
   - `background: #F1F5F9`, `color: T.textSecondary`, `maxWidth: 150-200px`, `textOverflow: ellipsis`

**Eklenen Yerler:**
- **Dashboard** (`Dashboard.shadcn.tsx`): Assessment adının altına company name tag; Type sütununda yeni renkli type tag
- **Assessments kartları** (`Assessments.shadcn.tsx`): Sol üst köşedeki ham type badge → renkli type tag; vendor name plain text → gri company pill
- **AssessmentDetail** (`AssessmentDetail.shadcn.tsx`): Metadata satırındaki eski type badge ve plain vendor text → type tag + company pill yan yana

**Type Fixes:**
- `frontend/src/types/index.ts` — `Vendor` interface'e `group_id?: string` eklendi (backend'de var ama frontend tipi eksikti)

**Dosyalar:**
- `frontend/src/types/index.ts`
- `frontend/src/pages/Dashboard.shadcn.tsx`
- `frontend/src/pages/Assessments.shadcn.tsx`
- `frontend/src/pages/AssessmentDetail.shadcn.tsx`

**Commit:** `cae1b73`

---

### Phase 19: Analytics Page — Real Data + Working Date Filter (Gün 33)
**Tamamlanma:** 2026-02-19

✅ Tamamlanan:

**Kök Neden:** `Analytics.shadcn.tsx` tamamen statik hardcoded demo verileri kullanıyordu. `useState`, `useEffect`, API çağrısı, date filter state'i yoktu. Header'daki "Last 6 months" sadece statik bir `<div>`'di, interaktif değildi.

**Yeniden Yazım — Gerçek API Verisi:**
- `GET /api/assessments?organization_id=demo-org-123` — mount'ta tüm assessments yükleniyor
- `GET /api/vendors?organization_id=demo-org-123&exclude_grouped=true` — tüm vendors
- `GET /api/assessments/:id/items` — seçili range'deki en son org assessment'ın items'ları (radar + gap için)
- Assessments client-side `assessment_type` alanına göre org/vendor olarak ayrılıyor

**Date Range Filter (5 seçenek):**
- Last 7 days, Last 30 days (default), Last 90 days, Last 12 months, Custom range
- Dropdown: chevron animasyon, dışarı tıklamada kapanma (`mousedown` event listener + `useRef`)
- Custom range: FROM/TO date picker + Apply butonu
- `getRangeDates()` → `{ from: number; to: number }` (Unix ms)

**Tüm Chart'lar Range'e Reaktif:**
- `filteredAssessments` = `allAssessments.filter(a => a.created_at >= from && a.created_at <= to)`
- **Trend (AreaChart):** Filtered assessments → aylık gruplama → org/vendor avg score line
- **Radar:** Latest org assessment items → function bazında avg (compliant=100, partial=50, non_compliant=0)
- **Gap Analysis (horizontal BarChart):** Latest items → top 5 kategori by non_compliant+partial count
- **Vendor Risk:** Vendors + filtered vendor assessments → her vendor için en son skor
- **Score by CSF Function (BarChart):** Radar ile aynı items, bar chart görünümü
- **KPIs:** Filtered data'dan hesaplanan avg score, completed count, open gaps, high-risk vendor count; prev period comparison (önceki dönemin avg'ı ile delta hesabı)

**"No data for this period" State:**
- Orange banner: range'de hiç assessment yoksa
- Her chart bağımsız: dashed border + BarChart3 ikonu + mesaj
- Gap chart akıllı mesaj: "no data" vs "no gaps found — great compliance!" vs "no org assessment in range"

**Loading States:**
- Initial load: KPI skeleton (shimmer animasyon) + chart spinner
- Item yükleme: Radar, Gap, Score by Function chart'larında spinner overlay
- Race condition koruması: `fetchIdRef` sayaç — stale fetch sonuçları atılıyor

**Animasyonlar:**
- `@keyframes analytics-shimmer` — KPI skeleton için
- `@keyframes analytics-spin` — chart spinner için
- `ANIM_CSS` string sabiti olarak dosya sonunda, `<style>` tag'ine inject ediliyor

**Dosya:** `frontend/src/pages/Analytics.shadcn.tsx` — tam yeniden yazım (~350 satır)

---

### Phase 18: Company Group Subsidiary CRUD (Gün 32)
**Tamamlanma:** 2026-02-19

✅ Tamamlanan:

**Kritik Veri Modeli Düzeltmesi:**
- `CompanyGroups.shadcn.tsx` "Add Subsidiary" butonu aslında `company_groups` tablosuna satır ekliyordu (yani bir GROUP container oluşturuyordu, subsidiary değil). Bu davranış korundu ama buton/modal etiketi düzeltildi: "Add Subsidiary" → **"New Group"**, modal başlığı "Add Group Company" → **"New Group"**, submit butonu "Add Company" → **"Create Group"**.
- Gerçek subsidiary oluşturma (group altında vendor) artık `CompanyGroupDetail.shadcn.tsx` üzerinden yapılıyor.

**Backend:**
- `worker/src/routes/vendors.ts` — POST `/api/vendors` endpoint'ine `group_id: body.group_id` eklendi. Daha önce `group_id` body'den okunuyordu ama insert'e dahil edilmiyordu (sessiz veri kaybı).

**Frontend API:**
- `frontend/src/api/vendors.ts` — `CreateVendorData` interface'ine `group_id?: string` eklendi.

**CompanyGroupDetail.shadcn.tsx — Tam Yeniden Yazım:**
- **Add Subsidiary butonu** (header'da, indigo) → modal açar → `vendorsApi.create({ ...form, group_id: id! })`
- **Subsidiary Companies Management Table** (yeni bölüm, CSF tablosunun üstünde):
  - Kolon: Company Name (tıklanabilir → `/vendors/:id`, ChevronRight ikonu), Risk Level badge, Industry, Score, Actions
  - Risk Level badge: color-coded (critical=kırmızı, high=turuncu, medium=sarı, low=yeşil), `CriticalityBadge` componenti
  - **Edit butonu** (Pencil ikonu, gri) → modal açar, form önceden dolu → `vendorsApi.update()`
  - **Delete butonu** (Trash2 ikonu, kırmızı tonlu) → confirmation dialog açar → `vendorsApi.delete()`
- **Add/Edit Modal** — Alanlar: Company Name*, Risk Level dropdown, Industry, Contact Name, Contact Email + Contact Phone (yan yana grid), Notes (textarea)
- **Delete Confirmation Dialog** — Kırmızı kenarlıklı dialog, "Remove & Delete" butonu
- **Success toasts** — sağ üstte yeşil banner, 3 saniye sonra otomatik kapanıyor (Add, Update, Delete için)
- CSF Function Scores comparison table korundu (altta)

**Dosyalar:**
- `worker/src/routes/vendors.ts` — group_id POST fix
- `frontend/src/api/vendors.ts` — CreateVendorData.group_id eklendi
- `frontend/src/pages/CompanyGroups.shadcn.tsx` — buton/modal etiket düzeltmesi
- `frontend/src/pages/CompanyGroupDetail.shadcn.tsx` — tam yeniden yazım (subsidiary CRUD)

---

### Phase 17: VendorDetail Profile Editing Bug Fixes (Gün 31)
**Tamamlanma:** 2026-02-19

✅ Tamamlanan — Tespit edilen 6 bug ve çözümleri:

**Bug 1 — Sessiz veri kaybı: `description` → `notes` yanlış mapping (KRİTİK)**
- `editForm.description` kullanılıyordu ama DB şeması sütunu `notes`. Drizzle ORM `.set()` içinde bilinmeyen anahtarları sessizce görmezden geliyor — tüm "Description" değişiklikleri DB'ye hiç yazılmıyordu.
- Düzeltme: `editForm` artık `notes` kullanıyor, display bölümü `vendor.notes` okuyor.

**Bug 2 — Eksik form alanları**
- `industry`, `contact_phone`, `vendor_status` — hepsi DB şemasında, `UpdateVendorData`'da ve `Vendor` tipinde vardı ama edit formda hiç görünmüyordu.
- Düzeltme: 3 yeni alan eklendi: Industry (text), Contact Phone (tel), Status (select: active/inactive/under_review/terminated).

**Bug 3 — Başarı bildirimi yok / `alert()` hata mesajı**
- Save başarılı olunca form sessizce kapanıyordu. Hata durumunda `alert()` kullanılıyordu.
- Düzeltme: Hata durumunda inline kırmızı banner. Başarı durumunda 3 saniye sonra otomatik kapanan yeşil toast banner.

**Bug 4 — Optimistic UI yok: risk badge kaydetmeden sonra stale**
- `loadData()` async olduğu için badge kaydetme sonrası kısa süre eski değeri gösteriyordu.
- Düzeltme: API response'undan gelen `updated` vendor ile `setVendor({ ...vendor, ...updated })` çağrısı — badge anında güncelleniyor.

**Bug 5 — `tier` display önceliği yanlış**
- `vendor.risk_tier || vendor.criticality_level` — `risk_tier` DB şemasında yok, her zaman `undefined`. `criticality_level` fallback olarak kullanılıyordu.
- Düzeltme: `vendor.criticality_level || vendor.risk_tier` olarak düzeltildi.

**Bug 6 — Save butonu loading state'i yok**
- Düzeltme: `saving` state ile buton disabled yapıldı ve "Saving…" metni gösterildi.

**Değişen Dosyalar:**
- `frontend/src/pages/VendorDetail.shadcn.tsx` — 186 ekleme / 47 silme

**Commit:** `cf38745` — fix: Fix all profile editing bugs in VendorDetail

---

### Phase 16: Reporting Center Revamp with Real PDF/Excel Generation (Gün 30)
**Tamamlanma:** 2026-02-19

✅ Tamamlanan:

**Yeni Bağımlılıklar:**
- `jspdf@4.2.0` + `jspdf-autotable@5.0.7` — programmatic PDF generation

**4 Aktif Report Tipi (Exports.shadcn.tsx tam yeniden yazıldı):**

| Report | Format | İçerik |
|--------|--------|--------|
| Organization Compliance Summary | PDF | Header bar · büyük skor · 4 stat box · function breakdown autoTable · findings autoTable |
| Vendor Risk Report | Excel | Vendors sheet (name/industry/criticality/status/score) + Summary sheet (toplam/aktif/critical/avg) |
| Assessment Detail Export | PDF | Assessment seçici dropdown → seçilen assessment için aynı jsPDF layout |
| Group Companies Overview | Excel | Groups sheet + Companies sheet (tüm bağlı şirketler + skorları) |

**Teknik Detaylar:**
- `buildAssessmentPDF(assessment, items, doc)` helper — hem org summary hem assessment detail için kullanılıyor
- `jsPDF.roundedRect()` + `autoTable()` ile renkli stat kutucuklar ve tablo
- `XLSX.utils.aoa_to_sheet()` + `XLSX.utils.book_append_sheet()` ile çok-sayfalı Excel
- Vendor Risk Report: `exclude_grouped` filtresi olmadan tüm vendor'ları çekiyor (axios direkt)
- Group Overview: her grup için `companyGroupsApi.get(id)` paralel fetch → vendors listesi
- Per-card loading state, per-card error message
- Format badge: PDF=red-subtle, Excel=green-subtle
- T token styling (dark mode uyumlu)

**Kaldırılan:**
- Eski 6 tip (Assessment Report navigate, Comparison navigate, Audit Evidence CSV, Executive Dashboard CSV, Vendor Scorecard CSV) → 4 gerçek download tipine indirildi
- Static `recentExports` demo tablo kaldırıldı
- Quick stats kart mock'ları kaldırıldı

**Değişen Dosyalar:**
- `frontend/src/pages/Exports.shadcn.tsx` — tam yeniden yazıldı
- `frontend/package.json` — jspdf + jspdf-autotable eklendi

**Commit:** `d2dfaba` — feat: Revamp Reporting Center with jsPDF generation and 4 functional report types

---

### Phase 15: Historical Assessment Comparison Enhancements (Gün 29)
**Tamamlanma:** 2026-02-19

✅ Tamamlanan:

**VendorDetail.shadcn.tsx — Score Trend & Filters:**
- SVG bar chart → recharts **AreaChart** (line chart with gradient fill, sorted chronologically by `created_at`)
- Added **status filter** dropdown (All / Completed / In Progress / Draft)
- Added **date range filters** (From / To date inputs) using `useMemo` for computed `filteredAssessments`
- "Clear" button appears when any filter is active
- Empty state: "No assessments match the current filters" when filters exclude all results
- `useMemo` + `filteredAssessments` replaces direct `assessments.map` in history list

**AssessmentHistoryComparison.shadcn.tsx — Full Rewrite:**
- Migrated all hardcoded hex colors and font names → **T design tokens**
- Added **per-function grouped BarChart** (recharts): Baseline (gray `#64748B`) vs Current (indigo `#6366F1`) grouped by CSF function (GV/ID/PR/DE/RS/RC)
- `functionChartData` useMemo: groups items by function prefix, computes avg score (compliant=1, partial=0.5, else=0)
- Added **`StatusBadge` component**: color-coded pill badges (green/amber/red/gray) for compliant/partial/non-compliant/not-assessed
- Items table row highlighting uses T token `T.success`/`T.danger` + `08` alpha instead of hardcoded rgba
- Selectors, summary cards, filter controls all use `card`, `T.fontSans`, `T.textMuted`, etc.

**Değişen Dosyalar:**
- `frontend/src/pages/VendorDetail.shadcn.tsx` — AreaChart + filters
- `frontend/src/pages/AssessmentHistoryComparison.shadcn.tsx` — full rewrite

**Commit:** `22d13ad` — feat: Add recharts AreaChart trend + date/status filters + per-function comparison BarChart

---

### Phase 14: Assessment Report Tam Yeniden Tasarımı (Gün 28)
**Tamamlanma:** 2026-02-21

✅ Tamamlanan:

**Eski Durum:**
- Basit, dağınık layout; doğrudan okunması güç
- Yalnızca bir function bar chart ve küçük bir compliance circle
- AI executive summary kartı baskın, geri kalan bölümler zayıf

**Yeni Tasarım — 4 Ana Bölüm:**

**Bölüm 1 — Header:**
- Assessment adı (`fontSize: 26, fontWeight: 700`)
- Type badge (Organization/Vendor Assessment) + Status badge (Completed/In Progress)
- Meta row: Vendor · Created · Last Updated · Completed · Framework (NIST CSF 2.0)
- Sağ üstte donut ring: genel compliance % merkezdé

**Bölüm 2 — Executive Summary (4 kart):**
- Total Controls / Compliant / Partially Compliant / Non-Compliant
- Her kart: büyük sayı (fontMono) + renkli % badge
- Grid layout: 4 eşit kolon

**Bölüm 3 — CSF Function Breakdown:**
- 6 CSF fonksiyonu için satır: kod badge + adı + % + chevron
- Stacked horizontal bar: yeşil=compliant, turuncu=partial, kırmızı=non-compliant, gri=not-assessed
- Legend: her segment için count
- Tıklanabilir expand: kategori başlıkları + her subcategory için status badge

**Bölüm 4 — Findings Table:**
- Non-compliant + partial tüm itemlar
- Sıralanabilir kolonlar: Control ID, Control Name, Status (her kolona tıkla asc/desc)
- Kolon başlığında ChevronUp/Down/ChevronsUpDown ikonları
- Her satır: ID, subcategory adı (+ function·category alt metin), renkli status badge, notes

**Exportlar:**
- **Export PDF:** `window.print()` → `@media print` CSS (A4, sidebar/nav gizleme, `break-inside: avoid`)
- **Export Excel:** SheetJS (`xlsx` paketi) → gerçek `.xlsx` dosyası, 3 sheet:
  1. `Summary` — genel metrikler
  2. `All Controls` — 120 item tam liste
  3. `Findings` — sadece non-compliant + partial

**Yeni Bağımlılık:**
- `xlsx` (SheetJS) `^0.18.5` — frontend/package.json'a eklendi

**Kaldırılan:**
- `ExecutiveSummaryCard` component kullanımı (AI summary ayrı component'e bırakıldı)
- `aiApi` import ve `generateSummary` işlevi rapor sayfasından çıkarıldı
- Eski `exportCSV` fonksiyonu `exportExcel` ile değiştirildi

**Değişen Dosyalar:**
- `frontend/src/pages/AssessmentReport.tsx` — tamamen yeniden yazıldı (598 ekle / 380 sil)
- `frontend/package.json` — `xlsx` eklendi
- `frontend/package-lock.json` — güncellendi

**Commit:** `b34632b` — feat: Redesign AssessmentReport into professional 4-section report layout

---

## Teknik Stack ve Bağımlılıklar

### Backend (Worker)

**Runtime:** Cloudflare Workers (Node.js compatible)

**Dependencies:**
```json
{
  "@anthropic-ai/sdk": "^0.74.0",
  "@tsndr/cloudflare-worker-jwt": "^3.2.1",
  "drizzle-orm": "^0.45.1",
  "hono": "^4.11.9"
}
```

**Dev Dependencies:**
```json
{
  "@cloudflare/workers-types": "^4.20260210.0",
  "@types/node": "^25.2.2",
  "drizzle-kit": "^0.31.9",
  "typescript": "^5.9.3",
  "wrangler": "^4.64.0"
}
```

**Önemli Worker Kütüphaneleri:**
- `lib/scoring.ts` - Assessment scoring algorithm
- `lib/storage.ts` - R2 file operations + JWT presigned URLs
- `lib/ai.ts` - Anthropic Claude client
- `lib/invitation-tokens.ts` - JWT magic link generation
- `lib/rate-limiter.ts` - KV-based rate limiting
- `lib/audit-logger.ts` - Audit trail logging
- `lib/assessment-cloning.ts` - Vendor assessment cloning (batch)

---

### Frontend

**Build Tool:** Vite 7.3.1
**Framework:** React 19.2.0

**Dependencies:**
```json
{
  "axios": "^1.13.5",
  "framer-motion": "^12.34.0",
  "lucide-react": "^0.563.0",
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.13.0",
  "xlsx": "^0.18.5"
}
```

**Dev Dependencies:**
```json
{
  "@tailwindcss/postcss": "^4.1.18",
  "tailwindcss": "^4.1.18",
  "typescript": "~5.9.3",
  "vite": "^7.3.1"
}
```

**Toplam Kod:** ~21,000 satır TypeScript/TSX

---

## Database Schema ve Migrasyonlar

### Core Tables (15 tablo)

1. **organizations** - Organizasyon bilgileri
2. **profiles** - Kullanıcı profilleri
3. **company_groups** - Holding/grup şirketi entity'si *(Migration 0005 ile eklendi)*
4. **vendors** - Vendor listesi (criticality, risk score, group_id FK)
5. **assessments** - Assessment kayıtları
6. **vendor_assessment_templates** - Assessment şablonları
7. **csf_functions** - NIST CSF Functions (6 tane)
8. **csf_categories** - NIST CSF Categories (22 tane)
9. **csf_subcategories** - NIST CSF Subcategories (120 tane)
10. **assessment_items** - Assessment item responses
11. **assessment_wizard_progress** - Wizard ilerleme durumu
12. **evidence_files** - R2'de saklanan dosya metadata
13. **vendor_assessment_invitations** - Magic link invitations
14. **vendor_audit_log** - Vendor portal audit trail
15. **action_plan_items** - İyileştirme aksiyon planları

### Migration History

**0001_initial_schema.sql** (2026-02-10)
- 14 tablo oluşturuldu
- Indexes ve foreign keys

**0002_seed_csf_data.sql** (2026-02-10)
- NIST CSF 2.0 data
- 6 functions, 22 categories, 120 subcategories

**0003_seed_demo_data.sql** (2026-02-10)
- Demo organization: `demo-org-123`
- Demo user: `demo-user-456`
- 3 vendor (CloudHost Pro, PaymentPro, DataBackup)
- 2 assessment (240 items)

**0004_vendor_invitations.sql** (2026-02-11)
- `vendor_assessment_invitations` table
- `vendor_audit_log` table
- `assessments.linked_assessment_id` field

**0005_company_groups.sql** (2026-02-18)
- `company_groups` table (id, organization_id, name, description, industry, logo_url, timestamps)
- `vendors.group_id` TEXT column (nullable FK → company_groups.id ON DELETE SET NULL)
- Index: `idx_company_groups_org`, `idx_vendors_group`

---

## API Endpoints

### Health Check
- `GET /health` - Worker status

### CSF Reference Data
- `GET /api/csf/functions` - List all CSF functions (6)
- `GET /api/csf/categories?functionId=GV` - List categories (22)
- `GET /api/csf/subcategories?categoryId=GV.OC` - List subcategories (120)
- `GET /api/csf/subcategories/:id` - Get specific subcategory

### Vendors
- `GET /api/vendors?organization_id=xxx` - List vendors
- `POST /api/vendors` - Create vendor
- `GET /api/vendors/:id` - Get vendor details
- `PATCH /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor
- `GET /api/vendors/:id/stats` - Get vendor statistics (assessment count, avg score)

### Assessments
- `GET /api/assessments?organization_id=xxx&type=organization` - List assessments
- `POST /api/assessments` - Create assessment (auto-creates 120 items + 15 wizard steps)
- `GET /api/assessments/:id` - Get assessment with stats
- `PATCH /api/assessments/:id` - Update assessment
- `DELETE /api/assessments/:id` - Delete assessment
- `GET /api/assessments/:id/items?functionId=GV` - Get items with CSF data
- `PATCH /api/assessments/:id/items/:itemId` - Update item (auto-recalculates score)
- `POST /api/assessments/:id/calculate-score` - Manual score recalculation

### Evidence
- `POST /api/evidence/upload` - Upload file to R2 (multipart/form-data)
- `GET /api/evidence/download/:token` - Download with JWT token
- `DELETE /api/evidence/:id` - Delete file from R2 and database
- `GET /api/evidence/item/:itemId` - List files for assessment item
- `GET /api/evidence/assessment/:assessmentId` - List all files for assessment

### AI Services
- `POST /api/ai/analyze` - Analyze evidence for subcategory
- `POST /api/ai/gap-analysis` - Generate gap recommendations
- `POST /api/ai/executive-summary` - Generate executive summary

### Vendor Invitations (Magic Link)
- `POST /api/vendor-invitations` - Send invitation (creates magic link)
- `GET /api/vendor-invitations/validate/:token` - Validate & consume token (public)
- `PATCH /api/vendor-invitations/:token/items/:itemId` - Update item (public, session auth)
- `POST /api/vendor-invitations/:token/complete` - Submit assessment (public, session auth)
- `GET /api/vendor-invitations/:organizationAssessmentId/comparison` - Get comparison
- `GET /api/assessments/:id/invitation` - Get invitation status
- `POST /api/vendor-invitations/:invitationId/revoke` - Revoke invitation

**Rate Limits:**
- Token validation: 10 req/min per IP
- Status updates: 30 req/min per IP

### Company Groups
- `GET /api/company-groups?organization_id=xxx` — Grup listesi (vendor_count dahil)
- `POST /api/company-groups` — Grup oluştur
- `GET /api/company-groups/:id` — Grup detayı + üye vendor'lar
- `PATCH /api/company-groups/:id` — Grup güncelle
- `DELETE /api/company-groups/:id` — Grup sil (vendor'lar orphan kalır, group_id=null)
- `GET /api/company-groups/:id/summary` — CSF function bazında şirket karşılaştırması

### Import
- `POST /api/import/preview` — Payload doğrula, tahmini skorları döndür (DB write yok)
- `POST /api/import/confirm` — Grup + vendor + assessment + item'ları oluştur

**Import Payload:**
```json
{
  "organization_id": "demo-org-123",
  "group_name": "XYZ Holding Grubu",
  "group_id": "optional-existing-group-id",
  "companies": [
    { "name": "Şirket A", "items": [{ "subcategory_id": "ID.AM-01", "status": "compliant", "notes": "..." }] }
  ],
  "assessment_name": "2023 Değerlendirmesi",
  "assessment_date": "2023-12-31"
}
```

### Assessment Compare
- `GET /api/assessments/compare?ids=id1,id2` — İki assessment'ı subkategori bazında karşılaştır (delta, improved/declined/unchanged sayıları)

---

## Frontend Yapısı

### Pages (31 sayfa)

**Main Pages:**
- `Dashboard.tsx` / `Dashboard.new.tsx` - Ana dashboard (stats, charts)
- `Assessments.tsx` / `Assessments.new.tsx` - Assessment listesi
- `Vendors.tsx` / `Vendors.new.tsx` - Vendor listesi

**Assessment Pages:**
- `NewAssessment.tsx` / `NewAssessment.new.tsx` - Assessment oluştur
- `AssessmentDetail.tsx` / `AssessmentDetail.new.tsx` - Assessment detayı
- `AssessmentWizard.tsx` - 15-step guided assessment
- `AssessmentChecklist.tsx` - Assessment checklist view
- `AssessmentReport.tsx` - Assessment raporu
- `AssessmentComparison.tsx` / `AssessmentComparison.new.tsx` - Org vs Vendor karşılaştırma

**Vendor Pages:**
- `VendorDetail.tsx` / `VendorDetail.new.tsx` - Vendor detayı
- `VendorEdit.tsx` - Vendor düzenleme
- `VendorNew.tsx` - Vendor oluşturma
- `VendorPortal.tsx` / `VendorPortal.new.tsx` - Public vendor portal (magic link)
- `VendorRanking.tsx` - Vendor risk ranking
- `VendorTemplates.tsx` - Assessment şablonları

**Other Pages:**
- `Analytics.tsx` / `Analytics.new.tsx` - Analytics dashboard
- `Exports.tsx` / `Exports.new.tsx` - Export işlemleri
- `Organization.tsx` / `Organization.new.tsx` - Organization settings
- `Profile.tsx` / `Profile.new.tsx` - User profile

**Company Group Pages:** *(Phase 9)*
- `CompanyGroups.shadcn.tsx` — Grup listesi, vendor sayısı, ortalama skor, yeni grup modal
- `CompanyGroupDetail.shadcn.tsx` — Grup özeti + CSF function karşılaştırma tablosu (şirketler sütun olarak)
- `AssessmentHistoryComparison.shadcn.tsx` — İki assessment yan yana, delta göstergesi (↑↓)

**Reporting Center:** *(Phase 10)*
- `Exports.shadcn.tsx` — "Reporting Center" olarak yeniden adlandırıldı; 6 export tipi aktif (Assessment PDF, Assessment CSV, Comparison, Vendor Scorecard, Executive Dashboard, Audit Evidence)

**Note:** `.new.tsx` dosyaları, UI migration sırasında oluşturulmuş yeni versiyonlar. `.shadcn.tsx` dosyaları en güncel versiyonlardır.

### Components

**Layout:**
- `AppLayout.tsx` - Ana layout wrapper
- `AppShell.new.tsx` - Yeni layout shell
- `Header.tsx` - Top navigation bar
- `TopNav.new.tsx` - Yeni top nav
- `Sidebar.tsx` / `Sidebar.new.tsx` - Sidebar navigation

**Assessment:**
- `AssessmentRow.new.tsx` - Assessment list row
- `wizard/WizardStepper.tsx` - 15-step stepper
- `wizard/StepNavigation.tsx` - Wizard navigation buttons

**Vendors:**
- `vendors/RiskScoreIndicator.tsx` - Risk score badge
- `vendors/CriticalityBadge.tsx` - Criticality level badge
- `NewVendorModal.tsx` - Vendor oluşturma modal
- `SendToVendorModal.tsx` - Vendor invitation modal

**Evidence:**
- `evidence/EvidenceList.tsx` - Evidence listesi
- `evidence/FileUploader.tsx` - Drag & drop uploader

**Common:**
- `SkeletonLoader.tsx` - Loading skeleton
- `ToastContext.tsx` - Toast notification context

### API Services

**Location:** `frontend/src/api/`

- `assessments.ts` - Assessment CRUD
- `vendors.ts` - Vendor CRUD
- `csf.ts` - CSF reference data
- `evidence.ts` - Evidence upload/download
- `ai.ts` - AI services
- `vendor-invitations.ts` - Vendor portal (separate axios instance with `withCredentials`)
- `company-groups.ts` - Company groups CRUD + summary *(Phase 9)*
- `import.ts` - Excel import preview + confirm *(Phase 9)*

---

## Önemli Özellikler

### 1. Assessment Wizard

**15-Step Guided Assessment:**

1. Governance & Risk Management
2. Entra ID & Identity Protection
3. Microsoft Defender for Cloud
4. AWS Security Posture
5. SaaS Application Security
6. Endpoint Protection
7. Network Security
8. Data Protection
9. Logging & Monitoring
10. Incident Response Procedures
11. Vulnerability Management
12. Backup & Recovery
13. Threat Intelligence
14. Access Reviews & Governance
15. Business Continuity Planning

**Özellikler:**
- Drag & drop evidence upload
- Real-time progress tracking
- Save draft functionality
- Step validation
- Progress percentage

### 2. Vendor Self-Assessment

**Magic Link Flow:**
1. Organization creates vendor assessment
2. Click "Send to Vendor"
3. Generate JWT-signed magic link (7-day expiry)
4. Vendor clicks link → token validates → session cookie created (24h)
5. Vendor fills assessment (session cookie authentication)
6. Vendor submits → notification to organization
7. Organization views comparison (side-by-side)

**Security Features:**
- JWT signing (cannot be forged)
- One-time token consumption
- Session-based authentication after first use
- Rate limiting (KV-based)
- Token revocation
- Comprehensive audit logging

### 3. Assessment Scoring

**Algorithm:** `lib/scoring.ts`

**Formula:**
```
Score = (
  (Not Assessed × 0) +
  (Not Met × 0) +
  (Partially Met × 0.5) +
  (Met × 1)
) / Total Items × 100
```

**Automatic Recalculation:**
- Triggered on item update
- Updates `assessment.overall_score`

### 4. Evidence Management

**R2 Storage:**
- Multipart upload support
- JWT-based presigned download URLs (1-hour expiry)
- File metadata in D1
- Automatic cleanup on assessment delete

**Supported Files:**
- PDFs, screenshots, documents
- Max file size: 100MB (configurable)

### 5. AI Analysis

**Anthropic Claude Sonnet 4.5:**

**Evidence Analysis:**
- Analyzes uploaded files per subcategory
- Provides compliance status
- Identifies gaps
- Suggests improvements

**Gap Analysis:**
- Cross-subcategory gap identification
- Prioritized recommendations
- Action items

**Executive Summary:**
- High-level overview
- Key risks
- Compliance percentage
- Top priorities

---

## Production Deployment

### Frontend (Cloudflare Pages)

**URL:** https://a5637370.csf-compass.pages.dev

**Build Command:** `npm run build`
**Output Directory:** `dist`
**Bundle Size:** 338 KB JS, 17 KB CSS

**Environment Variables:**
```
VITE_API_URL=https://csf-compass-worker.mehmettunahanokumus.workers.dev
```

**SPA Routing:** `_redirects` file handles client-side routing

### Worker (Cloudflare Workers)

**URL:** https://csf-compass-worker.mehmettunahanokumus.workers.dev

**Deployment Command:** `npm run deploy` (wrangler deploy)

**Bindings:**
- `DB` - D1 database (csf-compass-db)
- `EVIDENCE_BUCKET` - R2 bucket (csf-evidence-files)
- `RATE_LIMIT_KV` - KV namespace (rate limiting)

**Secrets (wrangler secret):**
- `JWT_SECRET` - Magic link imzalama
- `ANTHROPIC_API_KEY` - AI servisleri

**Environment Variables:**
```toml
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "https://a5637370.csf-compass.pages.dev,..."
FRONTEND_URL = "https://a5637370.csf-compass.pages.dev"
```

### Database (D1)

**Database ID:** `4dfa232a-bb0e-4576-8a67-ae787ca0f996`
**Region:** EEUR (Eastern Europe)

**Migration Command:**
```bash
npx wrangler d1 migrations apply csf-compass-db
```

**Current Version:** 4 migrations applied

### Cost Estimate

**Aylık Maliyet:**
- Cloudflare Workers: $5/month (Paid Plan)
- D1 Database: $0/month (Free Tier limits dahilinde)
- R2 Storage: ~$0.15/month (10GB)
- Pages: $0/month (Free)
- KV: $0/month (Free Tier limits dahilinde)
- Anthropic API: ~$5/month (100 analiz)

**Toplam:** ~$10-15/month

---

## Bilinen Sorunlar ve Çözümler

### 1. D1 Bound Parameter Limit (100) — KRİTİK

**Problem:** Cloudflare D1'in bound parameter limiti sorgu başına **100**'dür (SQLite'ın 999 limitinden farklı!). Drizzle ORM batch insert tüm kolonları dahil eder.

**Tespiti:**
- Drizzle ORM `db.insert(assessment_items).values(batch)`: 5 param × 25 row = 125 → **BAŞARISIZ**
- Hata: `"Error: Failed query: insert into..."` (D1 genel hata mesajı)
- `wrangler tail` ile tespit edildi

**Çözüm:**
- Raw SQL kullan: `c.env.DB.prepare(...).bind(...params).run()`
- Max **19 row/batch** (5 col × 19 = 95 params < 100 limit)
- Wizard progress: 15 row/batch (mevcut — hâlâ güvenli)
- Commit: `78c4063`

### 2. SQLite Variable Limit (999) — Eski Sorun

**Problem:** Batch insert sırasında 999 değişken limiti aşılıyor.

**Çözüm:**
- Assessment items: 25 row/batch (Drizzle ORM, D1'in gerçek 100 limit'ini bulmadan önce)
- Wizard progress: 15 row/batch
- Commits: `1fb0923`, `795e732`, `77df507`, `16a3526`

### 3. Boolean Values in SQLite

**Problem:** SQLite'da boolean tipi yok.

**Çözüm:**
- INTEGER(0, 1) kullan
- Drizzle ORM `{ mode: 'boolean' }` kullan
- Commit: `cfc5aab`

### 4. Dark Mode Readability

**Problem:** Dark mode'da text contrast düşük.

**Çözüm:**
- Slate Professional theme
- Navy color scale adjustments
- Commits: `cc6ccbc`, `2a48340`

### 5. ON DELETE SET NULL — Orphan Vendor Sorunu

**Problem:** `company_groups` silindiğinde `vendors.group_id` NULL olur ama vendor silinmez. Yeniden import denendiğinde `unique_vendor_name_per_org` constraint ihlali oluşur.

**Çözüm:**
- Import öncesi orphan vendor'ları temizle: `DELETE FROM vendors WHERE group_id IS NULL AND name LIKE 'XYZ%'`
- Import route'una `group_id` optional field eklendi — mevcut gruba şirket eklemek için
- İleride: Import route'a transaction + rollback eklenebilir

### 6. Session Cookie CORS

**Problem:** httpOnly cookies cross-origin çalışmıyor.

**Çözüm:**
- ALLOWED_ORIGINS whitelist
- `credentials: true` in CORS
- Same-origin deployment (Pages + Worker)

---

## Gelecek İyileştirmeler

### Kısa Vadeli (1-3 ay)

1. **Email Integration**
   - Cloudflare Email Workers
   - Automatic invitation emails
   - Reminder system (7 days before expiry)

2. **Authentication**
   - Cloudflare Access integration
   - User registration/login
   - Role-based permissions

3. **Bulk Invitations**
   - CSV upload for multiple vendors
   - Batch magic link generation
   - Progress tracking

4. **PDF Export**
   - Assessment reports
   - Comparison reports
   - Executive summaries

### Orta Vadeli (3-6 ay)

1. **Advanced Analytics**
   - Trend analysis (time-series)
   - Industry benchmarking
   - Custom dashboards

2. **Notification System**
   - Assessment due dates
   - Vendor compliance alerts
   - Webhook integrations

3. **Template System**
   - Custom assessment templates
   - Subcategory selection
   - Template sharing

4. **Discussion/Comments**
   - Item-level comments
   - Vendor Q&A
   - Collaboration features

### Uzun Vadeli (6-12 ay)

1. **Multi-Organization Support**
   - Workspace concept
   - Organization switching
   - Cross-org comparison

2. **Compliance Frameworks**
   - ISO 27001
   - SOC 2
   - GDPR mapping

3. **API & Integrations**
   - Public API
   - Zapier integration
   - SIEM connectors

4. **Mobile App**
   - React Native
   - Offline mode
   - Push notifications

---

## Developer Notes

### Local Development

**Worker:**
```bash
cd worker
npm run dev  # http://localhost:8787
```

**Frontend:**
```bash
cd frontend
npm run dev  # http://localhost:5173
```

**Database:**
```bash
# Create migration
npm run generate

# Apply locally
npm run db:migrate:local

# Query
npx wrangler d1 execute csf-compass-db --local --command "SELECT * FROM assessments"
```

### Deployment Workflow

1. Make changes
2. Test locally
3. Commit & push
4. Deploy worker: `cd worker && npm run deploy`
5. Deploy frontend: `cd frontend && npm run build && npx wrangler pages deploy dist`
6. Verify production

### Important Files to Know

**Backend:**
- `worker/src/index.ts` - Main entry point
- `worker/src/db/schema.ts` - Database schema (Drizzle ORM)
- `worker/src/routes/*.ts` - API route handlers
- `worker/src/lib/*.ts` - Business logic libraries
- `worker/wrangler.toml` - Cloudflare configuration

**Frontend:**
- `frontend/src/main.tsx` - App entry point
- `frontend/src/App.tsx` - Root component
- `frontend/src/types/index.ts` - TypeScript types
- `frontend/src/api/*.ts` - API client services
- `frontend/src/pages/*.tsx` - Page components
- `frontend/tailwind.config.js` - Design system

**Migrations:**
- `worker/migrations/*.sql` - Database migrations

**Documentation:**
- `IMPLEMENTATION.md` - Full implementation guide
- `VENDOR_SELF_ASSESSMENT_IMPLEMENTATION.md` - Vendor feature docs
- `DEPLOYMENT_SUCCESS.md` - Deployment checklist
- `UI_MIGRATION_PLAN.md` - UI modernization plan
- `TESTING_GUIDE.md` - Testing procedures
- `INTERACTIVE_TEST.md` - Interactive testing guide

---

## Quick Reference

### Common Commands

```bash
# Worker dev server
cd worker && npm run dev

# Frontend dev server
cd frontend && npm run dev

# Deploy worker
cd worker && npm run deploy

# Build & deploy frontend
cd frontend && npm run build && npx wrangler pages deploy dist

# Database migration (production)
cd worker && npm run db:migrate

# Database migration (local)
cd worker && npm run db:migrate:local

# Query database (production)
npx wrangler d1 execute csf-compass-db --command "SELECT * FROM vendors"

# Query database (local)
npx wrangler d1 execute csf-compass-db --local --command "SELECT * FROM vendors"

# View worker logs
npx wrangler tail

# Set secret
npx wrangler secret put JWT_SECRET

# List secrets
npx wrangler secret list
```

### Useful Queries

```sql
-- Assessment stats
SELECT
  a.id,
  a.name,
  a.status,
  a.overall_score,
  COUNT(ai.id) as total_items,
  SUM(CASE WHEN ai.status = 'met' THEN 1 ELSE 0 END) as met_items
FROM assessments a
LEFT JOIN assessment_items ai ON ai.assessment_id = a.id
GROUP BY a.id;

-- Vendor invitation audit trail
SELECT * FROM vendor_audit_log
WHERE invitation_id = 'xxx'
ORDER BY created_at DESC;

-- CSF subcategories by function
SELECT
  f.name as function_name,
  c.name as category_name,
  COUNT(s.id) as subcategory_count
FROM csf_functions f
JOIN csf_categories c ON c.function_id = f.id
JOIN csf_subcategories s ON s.category_id = c.id
GROUP BY f.id, c.id;
```

---

## Change Log

### 2026-02-19 (Phase 20)
- **Phase 20 tamamlandı:** Assessment type/company tags eklendi
- `Vendor` type'a `group_id?: string` eklendi (eksikti)
- Type tag: Self=indigo, Vendor=purple, Group Company=blue — 3 sayfada uygulandı
- Company name tag: gri pill, max-width ellipsis — Dashboard name cell altında, Assessments kart vendor alanında, AssessmentDetail metadata satırında
- Dosyalar: `types/index.ts`, `Dashboard.shadcn.tsx`, `Assessments.shadcn.tsx`, `AssessmentDetail.shadcn.tsx`

### 2026-02-19 (Phase 19)
- **Phase 19 tamamlandı:** Analytics sayfası tamamen yeniden yazıldı — statik demo verilerden gerçek API datasına geçildi
- Kök neden: sayfa 100% hardcoded statik verilerdi, hiç useState/useEffect/API call yoktu
- 3 API endpoint entegrasyonu (assessments, vendors, assessment items)
- 5 seçenekli date range filter (7d/30d/90d/12m/custom), dropdown, outside-click kapanma
- Tüm 5 chart (Radar, Trend, Vendor Risk, Gap, CSF Bar) range değişince yeniden render oluyor
- "No data for this period" — her chart için bağımsız empty state
- Loading skeleton (shimmer) + chart spinner; race condition koruması (fetchIdRef)
- Default range: Last 30 days

### 2026-02-19 (Phase 18)
- **Phase 18 tamamlandı:** Company Group Subsidiary CRUD tam implementasyonu
- Backend: `POST /api/vendors`'a `group_id` eklendi (daha önce insert'e dahil edilmiyordu)
- API: `CreateVendorData`'ya `group_id?: string` eklendi
- CompanyGroups: "Add Subsidiary" → "New Group" (doğru etiket, group container oluşturuyor)
- CompanyGroupDetail: Subsidiary Companies Management Table (Add/Edit/Delete + clickable rows), Add/Edit modal, Delete confirmation, success toasts; CSF comparison table korundu

### 2026-02-19 (Phase 17)
- **Phase 17 tamamlandı:** VendorDetail profil düzenleme bug düzeltmeleri
- Bug 1 (KRİTİK): `description`→`notes` yanlış mapping — tüm description değişiklikleri sessizce kayboluyordu
- Bug 2: Eksik form alanları — `industry`, `contact_phone`, `vendor_status` eklendi
- Bug 3: Başarı toast + inline hata banner (`alert()` kaldırıldı)
- Bug 4: Optimistic UI — `setVendor({ ...vendor, ...updated })` ile badge anında güncelleniyor
- Bug 5: `criticality_level || risk_tier` öncelik sırası düzeltildi
- Bug 6: Save butonu `saving` loading state eklendi

### 2026-02-19 (Phase 16)
- **Phase 16 tamamlandı:** Reporting Center Revamp — jsPDF + xlsx ile gerçek dosya üretimi
- jspdf@4.2.0 + jspdf-autotable@5.0.7 eklendi
- 4 report tipi: Org Summary (PDF) · Vendor Risk (Excel) · Assessment Detail (PDF) · Group Overview (Excel)
- `buildAssessmentPDF()` helper: header bar, score, stat boxes, function table, findings table
- Excel: çok-sayfalı workbook (Vendors+Summary / Groups+Companies)
- T token styling, per-card loading/error, format badge (PDF=red / Excel=green)

### 2026-02-19 (Phase 15)
- **Phase 15 tamamlandı:** Historical Assessment Comparison Enhancements
- VendorDetail: SVG bar → recharts AreaChart (score trend line, date-sorted); status + date range filters with `filteredAssessments` useMemo
- AssessmentHistoryComparison: full T-token rewrite; per-function grouped BarChart (Baseline vs Current); StatusBadge component; improved table row highlighting

### 2026-02-21 (Phase 14)
- **Phase 14 tamamlandı:** Assessment Report tam yeniden tasarımı
- 4 bölümlü profesyonel rapor: Header (donut + badges + meta) · Executive Summary (4 stat kart) · CSF Function Breakdown (stacked bar + expandable controls) · Findings Table (sortable)
- Export Excel: SheetJS xlsx — 3 sheet (Summary / All Controls / Findings)
- Export PDF: window.print() + @media print A4
- `xlsx` paketi eklendi

### 2026-02-21 (Phase 13)
- **Phase 13 tamamlandı:** Wizard Implementation Guide + Checklist Enhanced Details
- AssessmentWizard: `📘 Implementation Guide` collapsible per step; STEP_GUIDANCE[15] with 3-4 tool-specific entries per step; auto-collapse on step navigation
- AssessmentChecklist: `ℹ️ Details` text button replaces ChevronDown icon; expanded panel now shows control ID badge + name, description, evidence examples, and function-specific auditor tip (getTipForItem — GV/ID/PR/DE/RS/RC)

### 2026-02-21
- **Phase 12 tamamlandı:** Groups → Group Companies conceptual rename
- "Groups" kavramı "Group Companies / Subsidiaries" olarak yeniden tanımlandı — dış tedarikçi değil, iç bağlı ortaklık
- Sidebar, sayfa başlıkları, butonlar, modal, boş durum, geri linki ve Vendors bilgi notu güncellendi
- Filtreleme Phase 10'dan beri aktif (exclude_grouped); herhangi bir kod değişikliği gerekmedi

### 2026-02-20
- **Phase 11 tamamlandı:** Dark Mode Contrast & Visibility Audit
- CSS: `--t-text-muted` (#64748B→#94A3B8) ve `--t-text-faint` (#475569→#64748B) dark mode T token değerleri düzeltildi — T token kullanan tüm sayfalar otomatik düzeldi
- Vendors: tablo header `var(--card)` bg + `var(--border)` border + `var(--text-2)` text
- CompanyGroups: kartlar `var(--card)`/`var(--border)`/`var(--shadow-xs)` ile proper elevated card; tüm hardcoded rgba → CSS vars; grup adı `var(--text-1)`, diğer metinler `var(--text-2)`
- CompanyGroupDetail: stat kartlar + karşılaştırma tablosu `var(--card)`/`var(--border)` ile görünür; tablo başlığı `var(--text-1)`; th hücreleri `var(--text-2)`; şirket isimleri `var(--text-1)`

### 2026-02-19
- **Phase 10 tamamlandı:** Bug Fixes + Visual Improvements + Assessment Report + Reporting Center + Medium Features
- Functional: VendorDetail criticality bug fix; group companies fully separated from Vendors list
- Visual: CompanyGroups card visibility, CompanyGroupDetail table headers, Vendors dark mode header, `--text-3` lightened
- Assessment Report: cover section, larger score circle, print CSS, Export PDF, Export Excel (.csv)
- Reporting Center: "Exports" → "Reporting Center"; all 6 export types activated with inline forms
- AssessmentChecklist: "More Details" expandable panel per item
- AssessmentWizard: generic step names + vendor-neutral guidance for all 15 steps

### 2026-02-18
- **Phase 9 tamamlandı:** Company Groups + Historical Comparison + Excel Import
- Migration 0005: `company_groups` tablosu, `vendors.group_id`
- Yeni API routes: `/api/company-groups`, `/api/import`, `/api/assessments/compare`
- Yeni frontend sayfaları: CompanyGroups, CompanyGroupDetail, AssessmentHistoryComparison
- ExcelImportModal componenti eklendi
- XYZ Holding Grubu (11 şirket, 1.320 assessment item) production'a import edildi
- **Kritik keşif:** D1 bound parameter limiti = 100/query (raw SQL çözümü: 19 row/batch)
- CI/CD: GitHub Actions workflow eklendi

### 2026-02-13
- CLAUDE.md created for project context

### 2026-02-12
- Agentic development integration (Claude Code)
- UI theme migration complete (Navy Blue)

### 2026-02-11
- Production deployment successful
- Vendor self-assessment feature complete
- JWT security implemented

### 2026-02-10
- Database migrations complete
- Worker API complete
- Frontend foundation complete

---

**End of CLAUDE.md**

_This document is maintained for Claude Code to quickly understand project context. Update after major changes._
