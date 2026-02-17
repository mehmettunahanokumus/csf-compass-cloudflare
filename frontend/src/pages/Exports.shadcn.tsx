import { FileDown, FileText, FileSpreadsheet, GitCompare, Award, BarChart } from 'lucide-react';

const exportTypes = [
  {
    icon: FileText,
    title: 'Assessment Reports (PDF)',
    description: 'Comprehensive PDF reports with executive summary, compliance breakdown, gap analysis, and remediation roadmap',
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/10 border-red-500/15',
    formats: ['PDF'],
  },
  {
    icon: FileSpreadsheet,
    title: 'Assessment Data (Excel)',
    description: 'Detailed Excel workbooks with raw assessment data, scores by category, and evidence tracking for analysis',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/15',
    formats: ['Excel', 'CSV'],
  },
  {
    icon: GitCompare,
    title: 'Comparison Reports',
    description: 'Side-by-side comparison of organization vs vendor assessments with gap highlights and variance analysis',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/15',
    formats: ['PDF', 'Excel'],
  },
  {
    icon: Award,
    title: 'Vendor Scorecards',
    description: 'Professional vendor risk scorecards with compliance ratings, risk tier, assessment history, and trend charts',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/15',
    formats: ['PDF'],
  },
  {
    icon: BarChart,
    title: 'Executive Dashboards',
    description: 'High-level compliance dashboards for board presentations with KPIs, maturity levels, and strategic recommendations',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/15',
    formats: ['PDF', 'PowerPoint'],
  },
  {
    icon: FileSpreadsheet,
    title: 'Audit Evidence Packages',
    description: 'Complete audit-ready packages with all assessment items, evidence files, and compliance documentation',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/15',
    formats: ['ZIP', 'PDF'],
  },
];

export default function Exports() {
  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Exports</h1>
        <p className="font-sans text-sm text-[#8E8FA8] mt-1">
          Export assessments, reports, and vendor scorecards
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="relative bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-l-xl" />
        <div className="flex items-start gap-4 pl-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FileDown className="w-[18px] h-[18px] text-amber-500/70" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-[#F0F0F5]">Export Functionality Coming Soon</p>
            <p className="font-sans text-sm text-[#8E8FA8] mt-1 leading-relaxed">
              Generate professional reports and export assessment data in multiple formats for compliance documentation,
              stakeholder presentations, and audit requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Export Types Grid */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
          <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
            Export Formats
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div
                key={type.title}
                className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 hover:border-amber-500/20 transition-all group"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border ${type.iconBg} mb-4`}>
                  <Icon className={`w-5 h-5 ${type.iconColor}`} />
                </div>
                <h3 className="font-display text-sm font-semibold text-[#F0F0F5] mb-2">{type.title}</h3>
                <p className="font-sans text-xs text-[#8E8FA8] leading-relaxed mb-4">{type.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {type.formats.map((format) => (
                    <span
                      key={format}
                      className="font-mono text-[10px] text-[#8E8FA8] bg-white/[0.05] border border-white/[0.06] px-2 py-0.5 rounded"
                    >
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customization Options */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Customization Options
            </h2>
          </div>
          <ul className="space-y-3">
            {[
              'Add company logo and branding to all exports',
              'Select specific CSF functions, categories, or subcategories',
              'Include or exclude evidence files and supporting documentation',
              'Choose date ranges and historical comparison periods',
              'Add custom executive summary and contextual notes',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 font-sans text-sm text-[#8E8FA8]">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Automated Exports */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Automated Exports
            </h2>
          </div>
          <ul className="space-y-3">
            {[
              'Schedule recurring exports (daily, weekly, monthly, quarterly)',
              'Email reports directly to stakeholders and auditors',
              'Save export templates for consistent reporting',
              'Bulk export multiple assessments at once',
              'Archive exports with version control and audit trails',
            ].map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 font-sans text-sm text-[#8E8FA8]">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-1.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Compliance Note */}
      <div className="relative bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-emerald-500 rounded-l-xl" />
        <div className="pl-3">
          <p className="font-display text-sm font-semibold text-emerald-400">Compliance-Ready Exports</p>
          <p className="font-sans text-sm text-[#8E8FA8] mt-1 leading-relaxed">
            All exports are designed to meet regulatory requirements and audit standards, including SOC 2, ISO 27001,
            HIPAA, and FedRAMP. Reports include timestamps, digital signatures, and complete audit trails.
          </p>
        </div>
      </div>
    </div>
  );
}
