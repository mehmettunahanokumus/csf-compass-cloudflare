import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Shield,
  Lock,
  CheckCircle,
  XCircle,
  Circle,
  Ban,
  AlertCircle,
  Send,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import { csfApi } from '../api/csf';
import type {
  ValidateTokenResponse,
  Assessment,
  AssessmentItem,
  CsfFunction,
} from '../types';
import { getErrorMessage, formatDate } from '../api/client';

// ── Helpers ──────────────────────────────────────────────

function getStatusIcon(status: string) {
  switch (status) {
    case 'compliant':
      return <CheckCircle className="h-5 w-5 text-emerald-500" />;
    case 'partial':
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    case 'non_compliant':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'not_applicable':
      return <Ban className="h-5 w-5 text-muted-foreground" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground/50" />;
  }
}

function getStatusBadgeProps(status: string) {
  switch (status) {
    case 'compliant':
      return { label: 'Compliant', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' };
    case 'partial':
      return { label: 'Partial', className: 'bg-amber-500/10 text-amber-600 border-amber-500/20' };
    case 'non_compliant':
      return { label: 'Non-Compliant', className: 'bg-red-500/10 text-red-600 border-red-500/20' };
    case 'not_applicable':
      return { label: 'N/A', className: 'bg-muted text-muted-foreground border-border' };
    default:
      return { label: 'Not Assessed', className: 'bg-muted text-muted-foreground border-border' };
  }
}

const STATUS_OPTIONS = [
  { value: 'compliant', label: 'Compliant', activeClass: 'bg-emerald-600 text-white hover:bg-emerald-600' },
  { value: 'partial', label: 'Partial', activeClass: 'bg-amber-500 text-white hover:bg-amber-500' },
  { value: 'non_compliant', label: 'Non-Compliant', activeClass: 'bg-red-600 text-white hover:bg-red-600' },
  { value: 'not_applicable', label: 'Not Applicable', activeClass: 'bg-muted-foreground text-white hover:bg-muted-foreground' },
] as const;

// ── Component ────────────────────────────────────────────

export default function VendorPortalShadcn() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationData, setValidationData] = useState<ValidateTokenResponse | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  useEffect(() => {
    if (token) validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await vendorInvitationsApi.validate(token);
      if (!data.valid) {
        setError(data.error || 'Invalid or expired invitation link');
        return;
      }
      setValidationData(data);
      setAssessment(data.assessment || null);
      setCompleted(data.invitation?.invitation_status === 'completed');
      if (data.assessment && token) {
        await loadAssessmentData(token);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadAssessmentData = async (tokenValue: string) => {
    try {
      setLoadingItems(true);
      const functionsData = await csfApi.getFunctions();
      setFunctions(functionsData);
      if (functionsData.length > 0) {
        setSelectedFunction(functionsData[0].id);
      }
      const itemsData = await vendorInvitationsApi.getItems(tokenValue);
      setItems(itemsData);
    } catch (err) {
      console.error('Failed to load assessment data:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoadingItems(false);
    }
  };

  const handleStatusChange = async (itemId: string, status: string) => {
    if (!token) return;
    try {
      const updatedItem = await vendorInvitationsApi.updateItem(token, itemId, {
        status: status as 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'not_applicable',
      });
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === itemId ? updatedItem : item)),
      );
    } catch (err) {
      console.error('Failed to update item:', err);
      alert(getErrorMessage(err));
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    if (!confirm('Are you sure you want to submit this assessment? You will not be able to make changes after submission.')) {
      return;
    }
    try {
      setSubmitting(true);
      await vendorInvitationsApi.complete(token);
      setCompleted(true);
      alert('Assessment submitted successfully!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate progress
  const filteredItems = items.filter((item) => item.function?.id === selectedFunction);
  const totalItems = items.length;
  const assessedItems = items.filter((i) => i.status !== 'not_assessed').length;
  const progressPct = totalItems > 0 ? Math.round((assessedItems / totalItems) * 100) : 0;

  // ── Loading state ──

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Validating invitation...</span>
        </div>
      </div>
    );
  }

  // ── Error state ──

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardContent className="p-8">
            <div className="mb-4 flex items-center gap-3 text-destructive">
              <XCircle className="h-8 w-8" />
              <h1 className="text-2xl font-bold">Invalid Invitation</h1>
            </div>
            <p className="mb-6 leading-relaxed text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">
              Please contact the organization that sent you this invitation for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validationData || !assessment) return null;

  // ── Completed state ──

  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md text-center">
          <CardContent className="p-8">
            <div className="mb-4 flex justify-center">
              <CheckCircle className="h-16 w-16 text-emerald-500" />
            </div>
            <h1 className="mb-2 text-2xl font-bold">Assessment Completed</h1>
            <p className="mb-6 leading-relaxed text-muted-foreground">
              Thank you for completing the cybersecurity assessment. Your responses have been submitted successfully.
            </p>
            <p className="text-sm text-muted-foreground">
              Completed on {formatDate(validationData.invitation?.completed_at || undefined)}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Main render ──

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header - no sidebar */}
      <header className="sticky top-0 z-10 border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">CSF Compass</h1>
              <p className="text-xs text-muted-foreground">Vendor Assessment Portal</p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
            <Lock className="h-3 w-3" />
            Secure Session
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        {/* Welcome Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="mb-2 text-xl font-semibold">Secure Vendor Assessment</h2>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Welcome{validationData.vendor_contact_name ? `, ${validationData.vendor_contact_name}` : ''}.
                  You've been invited to complete a cybersecurity assessment for{' '}
                  <span className="font-medium text-foreground">{assessment.name}</span>.
                  Please answer each question honestly and provide supporting documentation where applicable.
                </p>
                {validationData.invitation?.message && (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950/50">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      {validationData.invitation.message}
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    Encrypted communication
                  </span>
                  <span>
                    Expires {formatDate(validationData.invitation?.token_expires_at)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-medium">Assessment Progress</span>
              <span className="text-sm text-muted-foreground">
                {assessedItems} of {totalItems} completed
              </span>
            </div>
            <Progress value={progressPct} className="h-3" />
          </CardContent>
        </Card>

        {/* Assessment Card */}
        <Card>
          <CardHeader>
            <CardTitle>NIST Cybersecurity Framework Assessment</CardTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Please review each category and indicate your compliance status. You can save your progress and return later using the same link.
            </p>
          </CardHeader>
          <CardContent>
            {/* Function Tabs */}
            <div className="mb-6 border-b">
              <nav className="-mb-px flex gap-6 overflow-x-auto">
                {functions.map((func) => {
                  const isSelected = selectedFunction === func.id;
                  return (
                    <button
                      key={func.id}
                      onClick={() => setSelectedFunction(func.id)}
                      className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                      }`}
                    >
                      {func.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Assessment Items */}
            <div className="space-y-4">
              {loadingItems ? (
                <div className="space-y-4 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3 rounded-lg border p-5">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : filteredItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No assessment items found for this category
                </p>
              ) : (
                filteredItems.map((item) => {
                  const badge = getStatusBadgeProps(item.status);
                  const isExpanded = expandedItem === item.id;

                  return (
                    <div key={item.id} className="rounded-lg border transition-colors">
                      {/* Item Header - clickable */}
                      <button
                        onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                        className="flex w-full items-start gap-4 p-5 text-left"
                      >
                        {getStatusIcon(item.status)}
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-primary">
                              {item.subcategory?.id}
                            </span>
                            <Badge variant="outline" className={badge.className}>
                              {badge.label}
                            </Badge>
                          </div>
                          <p className="font-medium">{item.subcategory?.name}</p>
                          {item.subcategory?.description && (
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {item.subcategory.description}
                            </p>
                          )}
                        </div>
                        <ChevronRight
                          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>

                      {/* Expanded: Status Selection */}
                      {isExpanded && (
                        <div className="border-t px-5 pb-5 pt-4">
                          <p className="mb-3 text-sm font-medium">Select compliance status:</p>
                          <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map(({ value, label, activeClass }) => {
                              const isActive = item.status === value;
                              return (
                                <Button
                                  key={value}
                                  variant={isActive ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => handleStatusChange(item.id, value)}
                                  className={isActive ? activeClass : ''}
                                >
                                  {label}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit Footer */}
        <div className="flex items-center justify-between pb-8 pt-2">
          <p className="text-sm text-muted-foreground">
            Your progress is saved automatically when you change a status
          </p>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Submit Assessment
              </>
            )}
          </Button>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="mt-12 border-t">
        <div className="mx-auto max-w-5xl px-6 py-6">
          <p className="text-center text-xs text-muted-foreground">
            Powered by CSF Compass - NIST Cybersecurity Framework 2.0
          </p>
        </div>
      </footer>
    </div>
  );
}
