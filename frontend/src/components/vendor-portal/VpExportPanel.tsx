/**
 * VpExportPanel - Export panel for vendor portal (PDF, Excel, CSV)
 * Client-side generation using jspdf and xlsx
 */

import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { T, card } from '../../tokens';
import { vendorInvitationsApi } from '../../api/vendor-invitations';
import type { VendorPortalExportData } from '../../types';

interface VpExportPanelProps {
  token: string;
}

type ExportFormat = 'pdf' | 'excel' | 'csv';

const VpExportPanel: React.FC<VpExportPanelProps> = ({ token }) => {
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (): Promise<VendorPortalExportData> => {
    return await vendorInvitationsApi.getExportData(token);
  };

  const handleExportPdf = async () => {
    setLoading('pdf');
    setError(null);
    try {
      const data = await fetchData();
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const score = data.stats.overall_score ?? 0;
      const dist = data.stats.distribution;
      const totalItems = dist.compliant + dist.partial + dist.non_compliant + dist.not_assessed + dist.not_applicable;

      // ── Header bar ──────────────────────────────────────────────────────
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, W, 32, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('NIST CSF 2.0 Assessment Report', 15, 14);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${data.assessment_name}  |  ${data.vendor_name}  |  ${today}`, 15, 24);

      // ── Executive Summary box ───────────────────────────────────────────
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 38, W - 30, 46, 3, 3, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(15, 38, W - 30, 46, 3, 3, 'S');

      // Large score
      const sR = score >= 80 ? 22 : score >= 50 ? 217 : 239;
      const sG = score >= 80 ? 163 : score >= 50 ? 119 : 68;
      const sB = score >= 80 ? 74 : score >= 50 ? 6 : 68;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(36);
      doc.setTextColor(sR, sG, sB);
      doc.text(`${score.toFixed(1)}%`, 25, 62);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Overall Compliance Score', 25, 69);
      doc.setFontSize(8);
      doc.text(`${totalItems} items assessed`, 25, 76);

      // Status distribution badges (right side of summary box)
      const badges = [
        { label: 'Compliant',     value: dist.compliant,      r: 22,  g: 163, b: 74  },
        { label: 'Partial',       value: dist.partial,        r: 217, g: 119, b: 6   },
        { label: 'Non-Compliant', value: dist.non_compliant,  r: 239, g: 68,  b: 68  },
        { label: 'Not Assessed',  value: dist.not_assessed,   r: 100, g: 116, b: 139 },
        { label: 'N/A',           value: dist.not_applicable, r: 148, g: 163, b: 184 },
      ];
      const badgeStartX = 95;
      const badgeW = (W - 30 - badgeStartX + 15) / badges.length;
      badges.forEach((b, i) => {
        const bx = badgeStartX + i * badgeW;
        doc.setFillColor(b.r, b.g, b.b);
        doc.roundedRect(bx, 46, badgeW - 3, 18, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(String(b.value), bx + (badgeW - 3) / 2, 55, { align: 'center' });
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'normal');
        doc.text(b.label, bx + (badgeW - 3) / 2, 61, { align: 'center' });
      });

      // ── CSF Function Breakdown table ────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('CSF Function Breakdown', 15, 96);

      autoTable(doc, {
        startY: 100,
        head: [['Function', 'Score %', 'Compliant', 'Partial', 'Non-Compliant', 'Not Assessed']],
        body: data.stats.function_breakdown.map(fn => [
          fn.function_name,
          `${fn.score.toFixed(1)}%`,
          fn.compliant,
          fn.partial,
          fn.non_compliant,
          fn.not_assessed,
        ]),
        styles: { fontSize: 9, font: 'helvetica', cellPadding: 4 },
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          1: { halign: 'center', fontStyle: 'bold' },
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
        },
        didParseCell: (hookData: any) => {
          // Color-code score column
          if (hookData.section === 'body' && hookData.column.index === 1) {
            const val = parseFloat(hookData.cell.raw as string);
            if (val >= 80) hookData.cell.styles.textColor = [22, 163, 74];
            else if (val >= 50) hookData.cell.styles.textColor = [217, 119, 6];
            else hookData.cell.styles.textColor = [239, 68, 68];
          }
        },
      });

      // ── Key Findings section ────────────────────────────────────────────
      const findings = data.items
        .filter(i => i.status === 'non_compliant' || i.status === 'partial')
        .slice(0, 20);

      if (findings.length > 0) {
        const afterFn = (doc as any).lastAutoTable?.finalY ?? 180;
        if (afterFn > H - 60) doc.addPage();
        const fY = afterFn > H - 60 ? 20 : afterFn + 14;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text(`Areas Requiring Attention (${findings.length})`, 15, fY);

        autoTable(doc, {
          startY: fY + 4,
          head: [['Control ID', 'Control Name', 'Status', 'Notes']],
          body: findings.map(f => [
            f.subcategory_id,
            f.subcategory_name || '',
            f.status === 'non_compliant' ? 'Non-Compliant' : 'Partial',
            (f.notes ?? '').slice(0, 80) || '-',
          ]),
          styles: { fontSize: 8, font: 'helvetica', cellPadding: 3, overflow: 'linebreak' },
          headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          alternateRowStyles: { fillColor: [255, 250, 250] },
          columnStyles: { 3: { cellWidth: 65 } },
        });
      }

      // ── Footer on all pages ─────────────────────────────────────────────
      const pageCount = doc.getNumberOfPages();
      for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated by CSF Compass  |  ${today}`, 15, H - 8);
        doc.text(`Page ${p} of ${pageCount}`, W - 15, H - 8, { align: 'right' });
      }

      doc.save(`${data.assessment_name.replace(/\s+/g, '_')}_report.pdf`);
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
      console.error('PDF export error:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleExportExcel = async () => {
    setLoading('excel');
    setError(null);
    try {
      const data = await fetchData();
      const XLSX = await import('xlsx');

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryRows = [
        ['NIST CSF 2.0 Assessment Report'],
        [''],
        ['Assessment', data.assessment_name],
        ['Vendor', data.vendor_name],
        ['Date', new Date().toLocaleDateString('en-US')],
        ['Overall Score', `${data.stats.overall_score}%`],
        [''],
        ['Status Distribution'],
        ['Compliant', data.stats.distribution.compliant],
        ['Partial', data.stats.distribution.partial],
        ['Non-Compliant', data.stats.distribution.non_compliant],
        ['Not Assessed', data.stats.distribution.not_assessed],
        ['Not Applicable', data.stats.distribution.not_applicable],
        [''],
        ['Function Breakdown'],
        ['Function', 'Score', 'Total', 'Compliant', 'Partial', 'Non-Compliant', 'Not Assessed'],
        ...data.stats.function_breakdown.map(fn => [
          fn.function_name, `${fn.score}%`, fn.total, fn.compliant, fn.partial, fn.non_compliant, fn.not_assessed,
        ]),
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Items sheet
      const itemHeaders = ['Subcategory ID', 'Subcategory', 'Category', 'Function', 'Status', 'Notes', 'Evidence Count'];
      const itemRows = data.items.map(item => [
        item.subcategory_id,
        item.subcategory_name,
        item.category_name,
        item.function_name,
        item.status.replace('_', ' '),
        item.notes || '',
        item.evidence_count,
      ]);
      const itemsSheet = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows]);
      XLSX.utils.book_append_sheet(wb, itemsSheet, 'Items');

      XLSX.writeFile(wb, `${data.assessment_name.replace(/\s+/g, '_')}_report.xlsx`);
    } catch (err) {
      setError('Failed to generate Excel file. Please try again.');
      console.error('Excel export error:', err);
    } finally {
      setLoading(null);
    }
  };

  const handleExportCsv = async () => {
    setLoading('csv');
    setError(null);
    try {
      const data = await fetchData();

      const headers = ['Subcategory ID', 'Subcategory', 'Category', 'Function', 'Status', 'Notes', 'Evidence Count'];
      const rows = data.items.map(item => [
        item.subcategory_id,
        `"${(item.subcategory_name || '').replace(/"/g, '""')}"`,
        `"${(item.category_name || '').replace(/"/g, '""')}"`,
        `"${(item.function_name || '').replace(/"/g, '""')}"`,
        item.status.replace('_', ' '),
        `"${(item.notes || '').replace(/"/g, '""')}"`,
        String(item.evidence_count),
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.assessment_name.replace(/\s+/g, '_')}_report.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate CSV file. Please try again.');
      console.error('CSV export error:', err);
    } finally {
      setLoading(null);
    }
  };

  const buttonBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 8,
    border: `1px solid ${T.border}`,
    background: T.card,
    color: T.textPrimary,
    fontFamily: T.fontSans,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  };

  const buttonDisabled: React.CSSProperties = {
    opacity: 0.6,
    cursor: 'not-allowed',
  };

  return (
    <div style={{ ...card, padding: 20 }}>
      <h3 style={{ fontFamily: T.fontSans, fontSize: 15, fontWeight: 700, color: T.textPrimary, margin: '0 0 4px 0' }}>
        Export Report
      </h3>
      <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.textSecondary, margin: '0 0 16px 0' }}>
        Download your assessment results in your preferred format.
      </p>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={handleExportPdf}
          disabled={loading !== null}
          style={{ ...buttonBase, ...(loading !== null ? buttonDisabled : {}) }}
        >
          {loading === 'pdf' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={16} style={{ color: T.danger }} />}
          PDF Report
        </button>

        <button
          onClick={handleExportExcel}
          disabled={loading !== null}
          style={{ ...buttonBase, ...(loading !== null ? buttonDisabled : {}) }}
        >
          {loading === 'excel' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileSpreadsheet size={16} style={{ color: T.success }} />}
          Excel Report
        </button>

        <button
          onClick={handleExportCsv}
          disabled={loading !== null}
          style={{ ...buttonBase, ...(loading !== null ? buttonDisabled : {}) }}
        >
          {loading === 'csv' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <FileDown size={16} style={{ color: T.accent }} />}
          CSV Export
        </button>
      </div>

      {error && (
        <p style={{ fontFamily: T.fontSans, fontSize: 12, color: T.danger, marginTop: 12 }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default VpExportPanel;
