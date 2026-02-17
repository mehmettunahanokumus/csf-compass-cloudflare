import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, Circle, AlertCircle, Filter } from 'lucide-react';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type { ComparisonData } from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

type FilterType = 'all' | 'matches' | 'differences';

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'compliant':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'partial':
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    case 'non_compliant':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    compliant: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    non_compliant: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    not_applicable: 'bg-muted text-muted-foreground',
  };
  const labels: Record<string, string> = {
    compliant: 'Compliant',
    partial: 'Partial',
    non_compliant: 'Non-Compliant',
    not_applicable: 'N/A',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[status] || 'bg-muted text-muted-foreground'}`}>
      {labels[status] || 'Not Assessed'}
    </span>
  );
}

export default function AssessmentComparison() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ComparisonData | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadComparison();
  }, [id]);

  const loadComparison = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const comparisonData = await vendorInvitationsApi.getComparison(id);
      setData(comparisonData);
      if (comparisonData.comparison_items.length > 0) {
        const firstFunction = comparisonData.comparison_items[0]?.function?.id;
        if (firstFunction) setSelectedFunction(firstFunction);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data || !data.organization_assessment) {
    return (
      <Alert>
        <AlertDescription>Comparison data not available</AlertDescription>
      </Alert>
    );
  }

  const functions = Array.from(
    new Map(
      data.comparison_items
        .filter((item) => item.function)
        .map((item) => [item.function!.id, item.function!])
    ).values()
  );

  let filteredItems = data.comparison_items;
  if (selectedFunction) {
    filteredItems = filteredItems.filter((item) => item.function?.id === selectedFunction);
  }
  if (filter === 'matches') {
    filteredItems = filteredItems.filter((item) => item.matches && item.vendor_item);
  } else if (filter === 'differences') {
    filteredItems = filteredItems.filter((item) => !item.matches || !item.vendor_item);
  }

  const totalItems = data.comparison_items.length;
  const assessedByVendor = data.comparison_items.filter((item) => item.vendor_item).length;
  const matches = data.comparison_items.filter((item) => item.matches && item.vendor_item).length;
  const differences = data.comparison_items.filter((item) => !item.matches && item.vendor_item).length;
  const notAssessed = totalItems - assessedByVendor;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/assessments/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assessment
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Assessment Comparison</h1>
        <p className="text-sm text-muted-foreground mt-1">{data.organization_assessment.name}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Items', value: totalItems, className: 'text-foreground' },
          { label: 'Matches', value: matches, className: 'text-green-600' },
          { label: 'Differences', value: differences, className: 'text-orange-500' },
          { label: 'Not Assessed', value: notAssessed, className: 'text-muted-foreground' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className={`text-3xl font-bold font-mono mt-1 ${stat.className}`}>{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invitation Status */}
      {data.invitation && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/10">
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <span className="font-semibold">Vendor Self-Assessment Status</span>
                <p className="text-sm mt-0.5">
                  Invitation sent to {data.invitation.vendor_contact_email} on {formatDate(data.invitation.sent_at)}
                </p>
              </div>
              <Badge
                className={
                  data.invitation.invitation_status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : data.invitation.invitation_status === 'accessed'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-muted text-muted-foreground'
                }
              >
                {data.invitation.invitation_status === 'completed'
                  ? 'Completed'
                  : data.invitation.invitation_status === 'accessed'
                  ? 'In Progress'
                  : data.invitation.invitation_status}
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Comparison Table */}
      <Card>
        {/* Filter Bar */}
        <div className="flex items-center gap-4 p-4 border-b flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filter:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all' as FilterType, label: `All Items (${totalItems})` },
              { value: 'matches' as FilterType, label: `Matches (${matches})` },
              { value: 'differences' as FilterType, label: `Differences (${differences + notAssessed})` },
            ].map(({ value, label }) => (
              <Button
                key={value}
                size="sm"
                variant={filter === value ? 'default' : 'outline'}
                onClick={() => setFilter(value)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Function Tabs */}
        <div className="flex gap-6 px-4 border-b overflow-x-auto">
          {functions.map((func) => (
            <button
              key={func.id}
              onClick={() => setSelectedFunction(func.id)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                selectedFunction === func.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {func.name}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-1/4">Subcategory</TableHead>
                <TableHead className="w-1/4">Your Assessment</TableHead>
                <TableHead className="w-1/4">Vendor Self-Assessment</TableHead>
                <TableHead className="w-1/4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                    No items to display
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const hasWarning = item.vendor_item && !item.matches;
                  return (
                    <TableRow
                      key={item.subcategory_id}
                      className={hasWarning ? 'bg-orange-50 dark:bg-orange-900/10' : ''}
                    >
                      <TableCell>
                        <div className="font-mono text-xs font-semibold">{item.subcategory?.id}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{item.subcategory?.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon status={item.org_item.status} />
                          <StatusBadge status={item.org_item.status} />
                        </div>
                        {item.org_item.notes && (
                          <p className="text-xs text-muted-foreground">{item.org_item.notes}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.vendor_item ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <StatusIcon status={item.vendor_item.status} />
                              <StatusBadge status={item.vendor_item.status} />
                            </div>
                            {item.vendor_item.notes && (
                              <p className="text-xs text-muted-foreground">{item.vendor_item.notes}</p>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Not assessed</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!item.vendor_item ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                            Not Assessed
                          </span>
                        ) : item.matches ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            ✓ Match
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                            ⚠ Difference
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
