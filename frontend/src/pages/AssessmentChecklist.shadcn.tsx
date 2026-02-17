import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { getErrorMessage } from '../api/client';
import type { Assessment, AssessmentItem, CsfFunction } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';

const FUNCTION_TABS = ['All', 'GV', 'ID', 'PR', 'DE', 'RS', 'RC'];

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    compliant: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    non_compliant: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    not_assessed: 'bg-muted text-muted-foreground',
    not_applicable: 'bg-muted text-muted-foreground',
  };
  return map[status] || 'bg-muted text-muted-foreground';
}

export default function AssessmentChecklist() {
  const { id } = useParams<{ id: string }>();

  const [_assessment, setAssessment] = useState<Assessment | null>(null);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const [assessmentData, functionsData, itemsData] = await Promise.all([
        assessmentsApi.get(id),
        csfApi.getFunctions(),
        assessmentsApi.getItems(id),
      ]);
      setAssessment(assessmentData);
      setFunctions(functionsData);
      setItems(itemsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const distribution = useMemo(() => {
    const d = { compliant: 0, partial: 0, non_compliant: 0, not_assessed: 0, not_applicable: 0 };
    items.forEach((item) => {
      if (item.status in d) d[item.status as keyof typeof d]++;
    });
    return d;
  }, [items]);

  const complianceScore = useMemo(() => {
    const assessed = items.filter((i) => i.status !== 'not_assessed' && i.status !== 'not_applicable').length;
    if (assessed === 0) return 0;
    return (distribution.compliant / assessed) * 100;
  }, [items, distribution]);

  const filteredItems = useMemo(() => {
    let filtered = items;
    if (activeTab !== 'All') {
      filtered = filtered.filter((item) => {
        const funcName = item.function?.name || '';
        const catName = item.category?.name || '';
        return (
          funcName.startsWith(activeTab) ||
          catName.startsWith(activeTab) ||
          item.subcategory?.name?.startsWith(activeTab)
        );
      });
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.subcategory?.name || '').toLowerCase().includes(q) ||
          (item.subcategory?.description || '').toLowerCase().includes(q) ||
          (item.category?.name || '').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [items, activeTab, searchQuery]);

  const groupedItems = useMemo(() => {
    const groups: Record<string, { categoryId: string; categoryName: string; functionName: string; items: AssessmentItem[] }> = {};
    filteredItems.forEach((item) => {
      const catId = item.category?.id || 'unknown';
      if (!groups[catId]) {
        groups[catId] = {
          categoryId: catId,
          categoryName: item.category?.name || 'Unknown Category',
          functionName: item.function?.name || '',
          items: [],
        };
      }
      groups[catId].items.push(item);
    });
    return Object.values(groups).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [filteredItems]);

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    if (!id) return;
    try {
      const updated = await assessmentsApi.updateItem(id, itemId, { status: newStatus as AssessmentItem['status'] });
      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updated } : item)));
    } catch (err) {
      console.error('Failed to update status:', getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={loadData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/assessments/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessment
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Assessment Checklist</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {items.length} subcategories across {functions.length} functions
        </p>
      </div>

      {/* Score Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6 items-center">
            {/* Circle */}
            <div className="relative flex-shrink-0 w-32 h-32">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--border))" strokeWidth="14" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={complianceScore >= 75 ? 'hsl(var(--chart-2))' : complianceScore >= 50 ? '#f97316' : '#ef4444'}
                  strokeWidth="14"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - complianceScore / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold font-mono text-foreground">{Math.round(complianceScore)}%</span>
              </div>
            </div>

            {/* Distribution */}
            <div className="flex-1 w-full space-y-3">
              {[
                { label: 'Compliant', count: distribution.compliant, colorClass: 'bg-green-500' },
                { label: 'Partial', count: distribution.partial, colorClass: 'bg-orange-400' },
                { label: 'Non-Compliant', count: distribution.non_compliant, colorClass: 'bg-red-500' },
                { label: 'Not Assessed', count: distribution.not_assessed, colorClass: 'bg-muted-foreground' },
                { label: 'N/A', count: distribution.not_applicable, colorClass: 'bg-border' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.colorClass}`} />
                  <span className="text-sm text-muted-foreground w-28">{item.label}</span>
                  <Progress
                    value={items.length > 0 ? (item.count / items.length) * 100 : 0}
                    className="flex-1 h-2"
                  />
                  <span className="text-sm font-medium font-mono text-foreground w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Function Tabs + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 overflow-x-auto">
          {FUNCTION_TABS.map((tab) => (
            <Button
              key={tab}
              size="sm"
              variant={activeTab === tab ? 'default' : 'outline'}
              onClick={() => setActiveTab(tab)}
              className="whitespace-nowrap"
            >
              {tab}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredItems.length} of {items.length} subcategories
        </p>
      )}

      {/* Grouped Items */}
      {groupedItems.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground text-sm">
            No items found matching your filters.
          </CardContent>
        </Card>
      ) : (
        groupedItems.map((group) => (
          <Card key={group.categoryId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{group.categoryName}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {group.functionName}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{group.items.length} items</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y">
                {group.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-semibold text-foreground">
                          {item.subcategory?.id}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadgeClass(item.status || 'not_assessed')}`}>
                          {item.status?.replace('_', ' ') || 'not assessed'}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.subcategory?.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0 w-44">
                      <Select
                        value={item.status || 'not_assessed'}
                        onValueChange={(v) => handleStatusChange(item.id, v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_assessed">Not Assessed</SelectItem>
                          <SelectItem value="compliant">Compliant</SelectItem>
                          <SelectItem value="partial">Partial</SelectItem>
                          <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                          <SelectItem value="not_applicable">N/A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
