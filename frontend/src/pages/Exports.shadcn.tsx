import { useState, useEffect } from 'react';
import {
  FileText, FileSpreadsheet, Loader2, Download, AlertCircle,
  Building2, Users, BarChart2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import { assessmentsApi } from '../api/assessments';
import { companyGroupsApi } from '../api/company-groups';
import type { Assessment, AssessmentItem, Vendor } from '../types';
import { T, card } from '../tokens';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const ORG_ID = 'demo-org-123';

// ── jsPDF helpers ────────────────────────────────────────────────────────────

function buildAssessmentPDF(assessment: Assessment, items: AssessmentItem[], doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(assessment.name, 15, 19);

  // Meta row
  doc.setFillColor(245, 247, 255);
  doc.rect(0, 30, W, 16, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const metaParts: string[] = [];
  metaParts.push(`Framework: NIST CSF 2.0`);
  metaParts.push(`Status: ${assessment.status}`);
  metaParts.push(`Generated: ${new Date().toLocaleDateString()}`);
  doc.text(metaParts.join('   ·   '), 15, 41);

  // Score
  const score = assessment.overall_score ?? 0;
  const sR = score >= 80 ? 22 : score >= 50 ? 217 : 239;
  const sG = score >= 80 ? 163 : score >= 50 ? 119 : 68;
  const sB = score >= 80 ? 74 : score >= 50 ? 6 : 68;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(42);
  doc.setTextColor(sR, sG, sB);
  doc.text(`${score.toFixed(1)}%`, 15, 75);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Overall Compliance Score', 15, 82);

  // Stat boxes
  const total = items.length;
  const compliant = items.filter(i => i.status === 'compliant').length;
  const partial = items.filter(i => i.status === 'partial').length;
  const nonCompliant = items.filter(i => i.status === 'non_compliant').length;
  const notAssessed = total - compliant - partial - nonCompliant;
  const bW = (W - 30) / 4;
  const bY = 90;
  [
    { label: 'Compliant', value: compliant, r: 22, g: 163, b: 74 },
    { label: 'Partial', value: partial, r: 217, g: 119, b: 6 },
    { label: 'Non-Compliant', value: nonCompliant, r: 239, g: 68, b: 68 },
    { label: 'Not Assessed', value: notAssessed, r: 100, g: 116, b: 139 },
  ].forEach((s, i) => {
    const x = 15 + i * bW;
    doc.setFillColor(s.r, s.g, s.b);
    doc.roundedRect(x, bY, bW - 5, 20, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(String(s.value), x + (bW - 5) / 2, bY + 10, { align: 'center' });
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(s.label, x + (bW - 5) / 2, bY + 17, { align: 'center' });
  });

  // Function breakdown
  const fnMap: Record<string, { name: string; c: number; p: number; nc: number; na: number; tot: number }> = {};
  for (const item of items) {
    const fn = item.function?.name || item.subcategory_id.split('.')[0] || '?';
    if (!fnMap[fn]) fnMap[fn] = { name: fn, c: 0, p: 0, nc: 0, na: 0, tot: 0 };
    fnMap[fn].tot++;
    if (item.status === 'compliant') fnMap[fn].c++;
    else if (item.status === 'partial') fnMap[fn].p++;
    else if (item.status === 'non_compliant') fnMap[fn].nc++;
    else fnMap[fn].na++;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('CSF Function Breakdown', 15, 122);

  autoTable(doc, {
    startY: 126,
    head: [['Function', 'Compliant', 'Partial', 'Non-Compliant', 'Not Assessed', 'Score %']],
    body: Object.values(fnMap).map(d => {
      const sc = d.tot > 0 ? ((d.c + d.p * 0.5) / d.tot * 100).toFixed(1) : '0.0';
      return [d.name, d.c, d.p, d.nc, d.na, `${sc}%`];
    }),
    styles: { fontSize: 9, font: 'helvetica', cellPadding: 4 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 5: { halign: 'center', fontStyle: 'bold' } },
  });

  // Findings
  const findings = items
    .filter(i => i.status === 'non_compliant' || i.status === 'partial')
    .slice(0, 30);
  if (findings.length === 0) return;

  const afterFn = (doc as any).lastAutoTable?.finalY ?? 180;
  if (afterFn > doc.internal.pageSize.getHeight() - 60) doc.addPage();
  const fY = afterFn > doc.internal.pageSize.getHeight() - 60 ? 20 : afterFn + 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`Findings (${findings.length})`, 15, fY);

  autoTable(doc, {
    startY: fY + 4,
    head: [['Control ID', 'Control Name', 'Status', 'Notes']],
    body: findings.map(f => [
      f.subcategory_id,
      f.subcategory?.name ?? '',
      f.status === 'non_compliant' ? 'Non-Compliant' : 'Partial',
      (f.notes ?? '').slice(0, 80),
    ]),
    styles: { fontSize: 8, font: 'helvetica', cellPadding: 3, overflow: 'linebreak' },
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [255, 250, 250] },
    columnStyles: { 3: { cellWidth: 70 } },
  });
}

// ── Types ────────────────────────────────────────────────────────────────────

type ReportKey = 'org_summary' | 'vendor_risk' | 'assessment_detail' | 'group_overview';

interface Report {
  key: ReportKey;
  Icon: React.ElementType;
  title: string;
  description: string;
  format: 'PDF' | 'Excel';
  needsAssessment?: boolean;
}

const REPORTS: Report[] = [
  {
    key: 'org_summary',
    Icon: BarChart2,
    title: 'Organization Compliance Summary',
    description: 'Overall compliance score, CSF function breakdown, and top findings from the latest organization assessment.',
    format: 'PDF',
  },
  {
    key: 'vendor_risk',
    Icon: Users,
    title: 'Vendor Risk Report',
    description: 'Excel workbook listing all vendors with risk levels, criticality ratings, and latest assessment compliance scores.',
    format: 'Excel',
  },
  {
    key: 'assessment_detail',
    Icon: FileText,
    title: 'Assessment Detail Export',
    description: 'Full PDF report for a selected assessment — includes all controls, function scores, and findings.',
    format: 'PDF',
    needsAssessment: true,
  },
  {
    key: 'group_overview',
    Icon: Building2,
    title: 'Group Companies Overview',
    description: 'Excel workbook with all group subsidiaries, compliance scores by company, and assessment history.',
    format: 'Excel',
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function Exports() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [loadingKey, setLoadingKey] = useState<ReportKey | null>(null);
  const [errors, setErrors] = useState<Partial<Record<ReportKey, string>>>({});

  useEffect(() => {
    assessmentsApi.list()
      .then(setAssessments)
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const setError = (key: ReportKey, msg: string) =>
    setErrors(prev => ({ ...prev, [key]: msg }));
  const clearError = (key: ReportKey) =>
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });

  const handleGenerate = async (key: ReportKey) => {
    clearError(key);
    setLoadingKey(key);
    try {
      switch (key) {

        // ── a) Organization Compliance Summary (PDF) ──────────────────────
        case 'org_summary': {
          const allA = await assessmentsApi.list();
          const orgA = allA
            .filter(a => a.assessment_type === 'organization' || !a.vendor_id)
            .sort((a, b) => (b.updated_at as number) - (a.updated_at as number));
          if (orgA.length === 0) { setError(key, 'No organization assessments found'); break; }
          const latest = orgA[0];
          const items = await assessmentsApi.getItems(latest.id);
          const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          buildAssessmentPDF(latest, items, doc);
          const safeName = latest.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
          doc.save(`org-compliance-summary-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
          break;
        }

        // ── b) Vendor Risk Report (Excel) ─────────────────────────────────
        case 'vendor_risk': {
          const res = await axios.get(`${API_URL}/api/vendors`, {
            params: { organization_id: ORG_ID },
          });
          const allVendors: Vendor[] = res.data;
          if (allVendors.length === 0) { setError(key, 'No vendors found'); break; }

          const header = ['Vendor Name', 'Industry', 'Criticality', 'Status', 'Risk Score', 'Latest Assessment Score', 'Last Assessment Date'];
          const rows = allVendors.map(v => [
            v.name,
            v.industry ?? 'N/A',
            v.criticality_level ?? v.risk_tier ?? 'N/A',
            v.vendor_status ?? 'N/A',
            v.risk_score != null ? v.risk_score : 'N/A',
            v.latest_assessment_score != null ? `${v.latest_assessment_score.toFixed(1)}%` : 'N/A',
            v.last_assessment_date ? new Date(v.last_assessment_date).toLocaleDateString() : 'N/A',
          ]);

          const wb = XLSX.utils.book_new();
          const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
          ws['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 22 }];
          XLSX.utils.book_append_sheet(wb, ws, 'Vendors');

          // Summary sheet
          const scoreVendors = allVendors.filter(v => v.latest_assessment_score != null);
          const avgScore = scoreVendors.length > 0
            ? scoreVendors.reduce((s, v) => s + (v.latest_assessment_score!), 0) / scoreVendors.length
            : null;
          const summaryWs = XLSX.utils.aoa_to_sheet([
            ['Metric', 'Value'],
            ['Total Vendors', allVendors.length],
            ['Active Vendors', allVendors.filter(v => v.vendor_status === 'active').length],
            ['Critical Vendors', allVendors.filter(v => v.criticality_level === 'critical').length],
            ['Average Compliance Score', avgScore != null ? `${avgScore.toFixed(1)}%` : 'N/A'],
            ['Report Generated', new Date().toLocaleString()],
          ]);
          XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

          XLSX.writeFile(wb, `vendor-risk-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
          break;
        }

        // ── c) Assessment Detail Export (PDF) ─────────────────────────────
        case 'assessment_detail': {
          if (!selectedAssessment) { setError(key, 'Please select an assessment'); break; }
          const assessment = assessments.find(a => a.id === selectedAssessment);
          if (!assessment) { setError(key, 'Assessment not found'); break; }
          const items = await assessmentsApi.getItems(selectedAssessment);
          const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          buildAssessmentPDF(assessment, items, doc);
          const safeName = assessment.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
          doc.save(`assessment-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`);
          break;
        }

        // ── d) Group Companies Overview (Excel) ───────────────────────────
        case 'group_overview': {
          const groupsRes = await companyGroupsApi.list(ORG_ID);
          const groups = groupsRes.data;
          if (groups.length === 0) { setError(key, 'No group companies found'); break; }

          // Fetch detail for each group to get vendor list
          const groupDetails = await Promise.all(
            groups.map(g => companyGroupsApi.get(g.id).then(r => r.data).catch(() => null))
          );

          // Groups sheet
          const groupHeader = ['Group Name', 'Industry', 'Companies', 'Avg Score'];
          const groupRows: (string | number)[][] = [];
          for (const g of groups) {
            const detail = groupDetails.find(d => d?.id === g.id);
            const vendors: Vendor[] = detail?.vendors ?? [];
            const scoredVendors = vendors.filter((v: Vendor) => v.latest_assessment_score != null);
            const avg = scoredVendors.length > 0
              ? scoredVendors.reduce((s: number, v: Vendor) => s + v.latest_assessment_score!, 0) / scoredVendors.length
              : null;
            groupRows.push([
              g.name,
              g.industry ?? 'N/A',
              g.vendor_count ?? vendors.length,
              avg != null ? `${avg.toFixed(1)}%` : 'N/A',
            ]);
          }

          // Companies sheet (all vendors across all groups)
          const companyHeader = ['Company Name', 'Group', 'Industry', 'Criticality', 'Latest Score', 'Risk Score'];
          const companyRows: (string | number)[][] = [];
          for (let i = 0; i < groups.length; i++) {
            const detail = groupDetails[i];
            const vendors: Vendor[] = detail?.vendors ?? [];
            for (const v of vendors) {
              companyRows.push([
                v.name,
                groups[i].name,
                v.industry ?? 'N/A',
                v.criticality_level ?? v.risk_tier ?? 'N/A',
                v.latest_assessment_score != null ? `${v.latest_assessment_score.toFixed(1)}%` : 'N/A',
                v.risk_score != null ? v.risk_score : 'N/A',
              ]);
            }
          }

          const wb = XLSX.utils.book_new();
          const groupsWs = XLSX.utils.aoa_to_sheet([groupHeader, ...groupRows]);
          groupsWs['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 14 }];
          XLSX.utils.book_append_sheet(wb, groupsWs, 'Groups');

          const companiesWs = XLSX.utils.aoa_to_sheet([companyHeader, ...companyRows]);
          companiesWs['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 12 }];
          XLSX.utils.book_append_sheet(wb, companiesWs, 'Companies');

          XLSX.writeFile(wb, `group-companies-overview-${new Date().toISOString().slice(0, 10)}.xlsx`);
          break;
        }
      }
    } catch (err) {
      setError(key, err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoadingKey(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '7px 10px',
    borderRadius: 7,
    background: T.bg,
    border: `1px solid ${T.border}`,
    fontFamily: T.fontSans,
    fontSize: 12,
    color: T.textPrimary,
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
          Reporting Center
        </h1>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, marginTop: 4 }}>
          Generate and download compliance reports, risk summaries, and audit packages
        </p>
      </div>

      {/* Report cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
        {REPORTS.map(report => {
          const { Icon } = report;
          const isLoading = loadingKey === report.key;
          const err = errors[report.key];
          const isPDF = report.format === 'PDF';
          const fmtColor = isPDF ? T.danger : T.success;
          const fmtBg = isPDF ? T.dangerLight : T.successLight;
          const fmtBorder = isPDF ? T.dangerBorder : T.successBorder;
          const iconColor = isPDF ? T.danger : T.success;
          const iconBg = isPDF ? T.dangerLight : T.successLight;

          return (
            <div
              key={report.key}
              style={{
                ...card,
                padding: '22px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                transition: 'box-shadow 0.15s',
              }}
            >
              {/* Top row: icon + format badge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={20} style={{ color: iconColor }} />
                </div>
                <span style={{
                  fontFamily: T.fontMono, fontSize: 10, fontWeight: 600,
                  padding: '3px 9px', borderRadius: 5,
                  background: fmtBg, color: fmtColor, border: `1px solid ${fmtBorder}`,
                }}>
                  {isPDF ? 'PDF' : 'Excel'}
                </span>
              </div>

              {/* Title */}
              <div style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 6, lineHeight: 1.3 }}>
                {report.title}
              </div>

              {/* Description */}
              <div style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, lineHeight: 1.55, marginBottom: 18, flex: 1 }}>
                {report.description}
              </div>

              {/* Assessment selector (if needed) */}
              {report.needsAssessment && (
                <div style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontFamily: T.fontSans, fontSize: 10, fontWeight: 700, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' as const, marginBottom: 5 }}>
                    Assessment
                  </label>
                  <select
                    value={selectedAssessment}
                    onChange={e => setSelectedAssessment(e.target.value)}
                    style={inputStyle}
                    disabled={loadingData}
                  >
                    <option value="">Select an assessment…</option>
                    {assessments.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}{a.overall_score != null ? ` — ${a.overall_score.toFixed(1)}%` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Error */}
              {err && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: T.fontSans, fontSize: 11, color: T.danger, marginBottom: 8 }}>
                  <AlertCircle size={12} />
                  {err}
                </div>
              )}

              {/* Generate button */}
              <button
                onClick={() => handleGenerate(report.key)}
                disabled={isLoading || loadingData}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '9px 16px', borderRadius: 8,
                  background: isLoading ? T.accentLight : T.accent,
                  color: isLoading ? T.accent : '#FFF',
                  border: `1px solid ${isLoading ? T.accentBorder : T.accent}`,
                  fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                  cursor: isLoading || loadingData ? 'not-allowed' : 'pointer',
                  opacity: loadingData && !isLoading ? 0.6 : 1,
                  transition: 'all 0.15s',
                  marginTop: 'auto',
                }}
              >
                {isLoading ? (
                  <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</>
                ) : (
                  <><Download size={14} /> Generate & Download</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div style={{
        ...card,
        padding: '14px 18px',
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: T.successLight, border: `1px solid ${T.successBorder}`,
      }}>
        <FileSpreadsheet size={16} style={{ color: T.success, marginTop: 1, flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: T.fontSans, fontSize: 13, fontWeight: 700, color: T.success, marginBottom: 2 }}>
            Compliance-Ready Exports
          </div>
          <div style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
            All reports include timestamps and complete audit trails — suitable for SOC 2, ISO 27001, and NIST CSF audits.
          </div>
        </div>
      </div>

    </div>
  );
}

// Inject spinner keyframe once
if (typeof document !== 'undefined' && !document.getElementById('rc-spin-style')) {
  const s = document.createElement('style');
  s.id = 'rc-spin-style';
  s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(s);
}
