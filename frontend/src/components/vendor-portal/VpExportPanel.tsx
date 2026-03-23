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
      const doc = new jsPDF();

      // Title
      doc.setFontSize(18);
      doc.text('NIST CSF 2.0 Assessment Report', 14, 20);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Assessment: ${data.assessment_name}`, 14, 30);
      doc.text(`Vendor: ${data.vendor_name}`, 14, 37);
      doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 14, 44);

      // Score summary
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Score Summary', 14, 58);

      doc.setFontSize(11);
      doc.text(`Overall Score: ${data.stats.overall_score}%`, 14, 66);
      const dist = data.stats.distribution;
      doc.text(`Compliant: ${dist.compliant} | Partial: ${dist.partial} | Non-Compliant: ${dist.non_compliant} | Not Assessed: ${dist.not_assessed} | N/A: ${dist.not_applicable}`, 14, 73);

      // Function breakdown
      let y = 86;
      doc.setFontSize(14);
      doc.text('Score by Function', 14, y);
      y += 8;
      doc.setFontSize(10);

      for (const fn of data.stats.function_breakdown) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(`${fn.function_name}: ${fn.score}% (${fn.compliant}/${fn.total} compliant)`, 14, y);
        y += 7;
      }

      // Items table
      y += 6;
      if (y > 240) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.text('Assessment Items', 14, y);
      y += 10;
      doc.setFontSize(8);

      // Table header
      doc.setFont('helvetica', 'bold');
      doc.text('Subcategory', 14, y);
      doc.text('Function', 80, y);
      doc.text('Status', 130, y);
      doc.text('Evidence', 170, y);
      doc.setFont('helvetica', 'normal');
      y += 6;

      for (const item of data.items) {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        const subcatLabel = item.subcategory_id.length > 30
          ? item.subcategory_id.substring(0, 27) + '...'
          : item.subcategory_id;
        doc.text(subcatLabel, 14, y);
        doc.text(item.function_name.substring(0, 25), 80, y);
        doc.text(item.status.replace('_', ' '), 130, y);
        doc.text(String(item.evidence_count), 170, y);
        y += 5;
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
