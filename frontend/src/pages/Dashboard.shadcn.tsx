import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Building2,
  AlertTriangle,
  TrendingUp,
  Plus,
  Target,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { assessmentsApi } from '../api/assessments';
import { vendorsApi } from '../api/vendors';
import type { Assessment, Vendor } from '../types';
import { getErrorMessage } from '../api/client';

// ── Static chart data (will be replaced with real data when available) ──

const assessmentProgressData = [
  { category: 'Govern', progress: 85 },
  { category: 'Identify', progress: 72 },
  { category: 'Protect', progress: 68 },
  { category: 'Detect', progress: 55 },
  { category: 'Respond', progress: 48 },
  { category: 'Recover', progress: 40 },
];

const recentActivityStatic = [
  { id: 1, action: 'Assessment completed', vendor: 'TechCorp Solutions', timestamp: '2 hours ago', type: 'success' as const },
  { id: 2, action: 'High-risk finding identified', vendor: 'DataFlow Inc', timestamp: '5 hours ago', type: 'warning' as const },
  { id: 3, action: 'Vendor invited to assessment', vendor: 'CloudSec Systems', timestamp: '1 day ago', type: 'info' as const },
  { id: 4, action: 'Evidence uploaded', vendor: 'Internal Assessment', timestamp: '2 days ago', type: 'success' as const },
];

// ── Component ────────────────────────────────────────────

