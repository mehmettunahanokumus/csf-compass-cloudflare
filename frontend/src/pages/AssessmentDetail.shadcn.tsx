import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trash2, Upload, Brain, GitCompare, Link2, Copy,
  FileText, Calendar, Building2, BarChart3, ClipboardList, MessageSquare, Clock, CheckSquare,
} from 'lucide-react';
import { assessmentsApi } from '../api/assessments';
import { csfApi } from '../api/csf';
import { evidenceApi } from '../api/evidence';
import { aiApi } from '../api/ai';
import { vendorInvitationsApi } from '../api/vendor-invitations';
import type {
  Assessment, AssessmentItem, CsfFunction, VendorAssessmentInvitation, SendInvitationResponse,
} from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import InviteVendorDialog from '../components/InviteVendorDialog';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import ComplianceChart from '../components/charts/ComplianceChart';
import FunctionScoreChart from '../components/charts/FunctionScoreChart';

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    compliant: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    partial: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    non_compliant: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    not_applicable: 'bg-muted text-muted-foreground',
    draft: 'bg-muted text-muted-foreground',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  };
  return map[status] || 'bg-muted text-muted-foreground';
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    compliant: 'Compliant',
    partial: 'Partial',
    non_compliant: 'Non-Compliant',
    not_applicable: 'N/A',
    draft: 'Draft',
    in_progress: 'In Progress',
    completed: 'Completed',
    not_assessed: 'Not Assessed',
  };
  return map[status] || status;
}

function invitationBadgeClass(status: string) {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-700';
    case 'accessed': return 'bg-blue-100 text-blue-700';
    case 'pending': return 'bg-orange-100 text-orange-700';
    case 'expired':
    case 'revoked': return 'bg-red-100 text-red-700';
    default: return 'bg-muted text-muted-foreground';
  }
}

