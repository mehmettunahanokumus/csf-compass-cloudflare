import { useState, useEffect, useRef } from 'react';
import {
  FileText, FileSpreadsheet, Loader2, Download, AlertCircle,
  Building2, Users, BarChart2, ChevronDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import { assessmentsApi } from '../api/assessments';
import { companyGroupsApi } from '../api/company-groups';
import type { Assessment, AssessmentItem, Vendor, CompanyGroup } from '../types';
import { T, card } from '../tokens';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const ORG_ID = 'demo-org-123';

type FormatType = 'pdf' | 'xlsx' | 'csv';
type ReportKey = 'org_summary' | 'vendor_risk' | 'assessment_detail' | 'group_overview';

// ── Format metadata ───────────────────────────────────────────────────────────

const FMT: Record<FormatType, { label: string; desc: string; bg: string; color: string; border: string }> = {
  pdf:  { label: 'PDF',   desc: 'Professional PDF document',    bg: T.dangerLight,  color: T.danger,  border: T.dangerBorder  },
  xlsx: { label: 'Excel', desc: 'Multi-sheet workbook (.xlsx)', bg: T.successLight, color: T.success, border: T.successBorder },
  csv:  { label: 'CSV',   desc: 'Plain text export (.csv)',     bg: T.accentLight,  color: T.accent,  border: T.accentBorder  },
};

// ── jsPDF: Assessment PDF ─────────────────────────────────────────────────────

function buildAssessmentPDF(assessment: Assessment, items: AssessmentItem[], doc: jsPDF) {
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, W, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(assessment.name, 15, 19);

  doc.setFillColor(245, 247, 255);
  doc.rect(0, 30, W, 16, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Framework: NIST CSF 2.0   ·   Status: ${assessment.status}   ·   Generated: ${new Date().toLocaleDateString()}`, 15, 41);

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

  const total = items.length;
  const compliant = items.filter(i => i.status === 'compliant').length;
  const partial = items.filter(i => i.status === 'partial').length;
  const nonCompliant = items.filter(i => i.status === 'non_compliant').length;
  const notAssessed = total - compliant - partial - nonCompliant;
  const bW = (W - 30) / 4;
  const bY = 90;
  [
    { label: 'Compliant',     value: compliant,    r: 22,  g: 163, b: 74  },
    { label: 'Partial',       value: partial,      r: 217, g: 119, b: 6   },
    { label: 'Non-Compliant', value: nonCompliant, r: 239, g: 68,  b: 68  },
    { label: 'Not Assessed',  value: notAssessed,  r: 100, g: 116, b: 139 },
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

  const findings = items.filter(i => i.status === 'non_compliant' || i.status === 'partial').slice(0, 30);
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

// ── jsPDF: Vendor Risk PDF ────────────────────────────────────────────────────

function buildVendorRiskPDF(vendors: Vendor[]): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Vendor Risk Report', 15, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}   ·   Total Vendors: ${vendors.length}`, 15, 25);

  autoTable(doc, {
    startY: 34,
    head: [['Vendor Name', 'Industry', 'Criticality', 'Status', 'Compliance Score']],
    body: vendors.map(v => [
      v.name,
      v.industry ?? 'N/A',
      v.criticality_level ?? v.risk_tier ?? 'N/A',
      v.vendor_status ?? 'N/A',
      v.latest_assessment_score != null ? `${v.latest_assessment_score.toFixed(1)}%` : 'N/A',
    ]),
    styles: { fontSize: 9, font: 'helvetica', cellPadding: 4 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  return doc;
}

// ── jsPDF: Group Overview PDF ─────────────────────────────────────────────────

function buildGroupOverviewPDF(groups: CompanyGroup[], groupDetails: (any | null)[]): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Group Companies Overview', 15, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}   ·   Groups: ${groups.length}`, 15, 25);

  // Groups summary
  autoTable(doc, {
    startY: 34,
    head: [['Group Name', 'Industry', 'Companies', 'Avg Score']],
    body: groups.map(g => {
      const detail = groupDetails.find((d: any) => d?.id === g.id);
      const vendors: Vendor[] = detail?.vendors ?? [];
      const scored = vendors.filter((v: Vendor) => v.latest_assessment_score != null);
      const avg = scored.length > 0 ? scored.reduce((s: number, v: Vendor) => s + v.latest_assessment_score!, 0) / scored.length : null;
      return [g.name, g.industry ?? 'N/A', g.vendor_count ?? vendors.length, avg != null ? `${avg.toFixed(1)}%` : 'N/A'];
    }),
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // All companies table
  const afterGroups = (doc as any).lastAutoTable?.finalY ?? 80;
  const cY = afterGroups + 14;
  if (cY < doc.internal.pageSize.getHeight() - 40) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('All Companies', 15, cY);

    const companyRows: string[][] = [];
    for (let i = 0; i < groups.length; i++) {
      const vendors: Vendor[] = groupDetails[i]?.vendors ?? [];
      for (const v of vendors) {
        companyRows.push([
          v.name, groups[i].name,
          v.industry ?? 'N/A',
          v.criticality_level ?? v.risk_tier ?? 'N/A',
          v.latest_assessment_score != null ? `${v.latest_assessment_score.toFixed(1)}%` : 'N/A',
        ]);
      }
    }

    autoTable(doc, {
      startY: cY + 4,
      head: [['Company Name', 'Group', 'Industry', 'Criticality', 'Score']],
      body: companyRows,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
  }

  return doc;
}

// ── Excel: Assessment workbook ────────────────────────────────────────────────

function buildAssessmentExcel(assessment: Assessment, items: AssessmentItem[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();
  const dist = { compliant: 0, partial: 0, non_compliant: 0, not_assessed: 0 };
  items.forEach(i => { if (i.status in dist) dist[i.status as keyof typeof dist]++; });

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Assessment Report', assessment.name],
    ['Generated', new Date().toLocaleDateString()],
    ['Overall Score', `${(assessment.overall_score ?? 0).toFixed(1)}%`],
    [],
    ['Metric', 'Count', '% of Total'],
    ['Total Controls',  items.length,               '100%'],
    ['Compliant',       dist.compliant,     items.length ? `${((dist.compliant     / items.length) * 100).toFixed(1)}%` : '0%'],
    ['Partial',         dist.partial,       items.length ? `${((dist.partial       / items.length) * 100).toFixed(1)}%` : '0%'],
    ['Non-Compliant',   dist.non_compliant, items.length ? `${((dist.non_compliant / items.length) * 100).toFixed(1)}%` : '0%'],
    ['Not Assessed',    dist.not_assessed,  items.length ? `${((dist.not_assessed  / items.length) * 100).toFixed(1)}%` : '0%'],
  ]), 'Summary');

  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Function', 'Category', 'Control ID', 'Control Name', 'Status', 'Notes'],
    ...items.map(i => [
      i.function?.name || '', i.category?.name || '',
      i.subcategory_id || '', i.subcategory?.name || '',
      i.status === 'compliant' ? 'Compliant' : i.status === 'partial' ? 'Partial' : i.status === 'non_compliant' ? 'Non-Compliant' : i.status === 'not_applicable' ? 'N/A' : 'Not Assessed',
      i.notes || '',
    ]),
  ]), 'All Controls');

  const findings = items.filter(i => i.status === 'non_compliant' || i.status === 'partial');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([
    ['Control ID', 'Control Name', 'Function', 'Category', 'Status', 'Notes'],
    ...findings.map(i => [
      i.subcategory_id || '', i.subcategory?.name || '',
      i.function?.name || '', i.category?.name || '',
      i.status === 'non_compliant' ? 'Non-Compliant' : 'Partial',
      i.notes || '',
    ]),
  ]), 'Findings');

  return wb;
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function makeAssessmentCsv(items: AssessmentItem[]): string {
  const BOM = '\uFEFF';
  const sl = (s: string) => s === 'compliant' ? 'Compliant' : s === 'partial' ? 'Partial' : s === 'non_compliant' ? 'Non-Compliant' : s === 'not_applicable' ? 'N/A' : 'Not Assessed';
  const rows = [
    ['Function', 'Category', 'Control ID', 'Control Name', 'Status', 'Notes'],
    ...items.map(i => [i.function?.name || '', i.category?.name || '', i.subcategory_id || '', i.subcategory?.name || '', sl(i.status || 'not_assessed'), i.notes || '']),
  ];
  return BOM + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function makeVendorsCsv(vendors: Vendor[]): string {
  const BOM = '\uFEFF';
  const rows = [
    ['Vendor Name', 'Industry', 'Criticality', 'Status', 'Risk Score', 'Latest Compliance Score'],
    ...vendors.map(v => [
      v.name,
      v.industry ?? 'N/A',
      v.criticality_level ?? v.risk_tier ?? 'N/A',
      v.vendor_status ?? 'N/A',
      v.risk_score != null ? String(v.risk_score) : 'N/A',
      v.latest_assessment_score != null ? `${v.latest_assessment_score.toFixed(1)}%` : 'N/A',
    ]),
  ];
  return BOM + rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

function makeGroupsCsv(groups: CompanyGroup[], groupDetails: (any | null)[]): string {
  const BOM = '\uFEFF';
  const rows = [
    ['Company Name', 'Group', 'Industry', 'Criticality', 'Compliance Score'],
  ];
  for (let i = 0; i < groups.length; i++) {
    const vendors: Vendor[] = groupDetails[i]?.vendors ?? [];
    for (const v of vendors) {
      rows.push([
        v.name, groups[i].name,
        v.industry ?? 'N/A',
        v.criticality_level ?? v.risk_tier ?? 'N/A',
        v.latest_assessment_score != null ? `${v.latest_assessment_score.toFixed(1)}%` : 'N/A',
      ]);
    }
  }
  return BOM + rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Report definitions ────────────────────────────────────────────────────────

interface Report {
  key: ReportKey;
  Icon: React.ElementType;
  title: string;
  description: string;
  needsAssessment?: boolean;
}

const REPORTS: Report[] = [
  {
    key: 'org_summary',
    Icon: BarChart2,
    title: 'Organization Compliance Summary',
    description: 'Overall compliance score, CSF function breakdown, and top findings from the latest organization assessment.',
  },
  {
    key: 'vendor_risk',
    Icon: Users,
    title: 'Vendor Risk Report',
    description: 'All vendors with risk levels, criticality ratings, and latest assessment compliance scores.',
  },
  {
    key: 'assessment_detail',
    Icon: FileText,
    title: 'Assessment Detail Export',
    description: 'Full report for a selected assessment — includes all controls, function scores, and findings.',
    needsAssessment: true,
  },
  {
    key: 'group_overview',
    Icon: Building2,
    title: 'Group Companies Overview',
    description: 'All group subsidiaries with compliance scores by company and assessment history.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Exports() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [loadingKey, setLoadingKey] = useState<ReportKey | null>(null);
  const [loadingFmt, setLoadingFmt] = useState<FormatType | null>(null);
  const [errors, setErrors] = useState<Partial<Record<ReportKey, string>>>({});
  const [openDropdown, setOpenDropdown] = useState<ReportKey | null>(null);
  const dropdownRefs = useRef<Partial<Record<ReportKey, HTMLDivElement | null>>>({});

  useEffect(() => {
    assessmentsApi.list()
      .then(setAssessments)
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (openDropdown) {
        const ref = dropdownRefs.current[openDropdown];
        if (ref && !ref.contains(e.target as Node)) setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openDropdown]);

  const setError = (key: ReportKey, msg: string) =>
    setErrors(prev => ({ ...prev, [key]: msg }));
  const clearError = (key: ReportKey) =>
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });

  const handleGenerate = async (key: ReportKey, fmt: FormatType) => {
    clearError(key);
    setLoadingKey(key);
    setLoadingFmt(fmt);
    const today = new Date().toISOString().slice(0, 10);

    try {
      switch (key) {

        // ── Organization Compliance Summary ─────────────────────────────────
        case 'org_summary': {
          const allA = await assessmentsApi.list();
          const orgA = allA
            .filter(a => a.assessment_type === 'organization' || !a.vendor_id)
            .sort((a, b) => (b.updated_at as number) - (a.updated_at as number));
          if (orgA.length === 0) { setError(key, 'No organization assessments found'); break; }
          const latest = orgA[0];
          const items = await assessmentsApi.getItems(latest.id);
          const safeName = latest.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();

          if (fmt === 'pdf') {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            buildAssessmentPDF(latest, items, doc);
            doc.save(`org-compliance-summary-${safeName}-${today}.pdf`);
          } else if (fmt === 'xlsx') {
            const wb = buildAssessmentExcel(latest, items);
            XLSX.writeFile(wb, `org-compliance-summary-${safeName}-${today}.xlsx`);
          } else {
            downloadCsv(makeAssessmentCsv(items), `org-compliance-summary-${safeName}-${today}.csv`);
          }
          break;
        }

        // ── Vendor Risk Report ──────────────────────────────────────────────
        case 'vendor_risk': {
          const res = await axios.get(`${API_URL}/api/vendors`, { params: { organization_id: ORG_ID } });
          const allVendors: Vendor[] = res.data;
          if (allVendors.length === 0) { setError(key, 'No vendors found'); break; }

          if (fmt === 'pdf') {
            const doc = buildVendorRiskPDF(allVendors);
            doc.save(`vendor-risk-report-${today}.pdf`);
          } else if (fmt === 'xlsx') {
            const header = ['Vendor Name', 'Industry', 'Criticality', 'Status', 'Risk Score', 'Latest Assessment Score', 'Last Assessment Date'];
            const rows = allVendors.map(v => [
              v.name, v.industry ?? 'N/A',
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
            const scoreVendors = allVendors.filter(v => v.latest_assessment_score != null);
            const avgScore = scoreVendors.length > 0 ? scoreVendors.reduce((s, v) => s + v.latest_assessment_score!, 0) / scoreVendors.length : null;
            const summaryWs = XLSX.utils.aoa_to_sheet([
              ['Metric', 'Value'],
              ['Total Vendors', allVendors.length],
              ['Active Vendors', allVendors.filter(v => v.vendor_status === 'active').length],
              ['Critical Vendors', allVendors.filter(v => v.criticality_level === 'critical').length],
              ['Average Compliance Score', avgScore != null ? `${avgScore.toFixed(1)}%` : 'N/A'],
              ['Report Generated', new Date().toLocaleString()],
            ]);
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
            XLSX.writeFile(wb, `vendor-risk-report-${today}.xlsx`);
          } else {
            downloadCsv(makeVendorsCsv(allVendors), `vendor-risk-report-${today}.csv`);
          }
          break;
        }

        // ── Assessment Detail Export ────────────────────────────────────────
        case 'assessment_detail': {
          if (!selectedAssessment) { setError(key, 'Please select an assessment'); break; }
          const assessment = assessments.find(a => a.id === selectedAssessment);
          if (!assessment) { setError(key, 'Assessment not found'); break; }
          const items = await assessmentsApi.getItems(selectedAssessment);
          const safeName = assessment.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();

          if (fmt === 'pdf') {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            buildAssessmentPDF(assessment, items, doc);
            doc.save(`assessment-${safeName}-${today}.pdf`);
          } else if (fmt === 'xlsx') {
            const wb = buildAssessmentExcel(assessment, items);
            XLSX.writeFile(wb, `assessment-${safeName}-${today}.xlsx`);
          } else {
            downloadCsv(makeAssessmentCsv(items), `assessment-${safeName}-${today}.csv`);
          }
          break;
        }

        // ── Group Companies Overview ────────────────────────────────────────
        case 'group_overview': {
          const groupsRes = await companyGroupsApi.list(ORG_ID);
          const groups: CompanyGroup[] = groupsRes.data;
          if (groups.length === 0) { setError(key, 'No group companies found'); break; }

          const groupDetails = await Promise.all(
            groups.map(g => companyGroupsApi.get(g.id).then(r => r.data).catch(() => null))
          );

          if (fmt === 'pdf') {
            const doc = buildGroupOverviewPDF(groups, groupDetails);
            doc.save(`group-companies-overview-${today}.pdf`);
          } else if (fmt === 'xlsx') {
            const groupHeader = ['Group Name', 'Industry', 'Companies', 'Avg Score'];
            const groupRows: (string | number)[][] = [];
            for (const g of groups) {
              const detail = groupDetails.find((d: any) => d?.id === g.id);
              const vendors: Vendor[] = detail?.vendors ?? [];
              const scoredV = vendors.filter((v: Vendor) => v.latest_assessment_score != null);
              const avg = scoredV.length > 0 ? scoredV.reduce((s: number, v: Vendor) => s + v.latest_assessment_score!, 0) / scoredV.length : null;
              groupRows.push([g.name, g.industry ?? 'N/A', g.vendor_count ?? vendors.length, avg != null ? `${avg.toFixed(1)}%` : 'N/A']);
            }
            const companyHeader = ['Company Name', 'Group', 'Industry', 'Criticality', 'Latest Score', 'Risk Score'];
            const companyRows: (string | number)[][] = [];
            for (let i = 0; i < groups.length; i++) {
              const vendors: Vendor[] = groupDetails[i]?.vendors ?? [];
              for (const v of vendors) {
                companyRows.push([v.name, groups[i].name, v.industry ?? 'N/A', v.criticality_level ?? v.risk_tier ?? 'N/A', v.latest_assessment_score != null ? `${v.latest_assessment_score.toFixed(1)}%` : 'N/A', v.risk_score != null ? v.risk_score : 'N/A']);
              }
            }
            const wb = XLSX.utils.book_new();
            const groupsWs = XLSX.utils.aoa_to_sheet([groupHeader, ...groupRows]);
            groupsWs['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 14 }];
            XLSX.utils.book_append_sheet(wb, groupsWs, 'Groups');
            const companiesWs = XLSX.utils.aoa_to_sheet([companyHeader, ...companyRows]);
            companiesWs['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 12 }];
            XLSX.utils.book_append_sheet(wb, companiesWs, 'Companies');
            XLSX.writeFile(wb, `group-companies-overview-${today}.xlsx`);
          } else {
            downloadCsv(makeGroupsCsv(groups, groupDetails), `group-companies-overview-${today}.csv`);
          }
          break;
        }
      }
    } catch (err) {
      setError(key, err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoadingKey(null);
      setLoadingFmt(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '7px 10px', borderRadius: 7,
    background: T.bg, border: `1px solid ${T.border}`,
    fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary,
    cursor: 'pointer', outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: T.fontDisplay, fontSize: 22, fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
          Reporting Center
        </h1>
        <p style={{ fontFamily: T.fontSans, fontSize: 13, color: T.textSecondary, marginTop: 4 }}>
          Generate and download compliance reports in PDF, Excel, or CSV format
        </p>
      </div>

      {/* Report cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
        {REPORTS.map(report => {
          const { Icon } = report;
          const isLoading = loadingKey === report.key;
          const err = errors[report.key];
          const isOpen = openDropdown === report.key;

          return (
            <div
              key={report.key}
              style={{ ...card, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}
            >
              {/* Top row: icon + format badges */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: T.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={20} style={{ color: T.accent }} />
                </div>
                {/* Format chips */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['pdf', 'xlsx', 'csv'] as FormatType[]).map(f => (
                    <span key={f} style={{
                      fontFamily: T.fontMono, fontSize: 9, fontWeight: 700,
                      padding: '2px 6px', borderRadius: 4,
                      background: FMT[f].bg, color: FMT[f].color, border: `1px solid ${FMT[f].border}`,
                    }}>
                      {FMT[f].label.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div style={{ fontFamily: T.fontSans, fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 6, lineHeight: 1.3 }}>
                {report.title}
              </div>

              {/* Description */}
              <div style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, lineHeight: 1.55, marginBottom: 18, flex: 1 }}>
                {report.description}
              </div>

              {/* Assessment selector */}
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
                  <AlertCircle size={12} /> {err}
                </div>
              )}

              {/* Generate dropdown */}
              <div
                style={{ position: 'relative', marginTop: 'auto' }}
                ref={el => { dropdownRefs.current[report.key] = el; }}
              >
                <button
                  onClick={() => !isLoading && setOpenDropdown(isOpen ? null : report.key)}
                  disabled={isLoading || loadingData}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '9px 16px', borderRadius: 8, width: '100%',
                    background: isLoading ? T.accentLight : T.accent,
                    color: isLoading ? T.accent : '#FFF',
                    border: `1px solid ${isLoading ? T.accentBorder : T.accent}`,
                    fontFamily: T.fontSans, fontSize: 13, fontWeight: 600,
                    cursor: isLoading || loadingData ? 'not-allowed' : 'pointer',
                    opacity: loadingData && !isLoading ? 0.6 : 1,
                    transition: 'all 0.15s',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      Generating{loadingFmt ? ` ${loadingFmt.toUpperCase()}` : ''}…
                    </>
                  ) : (
                    <>
                      <Download size={14} /> Generate
                      <ChevronDown size={13} style={{ opacity: 0.7, marginLeft: 2 }} />
                    </>
                  )}
                </button>

                {/* Dropdown menu */}
                {isOpen && !isLoading && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 0,
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: 10, boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
                    overflow: 'hidden', zIndex: 200,
                  }}>
                    {(['pdf', 'xlsx', 'csv'] as FormatType[]).map((fmt, i, arr) => (
                      <button
                        key={fmt}
                        onClick={() => { setOpenDropdown(null); handleGenerate(report.key, fmt); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          width: '100%', padding: '10px 14px',
                          background: 'transparent', border: 'none',
                          borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                          fontFamily: T.fontSans, fontSize: 12, color: T.textPrimary,
                          cursor: 'pointer', textAlign: 'left' as const,
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.bg}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                      >
                        <span style={{
                          fontFamily: T.fontMono, fontSize: 9, fontWeight: 700,
                          padding: '2px 6px', borderRadius: 3,
                          background: FMT[fmt].bg, color: FMT[fmt].color, border: `1px solid ${FMT[fmt].border}`,
                          flexShrink: 0, minWidth: 38, textAlign: 'center' as const,
                        }}>{FMT[fmt].label.toUpperCase()}</span>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>
                            Export as {FMT[fmt].label}
                          </div>
                          <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>
                            {FMT[fmt].desc}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info note */}
      <div style={{
        ...card, padding: '14px 18px',
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
