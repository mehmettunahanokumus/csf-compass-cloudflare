import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  CheckCircle2,
  Building2,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
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

  // Vendor risk distribution for pie chart
  const riskDistribution = [
    { name: 'Critical', value: vendors.filter((v) => v.criticality_level === 'critical').length, color: '#ef4444' },
    { name: 'High', value: vendors.filter((v) => v.criticality_level === 'high').length, color: '#f97316' },
    { name: 'Medium', value: vendors.filter((v) => v.criticality_level === 'medium').length, color: '#eab308' },
    { name: 'Low', value: vendors.filter((v) => !v.criticality_level || v.criticality_level === 'low').length, color: '#10b981' },
  ];

  // ── Loading state ──

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="mb-2 h-8 w-56" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="mb-3 h-4 w-24" />
                <Skeleton className="mb-2 h-8 w-16" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
              <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // ── Main render ──

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="mb-1 text-3xl font-semibold">Security Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your organization's cybersecurity posture and vendor risk landscape
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Overall Score */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">Overall Score</p>
                <p className="text-3xl font-semibold">{avgScore}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-emerald-500">
                  <TrendingUp className="h-3 w-3" />
                  +5% from last month
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="mb-1 text-sm text-muted-foreground">Completion</p>
                <p className="text-3xl font-semibold">{completionPct}%</p>
                <div className="mt-3">
                  <Progress value={completionPct} className="h-2" />
                </div>
              </div>
              <div className="ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Assessed */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">Vendors Assessed</p>
                <p className="text-3xl font-semibold">{vendors.length}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {completedAssessments.filter((a) => a.assessment_type === 'vendor').length} assessments done
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High-Risk Vendors */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">High-Risk Vendors</p>
                <p className="text-3xl font-semibold">{highRiskVendors.length}</p>
                {highRiskVendors.length > 0 && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-orange-500">
                    <AlertTriangle className="h-3 w-3" />
                    Requires attention
                  </p>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                <AlertTriangle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* NIST CSF Progress */}
        <Card>
          <CardHeader>
            <CardTitle>NIST CSF 2.0 Assessment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={assessmentProgressData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="category"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="progress" fill="hsl(var(--chart-1, var(--primary)))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vendor Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3">
                {riskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardAction>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/vendors">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivityStatic.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 rounded-lg border bg-secondary/30 p-4"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    activity.type === 'success'
                      ? 'bg-emerald-500/10'
                      : activity.type === 'warning'
                        ? 'bg-orange-500/10'
                        : 'bg-blue-500/10'
                  }`}
                >
                  {activity.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {activity.type === 'warning' && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                  {activity.type === 'info' && <Clock className="h-5 w-5 text-blue-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.vendor}</p>
                </div>
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {activity.timestamp}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Link to="/assessments/new" className="group">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="p-6">
              <Shield className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">Start Assessment</h3>
              <p className="text-sm text-muted-foreground">
                Begin a new NIST CSF 2.0 assessment using the guided wizard
              </p>
              <ArrowRight className="mt-4 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/vendors" className="group">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="p-6">
              <Building2 className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">Manage Vendors</h3>
              <p className="text-sm text-muted-foreground">
                Review vendor assessments and risk scores
              </p>
              <ArrowRight className="mt-4 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>

        <Link to="/assessment/checklist" className="group">
          <Card className="transition-colors hover:border-primary">
            <CardContent className="p-6">
              <CheckCircle2 className="mb-3 h-8 w-8 text-primary" />
              <h3 className="mb-2 font-semibold">View Checklist</h3>
              <p className="text-sm text-muted-foreground">
                Access the full NIST CSF checklist and track progress
              </p>
              <ArrowRight className="mt-4 h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
