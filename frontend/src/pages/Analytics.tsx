/**
 * Analytics Page (Placeholder)
 * Future: Radar charts, score trends, risk heatmaps, and gap analysis
 */

import { BarChart3, TrendingUp, Activity, AlertCircle, Radar, Map } from 'lucide-react';

export default function Analytics() {
  const plannedFeatures = [
    {
      icon: Radar,
      title: 'CSF Function Radar Chart',
      description: 'Visualize maturity across all 6 NIST CSF 2.0 functions (Govern, Identify, Protect, Detect, Respond, Recover)',
      color: 'bg-secondary/10 text-secondary',
    },
    {
      icon: TrendingUp,
      title: 'Score Trends Over Time',
      description: 'Track compliance scores, vendor risk levels, and assessment completion rates with historical trend analysis',
      color: 'bg-green-100 text-green-700',
    },
    {
      icon: Map,
      title: 'Risk Heatmap',
      description: 'Interactive heatmap showing risk distribution across vendors, categories, and subcategories',
      color: 'bg-amber-100 text-amber-700',
    },
    {
      icon: AlertCircle,
      title: 'Top Gaps & Recommendations',
      description: 'Prioritized list of compliance gaps with AI-powered remediation suggestions and effort estimates',
      color: 'bg-red-100 text-red-700',
    },
    {
      icon: Activity,
      title: 'Benchmark Comparisons',
      description: 'Compare your organization against industry benchmarks and peer groups by sector and size',
      color: 'bg-purple-100 text-purple-700',
    },
    {
      icon: BarChart3,
      title: 'Executive Dashboard',
      description: 'High-level KPIs and metrics for leadership reporting, including compliance readiness and vendor risk exposure',
      color: 'bg-blue-100 text-blue-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Analytics</h1>
        <p className="text-text-secondary mt-1">
          Advanced insights, trends, and risk visualization
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="card border-l-4 border-secondary">
        <div className="card-body">
          <div className="flex items-start space-x-4">
            <div className="bg-secondary/10 p-3 rounded-full flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                Analytics Dashboard Coming Soon
              </h3>
              <p className="text-sm text-text-secondary">
                We're building a comprehensive analytics suite to help you visualize compliance data,
                identify trends, and make data-driven security decisions. Below is a preview of planned features.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Planned Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plannedFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <div key={feature.title} className="card hover:shadow-md transition-shadow">
              <div className="card-body">
                <div className={`${feature.color} p-3 rounded-lg w-fit mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
      <div className="card bg-surface">
        <div className="card-body">
          <h3 className="font-semibold text-text-primary mb-3">What to Expect</h3>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start space-x-2">
              <span className="text-secondary mt-1">•</span>
              <span>Real-time data visualization with interactive charts and graphs</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-secondary mt-1">•</span>
              <span>Customizable date ranges and filters for deep-dive analysis</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-secondary mt-1">•</span>
              <span>Export charts and reports in multiple formats (PNG, PDF, CSV)</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-secondary mt-1">•</span>
              <span>Scheduled automated reports delivered to your inbox</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-secondary mt-1">•</span>
              <span>AI-powered insights and anomaly detection</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
