/**
 * Exports Page (Placeholder)
 * Future: PDF/Excel exports, comparison reports, vendor scorecards
 */

import { FileDown, FileText, FileSpreadsheet, GitCompare, Award, BarChart } from 'lucide-react';
import { useState } from 'react';

export default function Exports() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const exportTypes = [
    {
      icon: FileText,
      title: 'Assessment Reports (PDF)',
      description: 'Comprehensive PDF reports with executive summary, compliance breakdown, gap analysis, and remediation roadmap',
      color: 'var(--red-text)',
      bgSubtle: 'var(--red-subtle)',
      formats: ['PDF'],
    },
    {
      icon: FileSpreadsheet,
      title: 'Assessment Data (Excel)',
      description: 'Detailed Excel workbooks with raw assessment data, scores by category, and evidence tracking for analysis',
      color: 'var(--green-text)',
      bgSubtle: 'var(--green-subtle)',
      formats: ['Excel', 'CSV'],
    },
    {
      icon: GitCompare,
      title: 'Comparison Reports',
      description: 'Side-by-side comparison of organization vs vendor assessments with gap highlights and variance analysis',
      color: 'var(--blue-text)',
      bgSubtle: 'var(--blue-subtle)',
      formats: ['PDF', 'Excel'],
    },
    {
      icon: Award,
      title: 'Vendor Scorecards',
      description: 'Professional vendor risk scorecards with compliance ratings, risk tier, assessment history, and trend charts',
      color: 'var(--purple-text)',
      bgSubtle: 'var(--purple-subtle)',
      formats: ['PDF'],
    },
    {
      icon: BarChart,
      title: 'Executive Dashboards',
      description: 'High-level compliance dashboards for board presentations with KPIs, maturity levels, and strategic recommendations',
      color: 'var(--orange-text)',
      bgSubtle: 'var(--orange-subtle)',
      formats: ['PDF', 'PowerPoint'],
    },
    {
      icon: FileSpreadsheet,
      title: 'Audit Evidence Packages',
      description: 'Complete audit-ready packages with all assessment items, evidence files, and compliance documentation',
      color: 'var(--purple-text)',
      bgSubtle: 'var(--purple-subtle)',
      formats: ['ZIP', 'PDF'],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: 'var(--font-ui)',
            color: 'var(--text-1)',
            marginBottom: '4px',
          }}
        >
          Exports
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '14px', fontFamily: 'var(--font-ui)' }}>
          Export assessments, reports, and vendor scorecards
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--accent)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div
            style={{
              background: 'var(--accent-subtle)',
              padding: '12px',
              borderRadius: '50%',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileDown size={24} style={{ color: 'var(--accent)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 600,
                fontFamily: 'var(--font-ui)',
                color: 'var(--text-1)',
                marginBottom: '8px',
              }}
            >
              Export Functionality Coming Soon
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.5' }}>
              Generate professional reports and export assessment data in multiple formats for compliance documentation,
              stakeholder presentations, and audit requirements. All exports maintain NIST CSF 2.0 framework integrity.
            </p>
          </div>
        </div>
      </div>

      {/* Export Types Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            window.innerWidth < 768
              ? '1fr'
              : window.innerWidth < 1024
              ? 'repeat(2, 1fr)'
              : 'repeat(3, 1fr)',
          gap: '24px',
        }}
      >
        {exportTypes.map((exportType) => {
          const Icon = exportType.icon;
          const isHovered = hoveredCard === exportType.title;

          return (
            <div
              key={exportType.title}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                boxShadow: isHovered ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 200ms ease',
                cursor: 'default',
              }}
              onMouseEnter={() => setHoveredCard(exportType.title)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                style={{
                  background: exportType.bgSubtle,
                  color: exportType.color,
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  width: 'fit-content',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={24} />
              </div>
              <h3
                style={{
                  fontWeight: 600,
                  fontFamily: 'var(--font-ui)',
                  color: 'var(--text-1)',
                  marginBottom: '8px',
                  fontSize: '16px',
                }}
              >
                {exportType.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.5', marginBottom: '16px' }}>
                {exportType.description}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {exportType.formats.map((format) => (
                  <span
                    key={format}
                    style={{
                      padding: '4px 8px',
                      background: 'var(--ground)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: 500,
                      fontFamily: 'var(--font-ui)',
                      color: 'var(--text-3)',
                    }}
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(2, 1fr)',
          gap: '24px',
        }}
      >
        {/* Customization Options */}
        <div
          style={{
            background: 'var(--ground)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <h3
            style={{
              fontWeight: 600,
              fontFamily: 'var(--font-ui)',
              color: 'var(--text-1)',
              marginBottom: '12px',
              fontSize: '16px',
            }}
          >
            Customization Options
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Add company logo and branding to all exports',
              'Select specific CSF functions, categories, or subcategories',
              'Include or exclude evidence files and supporting documentation',
              'Choose date ranges and historical comparison periods',
              'Add custom executive summary and contextual notes',
            ].map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.5' }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Automated Exports */}
        <div
          style={{
            background: 'var(--ground)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '24px',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          <h3
            style={{
              fontWeight: 600,
              fontFamily: 'var(--font-ui)',
              color: 'var(--text-1)',
              marginBottom: '12px',
              fontSize: '16px',
            }}
          >
            Automated Exports
          </h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              'Schedule recurring exports (daily, weekly, monthly, quarterly)',
              'Email reports directly to stakeholders and auditors',
              'Save export templates for consistent reporting',
              'Bulk export multiple assessments at once',
              'Archive exports with version control and audit trails',
            ].map((item, idx) => (
              <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ color: 'var(--accent)', marginTop: '2px', flexShrink: 0 }}>•</span>
                <span style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.5' }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Compliance Note */}
      <div
        style={{
          background: 'var(--green-subtle)',
          border: '1px solid var(--border)',
          borderLeft: '4px solid var(--green)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <h3
          style={{
            fontWeight: 600,
            fontFamily: 'var(--font-ui)',
            color: 'var(--green-text)',
            marginBottom: '8px',
            fontSize: '16px',
          }}
        >
          Compliance-Ready Exports
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--green-text)', lineHeight: '1.5' }}>
          All exports are designed to meet regulatory requirements and audit standards, including SOC 2, ISO 27001,
          HIPAA, and FedRAMP. Reports include timestamps, digital signatures, and complete audit trails.
        </p>
      </div>
    </div>
  );
}