export default function AssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [functions, setFunctions] = useState<CsfFunction[]>([]);
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [invitation, setInvitation] = useState<VendorAssessmentInvitation | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [analyzingItem, setAnalyzingItem] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showVendorLink, setShowVendorLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    loadData();
    loadInvitation();
  }, [id]);

  useEffect(() => {
    if (selectedFunction && id) loadItems(selectedFunction);
  }, [selectedFunction, id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [assessmentData, functionsData] = await Promise.all([
        assessmentsApi.get(id),
        csfApi.getFunctions(),
      ]);
      setAssessment(assessmentData);
      setFunctions(functionsData);
      if (functionsData.length > 0 && !selectedFunction) {
        setSelectedFunction(functionsData[0].id);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (functionId: string) => {
    if (!id) return;
    try {
      const itemsData = await assessmentsApi.getItems(id, functionId);
      setItems(itemsData);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const loadInvitation = async () => {
    if (!id) return;
    try {
      const invitationData = await vendorInvitationsApi.getInvitation(id);
      setInvitation(invitationData);
    } catch {
      // no invitation yet
    }
  };

  const handleSendInvitation = (_response: SendInvitationResponse) => {
    loadInvitation();
    setShowVendorLink(true);
  };

  const handleCopyLink = async () => {
    if (!invitation) return;
    const vendorLink = `${window.location.origin}/vendor-portal/${invitation.access_token}`;
    try {
      await navigator.clipboard.writeText(vendorLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      alert('Failed to copy link to clipboard');
    }
  };

  const handleStatusChange = async (itemId: string, status: string) => {
    if (!id) return;
    try {
      await assessmentsApi.updateItem(id, itemId, { status: status as any });
      await Promise.all([loadItems(selectedFunction), loadData()]);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    if (!id) return;
    try {
      setUploadingFor(itemId);
      await evidenceApi.upload(file, id, itemId);
      alert('File uploaded successfully!');
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setUploadingFor(null);
    }
  };

  const handleAnalyze = async (item: AssessmentItem) => {
    if (!id) return;
    try {
      setAnalyzingItem(item.id);
      const result = await aiApi.analyzeEvidence({
        assessment_item_id: item.id,
        subcategory_code: item.subcategory?.id || '',
        subcategory_description: item.subcategory?.description || '',
        evidence_notes: item.notes || '',
        file_names: [],
        current_status: item.status || 'not_assessed',
      });
      alert(
        `AI Analysis Complete!\n\nSuggested Status: ${result.result.suggestedStatus}\nConfidence: ${(result.result.confidenceScore * 100).toFixed(0)}%\n\nReasoning: ${result.result.reasoning}`
      );
      await loadItems(selectedFunction);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setAnalyzingItem(null);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await assessmentsApi.delete(id);
      navigate('/assessments');
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-72" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Assessment not found'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex gap-4 items-start">
          <Link to="/assessments">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{assessment.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Created {formatDate(assessment.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${statusBadgeClass(assessment.status)}`}>
            {statusLabel(assessment.status)}
          </span>
          {assessment.assessment_type === 'vendor' && invitation?.invitation_status === 'completed' && (
            <Link to={`/assessments/${id}/comparison`}>
              <Button variant="outline" size="sm">
                <GitCompare className="h-4 w-4 mr-1.5" />
                View Comparison
              </Button>
            </Link>
          )}
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start border-b rounded-none h-auto pb-0 bg-transparent gap-1">
          {[
            { value: 'overview', label: 'Overview', icon: BarChart3 },
            { value: 'items', label: 'Assessment Items', icon: ClipboardList },
            { value: 'vendor', label: 'Vendor Responses', icon: MessageSquare },
            { value: 'history', label: 'History', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent pb-2"
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Score + Distribution */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <ComplianceChart score={assessment.overall_score ?? 0} size="lg" showLabel />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Score Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {[
                      { label: 'Compliant', value: assessment.stats?.compliant || 0, borderColor: 'border-green-500' },
                      { label: 'Partial', value: assessment.stats?.partial || 0, borderColor: 'border-orange-400' },
                      { label: 'Non-Compliant', value: assessment.stats?.nonCompliant || 0, borderColor: 'border-red-500' },
                      { label: 'Not Assessed', value: assessment.stats?.notAssessed || 0, borderColor: 'border-muted-foreground' },
                      { label: 'N/A', value: assessment.stats?.notApplicable || 0, borderColor: 'border-border' },
                    ].map((item) => (
                      <div key={item.label} className={`border-l-[3px] pl-3 ${item.borderColor}`}>
                        <p className="text-2xl font-bold font-mono text-foreground">{item.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Details + Quick Actions */}
            <div className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assessment Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Type</p>
                      <p className="text-sm font-medium text-foreground">
                        {assessment.assessment_type === 'vendor' ? 'Vendor Assessment' : 'Organization Assessment'}
                      </p>
                    </div>
                  </div>
                  {assessment.vendor && (
                    <div className="flex gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Vendor</p>
                        <p className="text-sm font-medium text-foreground">{assessment.vendor.name}</p>
                        {assessment.vendor.contact_email && (
                          <p className="text-xs text-muted-foreground">{assessment.vendor.contact_email}</p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Created</p>
                      <p className="text-sm font-medium text-foreground">{formatDate(assessment.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <BarChart3 className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-0.5">Overall Score</p>
                      <p className="text-2xl font-bold font-mono text-primary">
                        {assessment.overall_score?.toFixed(1) || '0.0'}%
                      </p>
                    </div>
                  </div>
                  {assessment.description && (
                    <div className="pt-4 border-t">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{assessment.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions for Vendor Assessments */}
              {assessment.assessment_type === 'vendor' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!invitation ? (
                      <Button className="w-full" onClick={() => setShowInviteDialog(true)}>
                        <Link2 className="h-4 w-4 mr-2" />
                        Create Vendor Link
                      </Button>
                    ) : (
                      <>
                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <span className="text-sm text-muted-foreground">Invitation Status</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${invitationBadgeClass(invitation.invitation_status)}`}>
                            {invitation.invitation_status}
                          </span>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setShowVendorLink(!showVendorLink)}>
                          <Link2 className="h-4 w-4 mr-2" />
                          {showVendorLink ? 'Hide' : 'Show'} Vendor Link
                        </Button>
                        {invitation.invitation_status === 'completed' && (
                          <Link to={`/assessments/${id}/comparison`}>
                            <Button variant="outline" className="w-full">
                              <GitCompare className="h-4 w-4 mr-2" />
                              View Comparison
                            </Button>
                          </Link>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Function Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Score by Function</CardTitle>
            </CardHeader>
            <CardContent>
              <FunctionScoreChart
                functions={functions.map((func) => ({
                  code: func.name.substring(0, 2).toUpperCase(),
                  name: func.name,
                  score: assessment.overall_score ?? 0,
                }))}
              />
            </CardContent>
          </Card>

          {/* Assessment Tools */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Assessment Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: ClipboardList, title: 'Data Collection Wizard', description: 'Step-by-step guided assessment data collection', to: `/assessments/${id}/wizard` },
                { icon: CheckSquare, title: 'Compliance Checklist', description: 'Review all subcategories and their compliance status', to: `/assessments/${id}/checklist` },
                { icon: FileText, title: 'Assessment Report', description: 'Generate and view the full assessment report', to: `/assessments/${id}/report` },
              ].map((card) => {
                const CardIcon = card.icon;
                return (
                  <Link key={card.title} to={card.to}>
                    <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer h-full">
                      <CardContent className="flex flex-col items-center text-center p-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                          <CardIcon className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-1.5">{card.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="mt-6 space-y-6">
          {/* Function Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-2 overflow-x-auto">
                {functions.map((func) => (
                  <Button
                    key={func.id}
                    size="sm"
                    variant={selectedFunction === func.id ? 'default' : 'outline'}
                    onClick={() => setSelectedFunction(func.id)}
                    className="whitespace-nowrap"
                  >
                    {func.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <h3 className="font-mono font-semibold text-foreground">{item.subcategory?.id}</h3>
                      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.subcategory?.description}</p>
                      {item.ai_suggested_status && (
                        <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <p className="text-sm font-medium text-primary flex items-center gap-1.5">
                            <Brain className="h-4 w-4" />
                            AI Suggestion: <strong>{item.ai_suggested_status}</strong>
                            ({(item.ai_confidence_score! * 100).toFixed(0)}% confidence)
                          </p>
                          {item.ai_reasoning && (
                            <p className="text-xs text-muted-foreground mt-1.5">{item.ai_reasoning}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium flex-shrink-0 ${statusBadgeClass(item.status || 'not_assessed')}`}>
                      {statusLabel(item.status || 'not_assessed')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
                      <Select
                        value={item.status || 'not_assessed'}
                        onValueChange={(v) => handleStatusChange(item.id, v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_assessed">Not Assessed</SelectItem>
                          <SelectItem value="compliant">Compliant</SelectItem>
                          <SelectItem value="partial">Partially Compliant</SelectItem>
                          <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                          <SelectItem value="not_applicable">Not Applicable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Evidence Upload</label>
                        <label className="flex items-center justify-center gap-2 w-full px-3 py-2 border rounded-md text-sm font-medium text-muted-foreground hover:bg-accent cursor-pointer transition-colors">
                          <Upload className="h-4 w-4" />
                          {uploadingFor === item.id ? 'Uploading...' : 'Upload File'}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(item.id, e.target.files[0])}
                            disabled={uploadingFor === item.id}
                          />
                        </label>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAnalyze(item)}
                        disabled={analyzingItem === item.id}
                        className="flex-shrink-0"
                      >
                        <Brain className="h-4 w-4 mr-1.5" />
                        {analyzingItem === item.id ? 'Analyzing...' : 'AI Analyze'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Vendor Responses Tab */}
        <TabsContent value="vendor" className="mt-6">
          {assessment.assessment_type !== 'vendor' ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-5">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Not a Vendor Assessment</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Vendor responses are only available for vendor assessments.
                </p>
              </CardContent>
            </Card>
          ) : !invitation ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                  <Link2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Vendor Invitation Sent</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  Create a vendor link to allow {assessment.vendor?.name || 'the vendor'} to complete their self-assessment.
                </p>
                <Button onClick={() => setShowInviteDialog(true)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Create Vendor Link
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-5">
              {/* Vendor Link Display */}
              {showVendorLink && (
                <Card className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-foreground mb-2">Vendor Assessment Link</h3>
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      Share this link with {assessment.vendor?.name || 'the vendor'}. Valid until {formatDate(invitation.token_expires_at)}.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/vendor-portal/${invitation.access_token}`}
                        readOnly
                        onClick={(e) => e.currentTarget.select()}
                        className="flex-1 px-3 py-2 text-sm font-mono border rounded-md bg-muted/50 outline-none"
                      />
                      <Button variant="outline" onClick={handleCopyLink} className="flex-shrink-0">
                        <Copy className="h-4 w-4 mr-2" />
                        {copiedLink ? 'Copied!' : 'Copy Link'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invitation Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Invitation Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${invitationBadgeClass(invitation.invitation_status)}`}>
                        {invitation.invitation_status}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Sent</p>
                      <p className="text-sm font-medium text-foreground">{formatDate(invitation.sent_at)}</p>
                    </div>
                    {invitation.accessed_at && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">First Accessed</p>
                        <p className="text-sm font-medium text-foreground">{formatDate(invitation.accessed_at)}</p>
                      </div>
                    )}
                    {invitation.completed_at && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Completed</p>
                        <p className="text-sm font-medium text-foreground">{formatDate(invitation.completed_at)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Expires</p>
                      <p className="text-sm font-medium text-foreground">{formatDate(invitation.token_expires_at)}</p>
                    </div>
                  </div>
                  {invitation.message && (
                    <div className="mt-5 pt-5 border-t">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Custom Message</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{invitation.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-5">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Activity History Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Track all changes, updates, and actions performed on this assessment.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InviteVendorDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        onSend={handleSendInvitation}
        assessmentId={id || ''}
        assessmentName={assessment?.name || ''}
        vendorEmail={assessment?.vendor?.contact_email}
        vendorName={assessment?.vendor?.name}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Assessment?"
        description="This will permanently delete this assessment and all associated items and evidence. This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
