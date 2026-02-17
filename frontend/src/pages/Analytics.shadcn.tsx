import { BarChart3, TrendingUp, Activity, AlertCircle, Radar, Map } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

const plannedFeatures = [
  {
    icon: Radar,
    title: 'CSF Function Radar Chart',
    description: 'Visualize maturity across all 6 NIST CSF 2.0 functions (Govern, Identify, Protect, Detect, Respond, Recover)',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    icon: TrendingUp,
    title: 'Score Trends Over Time',
    description: 'Track compliance scores, vendor risk levels, and assessment completion rates with historical trend analysis',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    icon: Map,
    title: 'Risk Heatmap',
    description: 'Interactive heatmap showing risk distribution across vendors, categories, and subcategories',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    icon: AlertCircle,
    title: 'Top Gaps & Recommendations',
    description: 'Prioritized list of compliance gaps with AI-powered remediation suggestions and effort estimates',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  {
    icon: Activity,
    title: 'Benchmark Comparisons',
    description: 'Compare your organization against industry benchmarks and peer groups by sector and size',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: BarChart3,
    title: 'Executive Dashboard',
    description: 'High-level KPIs and metrics for leadership reporting, including compliance readiness and vendor risk exposure',
    badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
];

export default function Analytics() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Advanced insights, trends, and risk visualization
        </p>
      </div>

      {/* Coming Soon Banner */}
      <Alert className="border-l-4 border-l-primary">
        <BarChart3 className="h-4 w-4" />
        <AlertDescription>
          <span className="font-semibold">Analytics Dashboard Coming Soon</span>
          <p className="mt-1 text-sm text-muted-foreground">
            We're building a comprehensive analytics suite to help you visualize compliance data,
            identify trends, and make data-driven security decisions.
          </p>
        </AlertDescription>
      </Alert>

      {/* Planned Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plannedFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center p-3 rounded-lg ${feature.iconBg} mb-4`}>
                  <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* What to Expect */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What to Expect</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {[
              'Real-time data visualization with interactive charts and graphs',
              'Customizable date ranges and filters for deep-dive analysis',
              'Export charts and reports in multiple formats (PNG, PDF, CSV)',
              'Scheduled automated reports delivered to your inbox',
              'AI-powered insights and anomaly detection',
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
  );
}
