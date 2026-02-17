import { FileDown, FileText, FileSpreadsheet, GitCompare, Award, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';

const exportTypes = [
  {
    icon: FileText,
    title: 'Assessment Reports (PDF)',
    description: 'Comprehensive PDF reports with executive summary, compliance breakdown, gap analysis, and remediation roadmap',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    formats: ['PDF'],
  },
  {
    icon: FileSpreadsheet,
    title: 'Assessment Data (Excel)',
    description: 'Detailed Excel workbooks with raw assessment data, scores by category, and evidence tracking for analysis',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    formats: ['Excel', 'CSV'],
  },
  {
    icon: GitCompare,
    title: 'Comparison Reports',
    description: 'Side-by-side comparison of organization vs vendor assessments with gap highlights and variance analysis',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    formats: ['PDF', 'Excel'],
  },
  {
    icon: Award,
    title: 'Vendor Scorecards',
    description: 'Professional vendor risk scorecards with compliance ratings, risk tier, assessment history, and trend charts',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    formats: ['PDF'],
  },
  {
    icon: BarChart,
    title: 'Executive Dashboards',
    description: 'High-level compliance dashboards for board presentations with KPIs, maturity levels, and strategic recommendations',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    formats: ['PDF', 'PowerPoint'],
  },
  {
    icon: FileSpreadsheet,
    title: 'Audit Evidence Packages',
    description: 'Complete audit-ready packages with all assessment items, evidence files, and compliance documentation',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    formats: ['ZIP', 'PDF'],
  },
];

export default function Exports() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Exports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Export assessments, reports, and vendor scorecards
        </p>
      </div>

      {/* Coming Soon Banner */}
      <Alert className="border-l-4 border-l-primary">
        <FileDown className="h-4 w-4" />
        <AlertDescription>
          <span className="font-semibold">Export Functionality Coming Soon</span>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate professional reports and export assessment data in multiple formats for compliance documentation,
            stakeholder presentations, and audit requirements.
          </p>
        </AlertDescription>
      </Alert>

      {/* Export Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exportTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card key={type.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center p-3 rounded-lg ${type.iconBg} mb-4`}>
                  <Icon className={`h-6 w-6 ${type.iconColor}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{type.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{type.description}</p>
                <div className="flex flex-wrap gap-2">
                  {type.formats.map((format) => (
                    <Badge key={format} variant="secondary" className="text-xs font-medium">
                      {format}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customization Options</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {[
                'Add company logo and branding to all exports',
                'Select specific CSF functions, categories, or subcategories',
                'Include or exclude evidence files and supporting documentation',
                'Choose date ranges and historical comparison periods',
                'Add custom executive summary and contextual notes',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Automated Exports</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {[
                'Schedule recurring exports (daily, weekly, monthly, quarterly)',
                'Email reports directly to stakeholders and auditors',
                'Save export templates for consistent reporting',
                'Bulk export multiple assessments at once',
                'Archive exports with version control and audit trails',
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Note */}
      <Alert className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-900/10">
        <AlertDescription className="text-green-800 dark:text-green-300">
          <span className="font-semibold">Compliance-Ready Exports</span>
          <p className="mt-1 text-sm">
            All exports are designed to meet regulatory requirements and audit standards, including SOC 2, ISO 27001,
            HIPAA, and FedRAMP. Reports include timestamps, digital signatures, and complete audit trails.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