export default function DashboardShadcn() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assessmentData, vendorData] = await Promise.all([
        assessmentsApi.list(),
        vendorsApi.list().catch(() => [] as Vendor[]),
      ]);
      setAssessments(assessmentData);
      setVendors(vendorData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const completedAssessments = assessments.filter((a) => a.status === 'completed');
  const completionPct = assessments.length > 0
    ? Math.round((completedAssessments.length / assessments.length) * 100)
    : 0;
  const avgScore = completedAssessments.length > 0
    ? Math.round(
        completedAssessments.reduce((sum, a) => sum + (a.overall_score ?? 0), 0) /
          completedAssessments.length
      )
    : 0;
  const highRiskVendors = vendors.filter(
    (v) => (v.latest_assessment_score ?? 100) < 50
  );

  // Vendor risk distribution (kept for potential future use)
  const _riskDistribution = [
    { name: 'Critical', value: vendors.filter((v) => v.criticality_level === 'critical').length, color: '#ef4444' },
    { name: 'High', value: vendors.filter((v) => v.criticality_level === 'high').length, color: '#f97316' },
    { name: 'Medium', value: vendors.filter((v) => v.criticality_level === 'medium').length, color: '#eab308' },
    { name: 'Low', value: vendors.filter((v) => !v.criticality_level || v.criticality_level === 'low').length, color: '#10b981' },
  ];

  // ── Loading state ──

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 bg-white/[0.04] rounded-xl w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white/[0.04] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white/[0.04] rounded-xl" />
          <div className="h-64 bg-white/[0.04] rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Error state ──

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <p className="font-sans text-sm text-[#8E8FA8]">{error}</p>
        </div>
      </div>
    );
  }

  // ── Main render ──

  return (
    <div className="animate-fade-in-up space-y-8">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F0F0F5]">Security Overview</h1>
          <p className="font-sans text-sm text-[#8E8FA8] mt-1">NIST CSF 2.0 compliance dashboard</p>
        </div>
        <Link to="/assessments/new">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-[#08090E] font-display text-sm font-semibold rounded-lg hover:bg-amber-400 transition-colors">
            <Plus className="w-4 h-4" />
            New Assessment
          </button>
        </Link>
      </div>

      {/* KPI Cards - 4 column grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assessments */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 hover:border-amber-500/20 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <Shield className="w-[18px] h-[18px] text-amber-500/70" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-amber-400 mb-1 tabular-nums">
            {assessments.length}
          </div>
          <div className="font-sans text-xs text-[#8E8FA8] font-medium">Total Assessments</div>
        </div>

        {/* Active Vendors */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 hover:border-amber-500/20 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <Building2 className="w-[18px] h-[18px] text-amber-500/70" />
            </div>
          </div>
          <div className="font-display text-3xl font-bold text-amber-400 mb-1 tabular-nums">
            {vendors.length}
          </div>
          <div className="font-sans text-xs text-[#8E8FA8] font-medium">Active Vendors</div>
        </div>

        {/* Avg Compliance Score */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 hover:border-amber-500/20 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <Target className="w-[18px] h-[18px] text-amber-500/70" />
            </div>
            {completedAssessments.length > 0 && (
              <div className="flex items-center gap-1 text-emerald-400 text-xs font-sans">
                <TrendingUp className="w-3 h-3" />
                <span>+5%</span>
              </div>
            )}
          </div>
          <div className={`font-display text-3xl font-bold mb-1 tabular-nums ${avgScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {avgScore}%
          </div>
          <div className="font-sans text-xs text-[#8E8FA8] font-medium">Avg Compliance Score</div>
        </div>

        {/* Critical Findings */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-5 hover:border-amber-500/20 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <AlertTriangle className="w-[18px] h-[18px] text-amber-500/70" />
            </div>
          </div>
          <div className={`font-display text-3xl font-bold mb-1 tabular-nums ${highRiskVendors.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {highRiskVendors.length}
          </div>
          <div className="font-sans text-xs text-[#8E8FA8] font-medium">Critical Findings</div>
        </div>
      </div>

      {/* Charts + Activity - 2 column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart card */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              CSF Framework Coverage
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={assessmentProgressData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fill: '#55576A', fontSize: 10, fontFamily: 'DM Sans' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#55576A', fontSize: 10, fontFamily: 'DM Sans' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{
                  background: '#13151F',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontFamily: 'DM Sans',
                  fontSize: 12,
                }}
                cursor={{ fill: 'rgba(245,158,11,0.04)' }}
              />
              <Bar dataKey="progress" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent activity card */}
        <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
            <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
              Recent Activity
            </h2>
          </div>
          <div>
            {recentActivityStatic.map((item) => (
              <div key={item.id} className="flex items-start gap-3 py-3 border-b border-white/[0.04] last:border-0">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  item.type === 'success' ? 'bg-emerald-500' :
                  item.type === 'warning' ? 'bg-amber-500' :
                  'bg-indigo-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm text-[#F0F0F5] font-medium">{item.action}</p>
                  <p className="font-sans text-xs text-[#55576A] mt-0.5">{item.vendor}</p>
                </div>
                <span className="font-mono text-[10px] text-[#55576A] flex-shrink-0">{item.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent assessments */}
      <div className="bg-[#0E1018] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-[3px] h-4 bg-amber-500 rounded-full flex-shrink-0" />
          <h2 className="font-display text-[11px] font-semibold tracking-[0.12em] uppercase text-[#8E8FA8]">
            Recent Assessments
          </h2>
        </div>
        {assessments.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left py-2.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Assessment</th>
                <th className="text-left py-2.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Type</th>
                <th className="text-left py-2.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Score</th>
                <th className="text-left py-2.5 font-display text-[10px] tracking-[0.12em] uppercase text-[#55576A] font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {assessments.slice(0, 5).map((a) => (
                <tr key={a.id} className="border-b border-white/[0.03] hover:bg-amber-500/[0.03] transition-colors cursor-pointer">
                  <td className="py-3 font-sans text-sm text-[#F0F0F5] font-medium">{a.name}</td>
                  <td className="py-3">
                    <span className="font-mono text-[11px] text-[#8E8FA8] bg-white/[0.04] px-2 py-0.5 rounded">
                      {a.assessment_type}
                    </span>
                  </td>
                  <td className="py-3 font-display text-sm font-semibold text-amber-400 tabular-nums">
                    {a.overall_score != null ? `${a.overall_score.toFixed(0)}%` : '—'}
                  </td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-sans font-medium ${
                      a.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      a.status === 'in_progress' ? 'bg-indigo-500/10 text-indigo-400' :
                      'bg-white/[0.06] text-[#8E8FA8]'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8">
            <p className="font-sans text-sm text-[#55576A]">No assessments yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
