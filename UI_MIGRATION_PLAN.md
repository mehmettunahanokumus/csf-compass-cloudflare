# CSF Compass: UI Migration Plan (Next.js → Cloudflare)

> **Odak:** Sadece UI gelistirmeleri. Backend/API degisiklikleri bu dokumanda kapsam disi.
> **Kaynak:** `/Users/mehmettunahanokumus/Desktop/CSF_Check/csf-compass` (Next.js)
> **Hedef:** `/Users/mehmettunahanokumus/Desktop/CSF_Check/csf-cloudflare/frontend` (React + Vite)

---

## 1. DESIGN SYSTEM FARKLARI VE GUNCELLEMELER

### 1.1 Renk Paleti Degisikligi

| Ozellik | Mevcut (Cloudflare) | Hedef (Next.js) | Aksiyon |
|---|---|---|---|
| **Primary** | Teal (#0D9488) | Navy (#102a43 ~ #1e3a5f) | Tum accent renkleri Navy'ye cevir |
| **Primary Scale** | Tek teal tonu | 11 tonlu Navy scale (navy-50 → navy-950) | CSS variable olarak tanimla |
| **Success** | #22C55E | #10b981 (Emerald) | Guncelle |
| **Warning** | #F97316 (Orange) | #f59e0b (Amber) | Guncelle |
| **Danger** | #EF4444 | #ef4444 | Ayni |
| **Info** | #3B82F6 | #2563eb | Kucuk fark |

**Eklenecek CSS Variables:**
```css
:root {
  /* Navy Scale (Next.js'den) */
  --navy-50: #f0f4f8;
  --navy-100: #d9e2ec;
  --navy-200: #bcccdc;
  --navy-300: #9fb3c8;
  --navy-400: #829ab1;
  --navy-500: #627d98;
  --navy-600: #486581;
  --navy-700: #334e68;
  --navy-800: #243b53;
  --navy-900: #102a43;
  --navy-950: #0a1929;
}
```

### 1.2 Tipografi Degisikligi

| Ozellik | Mevcut | Hedef | Aksiyon |
|---|---|---|---|
| **Display Font** | Plus Jakarta Sans | Playfair Display (serif) | Google Fonts ekle |
| **Body Font** | Plus Jakarta Sans | Inter (sans-serif) | Google Fonts degistir |
| **Mono Font** | JetBrains Mono | JetBrains Mono | Ayni, degisiklik yok |

**index.html'e eklenecek:**
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

**CSS'de:**
```css
:root {
  --font-display: 'Playfair Display', serif;
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### 1.3 Shadow & Radius

| Ozellik | Mevcut | Hedef |
|---|---|---|
| Radius sm | 8px | 8px (ayni) |
| Radius md | 12px | 12px (ayni) |
| Radius lg | 16px | 16px (ayni) |
| Shadows | 4 seviye | 5 seviye (2xl ekle) |

### 1.4 Focus States

**Mevcut:** `box-shadow: 0 0 0 3px var(--accent-subtle)` (teal ring)
**Hedef:** `outline: 2px solid navy-600; outline-offset: 2px` (navy ring)

---

## 2. LAYOUT DEGISIKLIKLERI

### 2.1 Header/TopNav

**Mevcut Durum (Cloudflare):**
- 56px yukseklik
- Hamburger + Breadcrumbs (sol) + Bell + DEMO chip + Avatar (sag)
- Breadcrumb-tabanli navigasyon

**Hedef Durum (Next.js):**
- 64px yukseklik (`h-16`)
- Fixed positioning (`position: fixed; top: 0; z-index: 40`)
- Sol: Hamburger (mobil) + Logo butonu (Shield icon, mavi bg)
- Orta: Desktop nav linkleri (Dashboard, Assessments, Vendors — icon + text)
- Sag: "New Assessment" butonu + Info popover toggle
- Mobil: Sadece hamburger + logo gorulur

**Yapilacak Degisiklikler:**
1. Breadcrumb kaldir, center navigation ekle (desktop)
2. Logo butonunu Shield icon ile degistir (mavi daire icerisinde)
3. "New Assessment" quick-action butonu ekle (sag taraf)
4. Bell icon ve DEMO chip kaldir
5. Info popover ekle (NIST CSF bilgi karti)
6. Yuksekligi 64px yap
7. `position: fixed` yap, main content'e `padding-top: 64px` ekle

### 2.2 Sidebar

**Mevcut Durum (Cloudflare):**
- 250px genislik, relative (desktop), fixed (mobil)
- 3 bolum: MAIN, REPORTS, SETTINGS
- Aktif item: Solid teal bg + beyaz text
- Alt kisim: Theme toggle (3-buton segmented) + User card
- CSS transition ile collapse

**Hedef Durum (Next.js):**
- Mobil drawer style (slide-from-left + overlay backdrop)
- Desktop: Header'daki nav'a entegre (sidebar yok)
- 6 ana navigasyon itemi (icon + text)
- Alt kisim: NIST CSF framework bilgi karti
- Aktif item: Navy mavi background + beyaz text

**Yapilacak Degisiklikler:**
1. Desktop'ta sidebar tamamen kaldir — navigasyon Header'a tasinacak
2. Mobil drawer'i koruyarak hamburger ile ac/kapa
3. Overlay: Semi-transparent siyah backdrop
4. Navigasyon itemleri: Navy mavi aktif state
5. Alt kisima NIST CSF info karti ekle
6. Theme toggle'i sidebar'dan cikar (ayri bir yere tasiniyor veya kaldirilacak)

### 2.3 Main Content Area

**Mevcut:** `padding: 28px`, flex: 1, overflow-y: auto
**Hedef:** `max-width: 7xl (80rem)`, `padding: 0 1rem (sm: 1.5rem, lg: 2rem)`, `padding-top: 4rem`

**Degisiklik:**
- `max-w-7xl` container constraint ekle
- Horizontal center (`margin: 0 auto`)
- Padding-top: 64px (fixed header icin)

---

## 3. EKSIK SAYFALAR — YENI OLUSTURULACAK

### 3.1 Assessment Wizard Sayfasi (KRITIK)

**Dosya:** `src/pages/AssessmentWizard.tsx`
**Route:** `/assessments/:id/wizard`

**Layout Yapisi:**
```
+--------------------------------------------------+
| Sticky Header                                     |
| [< Back]  "Data Collection Wizard"  Step: X/15   |
+--------------------------------------------------+
|                              |                    |
|  MAIN CONTENT (3/4)         | SIDEBAR (1/4)      |
|                              |                    |
|  +------------------------+  | +----------------+ |
|  | Step Info Banner       |  | | WizardStepper  | |
|  | (navy-50 bg, left bdr) |  | |                | |
|  +------------------------+  | | 1. Governance  | |
|  | icon  Step description |  | | 2. Entra ID    | |
|  +------------------------+  | | 3. Defender    | |
|                              | | 4. AWS         | |
|  +------------------------+  | | ...            | |
|  | File Upload Section    |  | | 15. Business   | |
|  | +--------------------+ |  | |    Continuity  | |
|  | | Drag & Drop Zone   | |  | |                | |
|  | | Upload icon (64px) | |  | | [====] 45%     | |
|  | | "Drop files here"  | |  | +----------------+ |
|  | | File type badges   | |  |                    |
|  | +--------------------+ |  |                    |
|  +------------------------+  |                    |
|                              |                    |
|  +------------------------+  |                    |
|  | Uploaded Files         |  |                    |
|  | file1.pdf  [DL] [DEL] |  |                    |
|  | file2.xlsx [DL] [DEL] |  |                    |
|  +------------------------+  |                    |
|                              |                    |
|  +------------------------+  |                    |
|  | Additional Notes       |  |                    |
|  | [textarea, 6 rows]     |  |                    |
|  +------------------------+  |                    |
+--------------------------------------------------+
| Sticky Footer Navigation                          |
| [< Previous]  ● ● ● ○ ○  [Save Draft] [Next >]  |
+--------------------------------------------------+
```

**Gerekli Alt Componentler:**

#### 3.1.1 WizardStepper Component
- **Dosya:** `src/components/wizard/WizardStepper.tsx`
- 15 adim dikey listesi
- Her adim: Numara dairesi (veya check icon) + Adim adi
- Mevcut adim: Navy bg + beyaz text
- Tamamlanan adim: Yesil check icon
- Tamamlanmamis: Gri, tiklanabilir
- Alt kisimda: Genel ilerleme yuzdesi + progress bar

**15 Adim Listesi:**
1. Governance & Policy
2. Entra ID / Azure AD
3. Microsoft Defender
4. AWS Security
5. Network Security
6. Endpoint Protection
7. Data Protection
8. Identity & Access Management
9. Security Monitoring
10. Incident Response
11. Backup & Recovery
12. Vulnerability Management
13. Vendor Risk Management
14. Security Awareness Training
15. Business Continuity

#### 3.1.2 StepNavigation Component
- **Dosya:** `src/components/wizard/StepNavigation.tsx`
- Sticky bottom bar
- Sol: "Previous" butonu (ilk adimda disabled)
- Orta: Adim noktalari (dot indicators, aktif = dolgu)
- Sag: "Save Draft" (secondary) + "Next" (primary)
- Son adimda "Next" yerine "Complete Assessment" butonu
- Kayit sirasinda spinner + "Saving..." text

#### 3.1.3 FileUploader Component
- **Dosya:** `src/components/evidence/FileUploader.tsx`
- Drag-and-drop alani (dashed border)
- Upload icon (64px, daire icerisinde)
- "Drag and drop files here, or click to browse" text
- Kabul edilen dosya tipleri badges: PDF, DOCX, XLSX, CSV, TXT, PNG, JPG, JSON, XML
- Dosya boyutu limiti: 10MB
- Yukleme sirasinda progress bar (animated)
- Hata state: Kirmizi border + AlertCircle icon + hata mesaji + dismiss butonu
- Dragging state: Border rengi degisir (navy), bg hafif navy tonu

#### 3.1.4 EvidenceList Component
- **Dosya:** `src/components/evidence/EvidenceList.tsx`
- Dikey dosya listesi
- Her dosya: Dosya tipi icon + Dosya adi + Tarih + Boyut + Aksiyonlar (Download, Delete)
- Bos state: "No files uploaded yet"
- Framer Motion staggered giris animasyonu (istege bagli)

---

### 3.2 Assessment Checklist Sayfasi

**Dosya:** `src/pages/AssessmentChecklist.tsx`
**Route:** `/assessments/:id/checklist`

> **Not:** Mevcut AssessmentDetail.new.tsx icinde "Assessment Items" tab'i var. Bu sayfayi ya ayri bir sayfa olarak olustur ya da mevcut tab'i genislet.

**Layout Yapisi:**
```
+--------------------------------------------------+
| Header: "Assessment Checklist"                     |
| Subtitle: 106 subcategories across 6 functions     |
+--------------------------------------------------+
| Score Overview Card                                |
| +-----------------------------------------------+ |
| | [Compliance Chart]  | Compliant: 45            | |
| | SVG Circle 200px    | Partial: 12              | |
| | Score: 72%          | Non-Compliant: 8         | |
| |                     | Not Assessed: 41         | |
| +-----------------------------------------------+ |
+--------------------------------------------------+
| Function Tabs (horizontal scroll)                  |
| [GV] [ID] [PR] [DE] [RS] [RC]                    |
+--------------------------------------------------+
| Search Bar                                         |
| [🔍 Search by code or description...]              |
+--------------------------------------------------+
| Category: GV.OC - Organizational Context           |
| +-----------------------------------------------+ |
| | [GV.OC-01] Evidence(3)  Description...  [▼]   | |
| | [GV.OC-02] Evidence(0)  Description...  [▼]   | |
| +-----------------------------------------------+ |
| Category: GV.RM - Risk Management                  |
| ...                                                |
+--------------------------------------------------+
```

**Gerekli Alt Componentler:**

#### 3.2.1 ComplianceChart Component
- **Dosya:** `src/components/charts/ComplianceChart.tsx`
- SVG animated circular progress
- 3 boyut: sm (100px), md (150px), lg (200px)
- Ortada: Skor yuzdesi (buyuk font) + "Score" alt text
- Renk: >=75 yesil, >=50 amber, <50 kirmizi
- Animasyon: Mount sirasinda stroke-dashoffset animasyonu
- Arka plan dairesi: Acik navy renk

#### 3.2.2 StatusSelector Component
- **Dosya:** `src/components/assessment/StatusSelector.tsx`
- Custom dropdown (native select degil)
- Buton: Mevcut status rengi + text + chevron icon
- Dropdown menu (5 secenek):
  - Compliant (yesil daire + aciklama)
  - Partial (amber daire + aciklama)
  - Non-Compliant (kirmizi daire + aciklama)
  - Not Assessed (gri daire + aciklama)
  - N/A (acik gri daire + aciklama)
- Secili item: Check icon gosterir
- Disariya tiklandiginda kapanir

#### 3.2.3 CategoryGroup Component
- **Dosya:** `src/components/assessment/CategoryGroup.tsx`
- Baslik bar: Navy-100 arka plan, kategori kodu + adi
- Altinda: Subcategory item listesi
- Her item: Kod badge (mono) + Evidence sayisi badge + Aciklama + StatusSelector

---

### 3.3 Assessment Report Sayfasi

**Dosya:** `src/pages/AssessmentReport.tsx`
**Route:** `/assessments/:id/report`

**Layout Yapisi:**
```
+--------------------------------------------------+
| Header (ekranda gorunur, print'te gizli)          |
| [< Back]  "Assessment Report"                     |
| [Export CSV] [Download PDF] [Print]                |
+--------------------------------------------------+
| Compliance Overview                                |
| +-----------------------------------------------+ |
| | [ComplianceChart lg]  | 4-column distribution | |
| +-----------------------------------------------+ |
+--------------------------------------------------+
| Score by Function                                  |
| +-----------------------------------------------+ |
| | [GV] Govern        ████████░░  78%            | |
| | [ID] Identify      ██████░░░░  62%            | |
| | [PR] Protect       █████░░░░░  54%            | |
| | [DE] Detect         ███░░░░░░  35%            | |
| | [RS] Respond       ████████░░  82%            | |
| | [RC] Recover       ██████░░░░  67%            | |
| +-----------------------------------------------+ |
+--------------------------------------------------+
| Executive Summary                                  |
| +-----------------------------------------------+ |
| | Maturity Tier: [Tier 3 - Informed]             | |
| | Summary text...                                | |
| | Strengths (yesil): ✓ item1, ✓ item2           | |
| | Critical Gaps (kirmizi): ⚠ item1, ⚠ item2     | |
| | Priority Actions (navy): 1. item1, 2. item2   | |
| | Risk Assessment (amber): text...               | |
| +-----------------------------------------------+ |
+--------------------------------------------------+
```

**Gerekli Alt Componentler:**

#### 3.3.1 FunctionScoreChart Component
- **Dosya:** `src/components/charts/FunctionScoreChart.tsx`
- Her fonksiyon icin yatay bar
- Sol: Fonksiyon kodu badge (navy-900 bg)
- Orta: Fonksiyon adi
- Sag: Buyuk yuzde + kucuk compliant/partial/nonCompliant sayilari
- Progress bar: Animated genislik (0.5s)
- Hover: Breakdown detaylarini gosterir

#### 3.3.2 ExecutiveSummaryCard Component
- **Dosya:** `src/components/report/ExecutiveSummaryCard.tsx`
- Maturity Tier badge (1-4 arasi, renk kodlu)
- Summary text alani
- 4 bolum karti:
  - Strengths: Yesil bg, check icon'lu liste
  - Critical Gaps: Kirmizi bg, warning icon'lu liste
  - Priority Actions: Navy bg, numarali liste
  - Risk Assessment: Amber bg, text alani
- "Generate with AI" butonu (eger summary yoksa)

#### 3.3.3 PDF Export Fonksiyonu
- **Kutuphane:** `jspdf` + `jspdf-autotable`
- Icerik: Kapak sayfasi + Ozet + Fonksiyon skorlari + Detayli breakdown
- Print CSS: `@media print` ile ekran-only elementleri gizle

---

### 3.4 Vendor Ranking Sayfasi

**Dosya:** `src/pages/VendorRanking.tsx`
**Route:** `/vendors/ranking`

**Layout Yapisi:**
```
+--------------------------------------------------+
| [< Back]  "Vendor Rankings"  [Export to CSV]       |
+--------------------------------------------------+
| Filter: [All] [Low] [Medium] [High] [Critical]    |
| Showing X vendors                                  |
+--------------------------------------------------+
| # | Vendor Name | Industry | Score | Crit | Status|
|---|-------------|----------|-------|------|-------|
| 1 | CloudHost   | Cloud    | 85    | High | Active|
| 2 | PaymentPro  | Fintech  | 72    | Crit | Active|
| 3 | DataBackup  | Storage  | 58    | Med  | Review|
+--------------------------------------------------+
```

**Ozellikler:**
- Siralama: Tum sutunlar sortable (score, criticality, name, date)
- Sort ikonlari: ArrowUpDown (varsayilan), ArrowUp (asc), ArrowDown (desc)
- Filter butonlari: Aktif = Navy bg, Pasif = Gri
- CSV export butonu
- Vendor name: Tiklanabilir link → VendorDetail sayfasi
- RiskScoreIndicator: Her satirdaki skor gorsel (kucuk boyut)
- CriticalityBadge: Renk kodlu pill badge

---

### 3.5 Vendor Templates Sayfasi

**Dosya:** `src/pages/VendorTemplates.tsx`
**Route:** `/vendors/templates`

**Layout Yapisi:**
```
+--------------------------------------------------+
| [< Back]  "Assessment Templates"  [+ New Template]|
+--------------------------------------------------+
| Info Card (mavi bg)                                |
| About Assessment Templates: Aciklama...            |
+--------------------------------------------------+
| Template Grid (3 kolon)                            |
| +------------+ +------------+ +------------+       |
| | Template 1 | | Template 2 | | Template 3 |       |
| | ★ Default  | |            | |            |       |
| | Desc...    | | Desc...    | | Desc...    |       |
| | Created:   | | Created:   | | Created:   |       |
| | [Edit]     | | [Edit][Del]| | [Edit][Del]|       |
| +------------+ +------------+ +------------+       |
+--------------------------------------------------+
```

---

### 3.6 Vendor Form Sayfasi (New + Edit)

**Dosya:** `src/pages/VendorNew.tsx` ve `src/pages/VendorEdit.tsx`
**Route:** `/vendors/new` ve `/vendors/:id/edit`

> **Not:** Mevcut NewVendorModal'i koruyabilir VEYA ayri sayfa olarak da olusturulabilir. Next.js versiyonunda ayri sayfalar var.

**Form Bolumleri:**
1. **Basic Information:** Name, Industry, Website
2. **Contact Information:** Contact Name, Email, Phone
3. **Risk Management:** Criticality Level (select), Vendor Status (select)
4. **Notes:** Textarea

**Ozellikler:**
- Zod validation (client-side)
- Error mesajlari: Kirmizi border + inline text
- Submit: "Create Vendor" / "Update Vendor" butonu
- Cancel: Onceki sayfaya don

---

### 3.7 Guide Sayfasi

**Dosya:** `src/pages/Guide.tsx`
**Route:** `/guide/:step`

**Aciklama:** 15 veri toplama adimi icin rehber sayfasi. Her adim icin:
- Adim basligi ve aciklamasi
- Toplama scriptleri/talimatlari
- Ornek dosya format bilgileri
- Ilgili CSF subcategory'leri

> **Oncelik:** DUSUK — Bu sayfa statik icerik ve sonraya birakilabilir.

---

### 3.8 Help Sayfasi

**Dosya:** `src/pages/Help.tsx`
**Route:** `/help`

> **Oncelik:** DUSUK — Statik icerik, placeholder olusturulabilir.

---

## 4. MEVCUT SAYFA GUNCELLEMELERI

### 4.1 Dashboard Sayfasi Guncellemeleri

**Mevcut:** StatCards + Recent Assessments listesi
**Hedef:** StatCards + Vendor Risk Section + Recent Assessments + Framework Overview + Getting Started

**Eklenecekler:**

1. **Vendor Risk Management Bolumu:**
   ```
   Vendor Risk Management
   +----------+ +----------+ +----------+ +----------+
   | Total    | | High Risk| | Critical | | Avg Risk |
   | Vendors  | | Vendors  | | Vendors  | | Score    |
   | 12       | | 3 (red)  | | 1(orange)| | 72       |
   +----------+ +----------+ +----------+ +----------+
   ```

2. **Framework Overview (6 fonksiyon karti):**
   ```
   NIST CSF 2.0 Framework
   [GV: 5 items] [ID: 3 items] [PR: 4 items] [DE: 3 items] [RS: 3 items] [RC: 3 items]
   ```
   - Her kart: Kod + Ad + Item sayisi + Renk kodlu bar

3. **Getting Started Section (eger assessment yoksa):**
   - Gradient navy arka plan
   - CTA butonlari: "Create First Assessment", "Add Vendor"

4. **StatCard Guncelleme:**
   - Framer Motion giris animasyonu (fade-in + y-offset + stagger)
   - Her karta icon badge ekle
   - Trend gostergesi: Ok + yuzde + "from last X" text
   - Sparkline SVG'yi koruyabilirsiniz (mevcut implementasyon iyi)

### 4.2 Assessments Sayfasi Guncellemeleri

**Mevcut:** Search + Status filter (4 buton toggle) + Assessment card grid
**Hedef:** Type filter tabs + Assessment card grid (farkli tasarim)

**Degisiklikler:**

1. **Filter Tabs degisikligi:**
   - Mevcut: `[All] [Draft] [In Progress] [Completed]` (status-based)
   - Hedef: `All (count) | Organization (count) | Vendor (count)` (type-based tabs)
   - Tab stili: Alt-cizgi aktif tab, sayac badge

2. **AssessmentCard tasarim guncellemesi:**
   - Mevcut: Title + status badge + description + progress bar + score + date
   - Hedef ek ogeleri:
     - Criticality badge (vendor assessment icin)
     - "More options" butonu (sag ust)
     - Vendor link gosterimi
     - Status icon + label (ayri satir)
     - "View" butonu (kart alt kismi)

### 4.3 AssessmentDetail Sayfasi Guncellemeleri

**Mevcut:** 4 tab (Overview, Items, Vendor, History) — iyi yapida

**Eklenecekler:**

1. **SVG Score Circle (buyuk, animasyonlu):**
   - Mevcut DonutChart yerine veya yanina
   - 200px ComplianceChart (animated stroke-dashoffset)
   - Renk: Skora gore degisir

2. **Score Distribution Karti (5 kolon):**
   ```
   [Compliant: 45] [Partial: 12] [Non-Comp: 8] [Not Assessed: 41] [N/A: 0]
   ```
   - Her biri renkli sol border ile ayrilmis kutu

3. **Function Scores Grid (6 kolon):**
   ```
   [GV: 78%] [ID: 62%] [PR: 54%] [DE: 35%] [RS: 82%] [RC: 67%]
   ```
   - Her kart: Fonksiyon kodu kutusu + yuzde + ad
   - Renk kodlu skora gore

4. **Navigation Cards (3 kolon):**
   ```
   [📋 Data Collection Wizard] [✅ Compliance Checklist] [📊 Assessment Report]
   ```
   - Hover: Icon buyume (scale) efekti
   - Link olarak wizard, checklist, report sayfasi

5. **Vendor Info Card (vendor assessment icin):**
   - Vendor adi + criticality badge
   - Industry, contact info (email, website)
   - CriticalityBadge componenti ile

### 4.4 Vendors Sayfasi Guncellemeleri

**Mevcut:** Search + Risk tier filter + Vendor card grid (iyi yapida)

**Eklenecekler:**

1. **Stats Grid (4 kolon, sayfa ustu):**
   ```
   [Total Vendors] [High Risk (kirmizi)] [Avg Score] [Critical Vendors]
   ```

2. **Criticality Breakdown Karti:**
   ```
   Vendors by Criticality
   [Low: 5 (yesil)] [Medium: 4 (sari)] [High: 2 (turuncu)] [Critical: 1 (kirmizi)]
   ```

3. **Quick Action Linkleri:**
   - "Manage Templates" → `/vendors/templates`
   - "View Rankings" → `/vendors/ranking`

4. **VendorCard Guncelleme:**
   - RiskScoreIndicator eklenmesi (dairesel skor gosterimi)
   - Assessment sayisi + son assessment tarihi
   - Hover: Border renk degisimi + golge artisi

### 4.5 VendorDetail Sayfasi Guncellemeleri

**Mevcut:** Back + Name + Risk badge + Info card + Stats + Assessment history

**Eklenecekler:**

1. **Risk Score Karti (buyuk):**
   - RiskScoreIndicator (lg boyut) + son guncelleme tarihi

2. **Analytics Bolumu (2 kolon):**
   - VendorComplianceTrendChart: Cizgi grafik (skor zaman serisi)
   - VendorFunctionBreakdown: 6 fonksiyon bar grafigi

3. **Contact Information Karti (2 kolon grid):**
   - Icon + Label + Value formatinda
   - Email: Tiklanabilir mailto link
   - Website: Tiklanabilir dis link
   - Phone: Tiklanabilir tel link

4. **Edit/Delete butonlari header'da**

---

## 5. YENI COMPONENTLER

### 5.1 Kritik Oncelikli

| # | Component | Dosya | Aciklama |
|---|-----------|-------|----------|
| 1 | **WizardStepper** | `components/wizard/WizardStepper.tsx` | 15 adim dikey stepper + progress bar |
| 2 | **StepNavigation** | `components/wizard/StepNavigation.tsx` | Sticky alt navigasyon (prev/save/next) |
| 3 | **FileUploader** | `components/evidence/FileUploader.tsx` | Drag-drop dosya yukleme alani |
| 4 | **EvidenceList** | `components/evidence/EvidenceList.tsx` | Yuklenen dosyalar listesi |
| 5 | **ComplianceChart** | `components/charts/ComplianceChart.tsx` | SVG dairesel ilerleme grafigi |
| 6 | **StatusSelector** | `components/assessment/StatusSelector.tsx` | Custom status dropdown |
| 7 | **FunctionScoreChart** | `components/charts/FunctionScoreChart.tsx` | Fonksiyon bazli yatay bar grafik |

### 5.2 Yuksek Oncelikli

| # | Component | Dosya | Aciklama |
|---|-----------|-------|----------|
| 8 | **ExecutiveSummaryCard** | `components/report/ExecutiveSummaryCard.tsx` | AI ozet karti (strengths/gaps/actions) |
| 9 | **AIAnalysisButton** | `components/assessment/AIAnalysisButton.tsx` | AI analiz tetikleme butonu |
| 10 | **AIAnalysisResults** | `components/assessment/AIAnalysisResults.tsx` | AI sonuc gosterim paneli |
| 11 | **CategoryGroup** | `components/assessment/CategoryGroup.tsx` | Kategori baslik + subcategory listesi |
| 12 | **CriticalityBadge** | `components/vendors/CriticalityBadge.tsx` | Vendor criticality pill badge |
| 13 | **RiskScoreIndicator** | `components/vendors/RiskScoreIndicator.tsx` | Dairesel risk skoru gosterimi |

### 5.3 Orta Oncelikli

| # | Component | Dosya | Aciklama |
|---|-----------|-------|----------|
| 14 | **VendorForm** | `components/vendors/VendorForm.tsx` | Vendor ekleme/duzenleme formu |
| 15 | **VendorComplianceTrendChart** | `components/charts/VendorTrendChart.tsx` | Cizgi grafik (zaman serisi) |
| 16 | **VendorFunctionBreakdown** | `components/charts/VendorFunctionBreakdown.tsx` | 6-fonksiyon bar grafik |
| 17 | **TemplateCard** | `components/vendors/TemplateCard.tsx` | Template onizleme karti |
| 18 | **VendorSelector** | `components/vendors/VendorSelector.tsx` | Assessment'ta vendor secimi |
| 19 | **TemplateSelector** | `components/vendors/TemplateSelector.tsx` | Template secimi dropdown |

---

## 6. ANIMASYON VE INTERAKTIVITE

### 6.1 Framer Motion Entegrasyonu

**Kutuphane:** `framer-motion` (npm install framer-motion)

**Kullanim Alanlari:**

1. **Sayfa giris animasyonu:**
   ```tsx
   <motion.div
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.4 }}
   >
   ```

2. **Staggered list/grid animasyonu:**
   ```tsx
   <motion.div
     initial={{ opacity: 0, y: 20 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ delay: index * 0.05 }}
   >
   ```

3. **Hover efektleri:**
   ```tsx
   <motion.div whileHover={{ scale: 1.02 }}>
   ```

4. **Progress bar animasyonu:**
   ```tsx
   <motion.div
     initial={{ width: 0 }}
     animate={{ width: `${score}%` }}
     transition={{ duration: 0.5 }}
   />
   ```

### 6.2 Transition Guncellemeleri

**Mevcut:** `transition: all 150ms ease`
**Hedef Ekleme:**
- `transition-colors`: 200ms (renk degisiklikleri)
- `transition-shadow`: 200ms (golge degisiklikleri)
- `transition-transform`: 200ms (transform animasyonlari)

---

## 7. RESPONSIVE TASARIM IYILESTIRMELERI

### Breakpoint Uyumu

| Breakpoint | Mevcut | Hedef |
|---|---|---|
| Mobile | `< 640px` (window.innerWidth) | `< 640px` (sm) |
| Tablet | `< 1024px` | `640px - 1024px` (md) |
| Desktop | `>= 1024px` | `1024px - 1280px` (lg) |
| Large | Yok | `>= 1280px` (xl) |

### Grid Responsive Kurallar

| Component | Mobile | Tablet | Desktop |
|---|---|---|---|
| Stats Grid | 1 col | 2 col | 4 col |
| Assessment Cards | 1 col | 2 col | 3 col |
| Vendor Cards | 1 col | 2 col | 3 col |
| Function Tabs | Scroll | Scroll | All visible |
| Wizard Layout | 1 col (stepper ust) | 1 col | 2 col (stepper yan) |
| Score Distribution | 2 col | 3 col | 5 col |

---

## 8. STIL YAKLASIMI KARARI

### Mevcut Durum
Cloudflare projesi **inline styles + CSS variables** kullanıyor:
```tsx
<div style={{ background: 'var(--card)', borderRadius: 'var(--radius-md)' }}>
```

### Next.js Yaklasimi
Next.js projesi **Tailwind CSS utility classes** kullaniyor:
```tsx
<div className="bg-white rounded-xl shadow-sm border border-navy-200">
```

### Karar
**Mevcut inline style yaklasimini koruyarak** yeni componentleri olustur. Tutarlilik icin tum yeni componentler de CSS variables + inline style kullanacak. Boylece:
- Tema degisiklikleri otomatik calisir (dark mode)
- Mevcut kodla uyumlu olur
- Ekstra Tailwind class karmasikligi olmaz

---

## 9. KUTUPHANE GEREKSINIMLERI

### Yeni Kurulacak Paketler

```bash
cd frontend
npm install framer-motion    # Animasyonlar
npm install jspdf             # PDF olusturma
npm install jspdf-autotable   # PDF tablo destegi
npm install date-fns          # Tarih formatlama
npm install recharts          # Grafik kutuphanesi (opsiyonel)
```

### Opsiyonel (Nice-to-have)

```bash
npm install react-hook-form   # Form yonetimi
npm install zod               # Validation
npm install @hookform/resolvers  # RHF + Zod entegrasyonu
```

---

## 10. UYGULAMA SIRASI (SPRINT PLANI)

### Sprint 1: Design System + Layout (1-2 gun)
- [ ] Navy renk paleti CSS variables tanimla
- [ ] Font degisikligi (Playfair Display + Inter)
- [ ] Header/TopNav yeniden tasarla (center nav, fixed position)
- [ ] Sidebar'i mobil-only drawer yap, desktop nav'i header'a tasi
- [ ] Main content max-width container ekle
- [ ] Focus state'leri guncelle

### Sprint 2: Temel Componentler (2-3 gun)
- [ ] ComplianceChart (SVG circle) componenti
- [ ] StatusSelector (custom dropdown) componenti
- [ ] FunctionScoreChart (horizontal bars) componenti
- [ ] CriticalityBadge componenti
- [ ] RiskScoreIndicator componenti
- [ ] CategoryGroup componenti

### Sprint 3: Wizard Sayfasi (3-4 gun)
- [ ] WizardStepper componenti
- [ ] StepNavigation componenti
- [ ] FileUploader (drag-drop) componenti
- [ ] EvidenceList componenti
- [ ] AssessmentWizard sayfasi (iki kolonlu layout)
- [ ] Route ekleme: `/assessments/:id/wizard`

### Sprint 4: Checklist + Report Sayfalari (2-3 gun)
- [ ] AssessmentChecklist sayfasi (veya mevcut Items tab genisletme)
- [ ] AssessmentReport sayfasi
- [ ] ExecutiveSummaryCard componenti
- [ ] PDF export fonksiyonu (jsPDF)
- [ ] Print CSS
- [ ] Route ekleme: `/assessments/:id/checklist`, `/assessments/:id/report`

### Sprint 5: Dashboard + Detail Guncellemeleri (1-2 gun)
- [ ] Dashboard'a Vendor Risk section ekle
- [ ] Dashboard'a Framework Overview ekle
- [ ] Dashboard'a Getting Started section ekle
- [ ] AssessmentDetail'e Score Circle ekle
- [ ] AssessmentDetail'e Navigation Cards ekle
- [ ] AssessmentDetail'e Function Scores grid ekle
- [ ] Framer Motion animasyonlari ekle

### Sprint 6: Vendor Sayfalari (2-3 gun)
- [ ] VendorRanking sayfasi
- [ ] VendorTemplates sayfasi
- [ ] VendorNew sayfasi (veya mevcut modal'i genislet)
- [ ] VendorEdit sayfasi
- [ ] Vendors sayfasina stats grid ekle
- [ ] VendorDetail'e analytics grafikleri ekle
- [ ] VendorComplianceTrendChart componenti
- [ ] VendorFunctionBreakdown componenti

### Sprint 7: AI UI + Polish (1-2 gun)
- [ ] AIAnalysisButton componenti
- [ ] AIAnalysisResults componenti
- [ ] Items tab'ina AI analiz entegrasyonu
- [ ] Loading state'ler (skeleton loader guncellemeleri)
- [ ] Empty state'ler tum sayfalarda
- [ ] Responsive test ve duzeltmeler

---

## 11. DOSYA YAPISI (HEDEF)

```
frontend/src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx          (guncelleme: desktop sidebar kaldir)
│   │   ├── Header.tsx            (yeniden yaz: center nav)
│   │   ├── Sidebar.tsx           (guncelleme: mobil-only drawer)
│   │   └── TopNav.tsx            (kaldir veya Header'a birlestir)
│   ├── wizard/                   ← YENi KLASOR
│   │   ├── WizardStepper.tsx
│   │   └── StepNavigation.tsx
│   ├── evidence/                 ← YENi KLASOR
│   │   ├── FileUploader.tsx
│   │   └── EvidenceList.tsx
│   ├── assessment/               ← YENi KLASOR
│   │   ├── StatusSelector.tsx
│   │   ├── CategoryGroup.tsx
│   │   ├── AIAnalysisButton.tsx
│   │   └── AIAnalysisResults.tsx
│   ├── charts/                   ← YENi KLASOR
│   │   ├── ComplianceChart.tsx
│   │   ├── FunctionScoreChart.tsx
│   │   ├── VendorTrendChart.tsx
│   │   └── VendorFunctionBreakdown.tsx
│   ├── report/                   ← YENi KLASOR
│   │   └── ExecutiveSummaryCard.tsx
│   ├── vendors/                  ← YENi KLASOR
│   │   ├── CriticalityBadge.tsx
│   │   ├── RiskScoreIndicator.tsx
│   │   ├── VendorForm.tsx
│   │   ├── VendorSelector.tsx
│   │   ├── TemplateSelector.tsx
│   │   └── TemplateCard.tsx
│   ├── AssessmentCard.tsx        (guncelleme)
│   ├── DonutChart.tsx            (korunacak)
│   ├── NewVendorModal.tsx        (korunacak)
│   ├── SendToVendorModal.tsx     (korunacak)
│   ├── SkeletonLoader.tsx        (korunacak)
│   ├── StatCard.tsx              (guncelleme: animasyon ekle)
│   ├── ThemeToggle.tsx           (korunacak)
│   └── Toast.tsx                 (korunacak)
├── pages/
│   ├── Dashboard.tsx             (guncelleme: yeni sectionlar)
│   ├── Assessments.tsx           (guncelleme: type tabs)
│   ├── AssessmentDetail.tsx      (guncelleme: score circle, nav cards)
│   ├── AssessmentWizard.tsx      ← YENi SAYFA
│   ├── AssessmentChecklist.tsx   ← YENi SAYFA
│   ├── AssessmentReport.tsx      ← YENi SAYFA
│   ├── NewAssessment.tsx         (korunacak)
│   ├── Vendors.tsx               (guncelleme: stats, links)
│   ├── VendorDetail.tsx          (guncelleme: charts, contact)
│   ├── VendorRanking.tsx         ← YENi SAYFA
│   ├── VendorTemplates.tsx       ← YENi SAYFA
│   ├── VendorNew.tsx             ← YENi SAYFA (veya modal korunur)
│   ├── VendorEdit.tsx            ← YENi SAYFA
│   ├── VendorPortal.tsx          (korunacak - Cloudflare'da extra)
│   ├── AssessmentComparison.tsx  (korunacak - Cloudflare'da extra)
│   ├── Analytics.tsx             (korunacak)
│   ├── Exports.tsx               (korunacak)
│   ├── Organization.tsx          (korunacak)
│   ├── Profile.tsx               (korunacak)
│   ├── Guide.tsx                 ← YENi SAYFA (dusuk oncelik)
│   └── Help.tsx                  ← YENi SAYFA (dusuk oncelik)
└── router.tsx                    (guncelleme: yeni route'lar ekle)
```

---

## 12. NOTLAR VE KISITLAMALAR

1. **Backend degisikligi yok** — Tum API endpoint'ler mevcut haliyle korunacak. Yeni UI componentleri mevcut API'leri kullanacak.

2. **Vendor Self-Assessment korunacak** — Cloudflare'da olan magic link/portal sistemi Next.js'de yok. Bu Cloudflare'in avantaji, korunacak.

3. **AssessmentComparison korunacak** — Cloudflare'da olan karsilastirma sayfasi korunacak.

4. **Theme Toggle** — Next.js'de acik bir theme toggle yok. Mevcut Cloudflare theme toggle sistemi korunabilir veya kaldirilabilir (tasarim karari).

5. **Subcategory Sayisi (106 vs 120)** — Seed data farki. UI bu farktan bagimsiz calisir, ancak seed data dogrulanmali.

6. **Auth UI** — Login/Signup sayfalari bu dokumanda YOK cunku backend auth sistemi kapsam disi. Auth UI ihtiyaci olursa ayri bir dokuman olusturulacak.

7. **Inline Style Yaklasimi** — Mevcut projedeki inline style + CSS variable yaklasimi korunacak. Tailwind utility class'larina gecis yapilmayacak (tutarlilik icin).
