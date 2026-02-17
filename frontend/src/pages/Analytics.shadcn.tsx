import {
  BarChart3, TrendingUp, TrendingDown, AlertCircle,
  Shield, CheckCircle2, Clock, Minus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area, Cell,
} from 'recharts';

// ── Static demo data ──────────────────────────────

const radarData = [
  { function: 'Govern',   score: 85, fullMark: 100 },
  { function: 'Identify', score: 72, fullMark: 100 },
  { function: 'Protect',  score: 68, fullMark: 100 },
  { function: 'Detect',   score: 55, fullMark: 100 },
  { function: 'Respond',  score: 48, fullMark: 100 },
  { function: 'Recover',  score: 40, fullMark: 100 },
];

const trendData = [
  { month: 'Sep', org: 52, vendor: 44 },
  { month: 'Oct', org: 58, vendor: 49 },
  { month: 'Nov', org: 61, vendor: 51 },
  { month: 'Dec', org: 64, vendor: 56 },
  { month: 'Jan', org: 70, vendor: 61 },
  { month: 'Feb', org: 74, vendor: 65 },
];

const vendorRiskData = [
  { name: 'CloudHost Pro',  score: 82, risk: 'Low'      },
  { name: 'PaymentPro',     score: 61, risk: 'Medium'   },
  { name: 'DataBackup',     score: 45, risk: 'High'     },
  { name: 'NetSec Inc',     score: 34, risk: 'Critical' },
  { name: 'SaaS Platform',  score: 71, risk: 'Medium'   },
];

const gapData = [
  { category: 'Incident Response', gaps: 8  },
  { category: 'Threat Intel',      gaps: 6  },
  { category: 'Access Control',    gaps: 5  },
  { category: 'Monitoring',        gaps: 4  },
  { category: 'Data Protection',   gaps: 3  },
];

function riskColor(risk: string) {
  if (risk === 'Critical') return '#DC2626';
  if (risk === 'High')     return '#D97706';
  if (risk === 'Medium')   return '#EAB308';
  return '#16A34A';
}
function scoreColor(s: number) {
  if (s >= 70) return '#16A34A';
  if (s >= 50) return '#D97706';
  return '#DC2626';
}

// ── Custom tooltips ──────────────────────────────
function BarTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(15,23,42,0.1)' }}>
      <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B' }}>{label}</div>
      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 20, fontWeight: 700, color: '#4F46E5' }}>{payload[0].value}</div>
    </div>
  );
}

function LineTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(15,23,42,0.1)', fontFamily: 'Manrope, sans-serif' }}>
      <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: '#64748B', fontWeight: 500 }}>{p.name}:</span>
          <span style={{ fontWeight: 700, color: p.color, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16 }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

// ── Card wrapper ─────────────────────────────────
function Card({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      <div style={{ width: 3, height: 16, borderRadius: 2, background: '#4F46E5', flexShrink: 0 }} />
      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94A3B8' }}>
        {children}
      </span>
    </div>
  );
}

export default function Analytics() {
  const avgScore = Math.round(radarData.reduce((s, d) => s + d.score, 0) / radarData.length);
  const prevAvg  = 61;
  const delta    = avgScore - prevAvg;

  // Summary KPIs
  const kpis = [
    {
      label: 'Avg Compliance',
      value: `${avgScore}%`,
      color: scoreColor(avgScore),
      icon: <Shield size={16} />,
      sub: delta > 0
        ? <span style={{ color: '#16A34A', display: 'flex', alignItems: 'center', gap: 3 }}><TrendingUp size={12} />+{delta}% vs last month</span>
        : <span style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: 3 }}><TrendingDown size={12} />{delta}% vs last month</span>,
    },
    {
      label: 'Assessments Done',
      value: '8',
      color: '#4F46E5',
      icon: <CheckCircle2 size={16} />,
      sub: <span style={{ color: '#94A3B8' }}>2 in progress</span>,
    },
    {
      label: 'Open Gaps',
      value: '26',
      color: '#D97706',
      icon: <AlertCircle size={16} />,
      sub: <span style={{ color: '#94A3B8' }}>Across 5 categories</span>,
    },
    {
      label: 'High-Risk Vendors',
      value: '2',
      color: '#DC2626',
      icon: <Clock size={16} />,
      sub: <span style={{ color: '#94A3B8' }}>Require immediate action</span>,
    },
  ];

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Analytics
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13, color: '#94A3B8', marginTop: 2 }}>
            Compliance trends, risk visualization & gap analysis
          </p>
        </div>
        {/* Date range hint */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 8,
          background: '#fff',
          border: '1px solid #E2E8F0',
          fontFamily: 'Manrope, sans-serif',
          fontSize: 12,
          fontWeight: 600,
          color: '#64748B',
        }}>
          <BarChart3 size={13} />
          Last 6 months
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {kpis.map((k, i) => (
          <div
            key={i}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <Card>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${k.color}12`,
                  border: `1px solid ${k.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: k.color,
                }}>
                  {k.icon}
                </div>
              </div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 34, fontWeight: 700, color: k.color, lineHeight: 1, marginBottom: 2 }}>
                {k.value}
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 4 }}>
                {k.label}
              </div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11 }}>{k.sub}</div>
            </Card>
          </div>
        ))}
      </div>

      {/* Radar + Trend row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }}>

        {/* Radar */}
        <Card>
          <SectionTitle>CSF Function Maturity</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis
                dataKey="function"
                tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 600, fill: '#64748B' }}
              />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#4F46E5"
                fill="#4F46E5"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 4 }}>
            {radarData.map(d => (
              <div key={d.function} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: scoreColor(d.score) }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                  {d.function} <strong style={{ color: scoreColor(d.score) }}>{d.score}%</strong>
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Trend line */}
        <Card>
          <SectionTitle>Compliance Trend (6 months)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendData} margin={{ left: -10, right: 10 }}>
              <defs>
                <linearGradient id="orgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="vendorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis domain={[30, 100]} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<LineTip />} />
              <Area type="monotone" dataKey="org"    name="Organization" stroke="#4F46E5" fill="url(#orgGrad)"    strokeWidth={2.5} dot={{ r: 3, fill: '#4F46E5' }} activeDot={{ r: 5 }} />
              <Area type="monotone" dataKey="vendor" name="Avg Vendor"   stroke="#16A34A" fill="url(#vendorGrad)" strokeWidth={2}   dot={{ r: 3, fill: '#16A34A' }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
            {[{ color: '#4F46E5', label: 'Organization' }, { color: '#16A34A', label: 'Avg Vendor' }].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 3, borderRadius: 2, background: l.color }} />
                <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fontWeight: 600, color: '#64748B' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Vendor risk + Gap analysis row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

        {/* Vendor risk scores */}
        <Card>
          <SectionTitle>Vendor Risk Scores</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vendorRiskData.map(v => (
              <div key={v.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Name */}
                <div style={{ width: 110, fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: '#0F172A', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {v.name}
                </div>
                {/* Bar */}
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                  <div style={{
                    width: `${v.score}%`,
                    height: '100%',
                    borderRadius: 3,
                    background: scoreColor(v.score),
                    transition: 'width 0.6s ease',
                  }} />
                </div>
                {/* Score */}
                <div style={{ width: 36, fontFamily: 'Barlow Condensed, sans-serif', fontSize: 16, fontWeight: 700, color: scoreColor(v.score), textAlign: 'right', flexShrink: 0 }}>
                  {v.score}
                </div>
                {/* Risk badge */}
                <div style={{
                  padding: '2px 8px',
                  borderRadius: 100,
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: 10,
                  fontWeight: 700,
                  background: `${riskColor(v.risk)}12`,
                  color: riskColor(v.risk),
                  flexShrink: 0,
                  width: 60,
                  textAlign: 'center',
                }}>
                  {v.risk}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top gaps */}
        <Card>
          <SectionTitle>Top Compliance Gaps</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gapData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="category"
                width={115}
                tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
              <Bar dataKey="gaps" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Minus size={12} style={{ color: '#EF4444' }} />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: '#94A3B8' }}>
              Total <strong style={{ color: '#0F172A' }}>26 open gaps</strong> across all assessments
            </span>
          </div>
        </Card>
      </div>

      {/* CSF bar chart */}
      <Card>
        <SectionTitle>Score by CSF Function</SectionTitle>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={radarData} barSize={40} margin={{ left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="function" tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fill: '#64748B', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontFamily: 'Manrope, sans-serif', fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
            <Bar dataKey="score" radius={[5, 5, 0, 0]}>
              {radarData.map((entry, index) => (
                <Cell key={index} fill={scoreColor(entry.score)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

    </div>
  );
}
