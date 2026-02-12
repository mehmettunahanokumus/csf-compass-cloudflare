/**
 * Exports Page (Placeholder)
 * Future: PDF/Excel exports, comparison reports, vendor scorecards
 */

import { FileDown, FileText, FileSpreadsheet, GitCompare, Award, BarChart } from 'lucide-react';

export default function Exports() {
  const exportTypes = [
    {
      icon: FileText,
      title: 'Assessment Reports (PDF)',
      description: 'Comprehensive PDF reports with executive summary, compliance breakdown, gap analysis, and remediation roadmap',
      color: 'bg-red-100 text-red-700',
      formats: ['PDF'],
    },
    {
      icon: FileSpreadsheet,
      title: 'Assessment Data (Excel)',
      description: 'Detailed Excel workbooks with raw assessment data, scores by category, and evidence tracking for analysis',
      color: 'bg-green-100 text-green-700',
      formats: ['Excel', 'CSV'],
    },
    {
      icon: GitCompare,
      title: 'Comparison Reports',
      description: 'Side-by-side comparison of organization vs vendor assessments with gap highlights and variance analysis',
      color: 'bg-blue-100 text-blue-700',
      formats: ['PDF', 'Excel'],
    },
    {
      icon: Award,
      title: 'Vendor Scorecards',
      description: 'Professional vendor risk scorecards with compliance ratings, risk tier, assessment history, and trend charts',
      color: 'bg-purple-100 text-purple-700',
      formats: ['PDF'],
    },
    {
      icon: BarChart,
      title: 'Executive Dashboards',
      description: 'High-level compliance dashboards for board presentations with KPIs, maturity levels, and strategic recommendations',
      color: 'bg-amber-100 text-amber-700',
      formats: ['PDF', 'PowerPoint'],
    },
    {
      icon: FileSpreadsheet,
      title: 'Audit Evidence Packages',
      description: 'Complete audit-ready packages with all assessment items, evidence files, and compliance documentation',
      color: 'bg-indigo-100 text-indigo-700',
      formats: ['ZIP', 'PDF'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Exports</h1>
        <p className="text-text-secondary mt-1">
          Export assessments, reports, and vendor scorecards
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="card border-l-4 border-accent">
        <div className="card-body">
          <div className="flex items-start space-x-4">
            <div className="bg-accent/10 p-3 rounded-full flex-shrink-0">
              <FileDown className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Export Functionality Coming Soon
              </h3>
              <p className="text-sm text-text-secondary">
                Generate professional reports and export assessment data in multiple formats for compliance documentation,
                stakeholder presentations, and audit requirements. All exports maintain NIST CSF 2.0 framework integrity.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportTypes.map((exportType) => {
          const Icon = exportType.icon;
          return (
            <div key={exportType.title} className="card hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className={`${exportType.color} p-3 rounded-lg w-fit mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{exportType.title}</h3>
                <p className="text-sm text-text-secondary mb-4">{exportType.description}</p>
                <div className="flex flex-wrap gap-2">
                  {exportType.formats.map((format) => (
                    <span
                      key={format}
                      className="px-2 py-1 bg-surface border border-border rounded text-xs font-medium text-text-secondary"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customization Options */}
        <div className="card bg-surface">
          <div className="card-body">
            <h3 className="font-semibold text-text-primary mb-3">Customization Options</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start space-x-2">
                <span className="text-accent mt-1">•</span>
                <span>Add company logo and branding to all exports</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-accent mt-1">•</span>
                <span>Select specific CSF functions, categories, or subcategories</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-accent mt-1">•</span>
                <span>Include or exclude evidence files and supporting documentation</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-accent mt-1">•</span>
                <span>Choose date ranges and historical comparison periods</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-accent mt-1">•</span>
                <span>Add custom executive summary and contextual notes</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Automated Exports */}
        <div className="card bg-surface">
          <div className="card-body">
            <h3 className="font-semibold text-text-primary mb-3">Automated Exports</h3>
            <ul className="space-y-2 text-sm text-text-secondary">
              <li className="flex items-start space-x-2">
                <span className="text-accent mt-1">•</span>
                <span>Schedule recurring exports (daily, weekly, monthly, quarterly)</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-accent mt-1">•</span>
                <span>Email reports directly to stakeholders and auditors</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-accent mt-1">•</span>
                <span>Save export templates for consistent reporting</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-accent mt-1">•</span>
                <span>Bulk export multiple assessments at once</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-accent mt-1">•</span>
                <span>Archive exports with version control and audit trails</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Compliance Note */}
      <div className="card border-l-4 border-green-500 bg-green-50">
        <div className="card-body">
          <h3 className="font-semibold text-green-800 mb-2">Compliance-Ready Exports</h3>
          <p className="text-sm text-green-700">
            All exports are designed to meet regulatory requirements and audit standards, including SOC 2, ISO 27001,
            HIPAA, and FedRAMP. Reports include timestamps, digital signatures, and complete audit trails.
          </p>
        </div>
      </div>
    </div>
  );
}
