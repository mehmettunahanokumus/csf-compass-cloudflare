import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, ClipboardList, Globe, Mail, User, Phone } from 'lucide-react';
import { vendorsApi } from '../api/vendors';
import { assessmentsApi } from '../api/assessments';
import type { Vendor, Assessment, VendorStats } from '../types';
import { getErrorMessage, formatDate } from '../api/client';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import RiskScoreIndicator from '../components/vendors/RiskScoreIndicator';
import CriticalityBadge from '../components/vendors/CriticalityBadge';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';

function getRiskBadgeClass(tier?: string) {
  switch (tier) {
    case 'critical':
    case 'high':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    case 'medium':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    case 'low':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getAssessmentStatusClass(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'in_progress':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export default function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    website: '',
    contact_email: '',
    contact_name: '',
    description: '',
    risk_level: 'medium' as 'low' | 'medium' | 'high',
    risk_tier: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [vendorData, statsData, assessmentsData] = await Promise.all([
        vendorsApi.get(id),
        vendorsApi.getStats(id),
        assessmentsApi.list('vendor'),
      ]);
      setVendor(vendorData);
      setStats(statsData);
      setAssessments(assessmentsData.filter((a) => a.vendor_id === id));
      setEditForm({
        name: vendorData.name,
        website: vendorData.website || '',
        contact_email: vendorData.contact_email || '',
        contact_name: vendorData.contact_name || '',
        description: vendorData.description || '',
        risk_level: vendorData.risk_level || 'medium',
        risk_tier: vendorData.risk_tier || 'medium',
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await vendorsApi.update(id, editForm);
      setEditing(false);
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await vendorsApi.delete(id);
      navigate('/vendors');
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
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Vendor not found'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex gap-4 items-start">
          <Link to="/vendors">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{vendor.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Added {formatDate(vendor.created_at)}
              {vendor.last_assessment_date && ` • Last assessed ${formatDate(vendor.last_assessment_date)}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${getRiskBadgeClass(vendor.risk_tier)}`}>
            {vendor.risk_tier || 'medium'} risk
          </span>
          {!editing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit2 className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Edit Form */}
      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Vendor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEdit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Vendor Name *</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-risk-tier">Risk Tier (Business Impact)</Label>
                  <Select
                    value={editForm.risk_tier}
                    onValueChange={(v) => setEditForm({ ...editForm, risk_tier: v as any })}
                  >
                    <SelectTrigger id="edit-risk-tier"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-risk-level">Risk Level (Technical)</Label>
                  <Select
                    value={editForm.risk_level}
                    onValueChange={(v) => setEditForm({ ...editForm, risk_level: v as any })}
                  >
                    <SelectTrigger id="edit-risk-level"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Contact Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.contact_email}
                    onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
                    placeholder="contact@vendor.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contact">Contact Name</Label>
                  <Input
                    id="edit-contact"
                    value={editForm.contact_name}
                    onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-desc">Description</Label>
                  <Textarea
                    id="edit-desc"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    placeholder="Brief description of the vendor's services..."
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button type="submit">Save Changes</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setEditForm({
                      name: vendor.name,
                      website: vendor.website || '',
                      contact_email: vendor.contact_email || '',
                      contact_name: vendor.contact_name || '',
                      description: vendor.description || '',
                      risk_level: vendor.risk_level || 'medium',
                      risk_tier: vendor.risk_tier || 'medium',
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Email</p>
                    {vendor.contact_email ? (
                      <a href={`mailto:${vendor.contact_email}`} className="text-sm font-medium text-primary hover:underline">
                        {vendor.contact_email}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not provided</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Website</p>
                    {vendor.website ? (
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                        {vendor.website}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not provided</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Phone</p>
                    {vendor.contact_phone ? (
                      <a href={`tel:${vendor.contact_phone}`} className="text-sm font-medium text-primary hover:underline">
                        {vendor.contact_phone}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not provided</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <User className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Contact Name</p>
                    <p className="text-sm font-medium text-foreground">{vendor.contact_name || 'Not provided'}</p>
                  </div>
                </div>
                {vendor.description && (
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{vendor.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Risk Score */}
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6 gap-4 h-full">
              <h3 className="text-sm font-semibold text-foreground">Risk Score</h3>
              <RiskScoreIndicator score={vendor.latest_assessment_score ?? 0} size="lg" />
              <CriticalityBadge level={(vendor.risk_tier || vendor.criticality_level || 'medium') as 'low' | 'medium' | 'high' | 'critical'} />
              {vendor.last_assessment_date && (
                <p className="text-xs text-muted-foreground">
                  Last assessed: {formatDate(vendor.last_assessment_date)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Assessments', value: stats.totalAssessments, className: 'text-primary' },
            { label: 'Completed', value: stats.completedAssessments, className: 'text-green-600' },
            { label: 'In Progress', value: stats.inProgressAssessments, className: 'text-blue-600' },
            { label: 'Avg Score', value: `${stats.averageScore?.toFixed(1) || '0.0'}%`, className: 'text-purple-600' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5 text-center">
                <p className={`text-3xl font-bold font-mono ${stat.className}`}>{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Assessment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assessment History</CardTitle>
          <Link to={`/assessments/new?vendor=${id}`}>
            <Button size="sm">
              <ClipboardList className="h-4 w-4 mr-1.5" />
              New Assessment
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-5">No assessments yet</p>
              <Link to={`/assessments/new?vendor=${id}`}>
                <Button>Create First Assessment</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.map((assessment) => (
                <Link key={assessment.id} to={`/assessments/${assessment.id}`} className="block">
                  <div className="flex justify-between items-start gap-4 p-4 border rounded-lg hover:border-primary/50 hover:shadow-sm transition-all">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{assessment.name}</h3>
                      {assessment.description && (
                        <p className="text-sm text-muted-foreground mt-0.5 truncate">{assessment.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Started {formatDate(assessment.created_at)}
                        {assessment.completed_at && ` • Completed ${formatDate(assessment.completed_at)}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getAssessmentStatusClass(assessment.status)}`}>
                        {assessment.status === 'in_progress' ? 'in progress' : assessment.status}
                      </span>
                      {assessment.overall_score != null && (
                        <span className="text-lg font-bold font-mono text-foreground">
                          {assessment.overall_score.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Vendor?"
        description="This will permanently delete this vendor and all associated assessments. This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
