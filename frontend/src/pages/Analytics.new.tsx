/**
 * Analytics Page (Placeholder)
 * Future: Radar charts, score trends, risk heatmaps, and gap analysis
 */

import { BarChart3, TrendingUp, Activity, AlertCircle, Radar, Map } from 'lucide-react';
import { useState } from 'react';

export default function Analytics() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const plannedFeatures = [
    {
      icon: Radar,
      title: 'CSF Function Radar Chart',
      description: 'Visualize maturity across all 6 NIST CSF 2.0 functions (Govern, Identify, Protect, Detect, Respond, Recover)',
      color: 'var(--accent)',
      bgSubtle: 'var(--accent-subtle)',
    },
    {
      icon: TrendingUp,
      title: 'Score Trends Over Time',
      description: 'Track compliance scores, vendor risk levels, and assessment completion rates with historical trend analysis',
      color: 'var(--green-text)',
      bgSubtle: 'var(--green-subtle)',
    },
    {
      icon: Map,
      title: 'Risk Heatmap',
      description: 'Interactive heatmap showing risk distribution across vendors, categories, and subcategories',
      color: 'var(--orange-text)',
      bgSubtle: 'var(--orange-subtle)',
    },
    {
      icon: AlertCircle,
      title: 'Top Gaps & Recommendations',
      description: 'Prioritized list of compliance gaps with AI-powered remediation suggestions and effort estimates',
      color: 'var(--red-text)',
      bgSubtle: 'var(--red-subtle)',
    },
    {
      icon: Activity,
      title: 'Benchmark Comparisons',
      description: 'Compare your organization against industry benchmarks and peer groups by sector and size',
      color: 'var(--purple-text)',
      bgSubtle: 'var(--purple-subtle)',
    },
    {
      icon: BarChart3,
      title: 'Executive Dashboard',
      description: 'High-level KPIs and metrics for leadership reporting, including compliance readiness and vendor risk exposure',
      color: 'var(--blue-text)',
      bgSubtle: 'var(--blue-subtle)',
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
          Analytics
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '14px', fontFamily: 'var(--font-ui)' }}>
          Advanced insights, trends, and risk visualization
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
            <BarChart3 size={24} style={{ color: 'var(--accent)' }} />
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
              Analytics Dashboard Coming Soon
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.5' }}>
              We're building a comprehensive analytics suite to help you visualize compliance data,
              identify trends, and make data-driven security decisions. Below is a preview of planned features.
            </p>
          </div>
        </div>
      </div>

      {/* Planned Features Grid */}
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
        {plannedFeatures.map((feature) => {
          const Icon = feature.icon;
          const isHovered = hoveredCard === feature.title;

          return (
            <div
              key={feature.title}
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
              onMouseEnter={() => setHoveredCard(feature.title)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div
                style={{
                  background: feature.bgSubtle,
                  color: feature.color,
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
                {feature.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-3)', lineHeight: '1.5' }}>
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Additional Info */}
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
          What to Expect
        </h3>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            'Real-time data visualization with interactive charts and graphs',
            'Customizable date ranges and filters for deep-dive analysis',
            'Export charts and reports in multiple formats (PNG, PDF, CSV)',
            'Scheduled automated reports delivered to your inbox',
            'AI-powered insights and anomaly detection',
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
  );
}
