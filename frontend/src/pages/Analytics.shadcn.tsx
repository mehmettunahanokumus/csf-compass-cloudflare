import { BarChart3, TrendingUp, Activity, AlertCircle, Radar, Map } from 'lucide-react';

const plannedFeatures = [
  {
    icon: Radar,
    title: 'CSF Function Radar Chart',
    description: 'Visualize maturity across all 6 NIST CSF 2.0 functions (Govern, Identify, Protect, Detect, Respond, Recover)',
    accentColor: 'bg-blue-500',
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/15',
  },
  {
    icon: TrendingUp,
    title: 'Score Trends Over Time',
    description: 'Track compliance scores, vendor risk levels, and assessment completion rates with historical trend analysis',
    accentColor: 'bg-emerald-500',
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10 border-emerald-500/15',
  },
  {
    icon: Map,
    title: 'Risk Heatmap',
    description: 'Interactive heatmap showing risk distribution across vendors, categories, and subcategories',
    accentColor: 'bg-amber-500',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-500/15',
  },
  {
    icon: AlertCircle,
    title: 'Top Gaps & Recommendations',
    description: 'Prioritized list of compliance gaps with AI-powered remediation suggestions and effort estimates',
    accentColor: 'bg-red-500',
    iconColor: 'text-red-400',
    iconBg: 'bg-red-500/10 border-red-500/15',
  },
  {
    icon: Activity,
    title: 'Benchmark Comparisons',
    description: 'Compare your organization against industry benchmarks and peer groups by sector and size',
    accentColor: 'bg-purple-500',
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/15',
  },
  {
    icon: BarChart3,
    title: 'Executive Dashboard',
    description: 'High-level KPIs and metrics for leadership reporting, including compliance readiness and vendor risk exposure',
    accentColor: 'bg-sky-500',
    iconColor: 'text-sky-400',
    iconBg: 'bg-sky-500/10 border-sky-500/15',
  },
];

export default function Analytics() {
  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Analytics</h1>
        <p className="font-sans text-sm text-[#8E8FA8] mt-1">
          Advanced insights, trends, and risk visualization
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="relative bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500 rounded-l-xl" />
        <div className="flex items-start gap-4 pl-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BarChart3 className="w-[18px] h-[18px] text-amber-500/70" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-[#F0F0F5]">Analytics Dashboard Coming Soon</p>
            <p className="font-sans text-sm text-[#8E8FA8] mt-1 leading-relaxed">
              We're building a comprehensive analytics suite to help you visualize compliance data,
              identify trends, and make data-driven security decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Planned Features Grid */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
          <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
            Planned Features
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plannedFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 hover:border-amber-500/20 transition-all group"
              >
                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border ${feature.iconBg} mb-4`}>
                  <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>
                <h3 className="font-display text-sm font-semibold text-[#F0F0F5] mb-2">{feature.title}</h3>
                <p className="font-sans text-xs text-[#8E8FA8] leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* What to Expect */}
      <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
          <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
            What to Expect
          </h2>
        </div>
        <ul className="space-y-3">
          {[
            'Real-time data visualization with interactive charts and graphs',
            'Customizable date ranges and filters for deep-dive analysis',
            'Export charts and reports in multiple formats (PNG, PDF, CSV)',
            'Scheduled automated reports delivered to your inbox',
            'AI-powered insights and anomaly detection',
          ].map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 font-sans text-sm text-[#8E8FA8]">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/60 mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
