/**
 * TypeScript types for CSF Compass Frontend
 * Matches the database schema from Worker API
 */

export interface Organization {
  id: string;
  name: string;
  industry?: string;
  size?: string;
  description?: string;
  created_at: number;
  updated_at: number;
}

export interface Profile {
  id: string;
  organization_id?: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: number;
  updated_at: number;
}

export interface Vendor {
  id: string;
  organization_id: string;
  name: string;
  industry?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  description?: string;
  risk_level?: 'low' | 'medium' | 'high';
  risk_tier?: 'low' | 'medium' | 'high' | 'critical';
  criticality_level?: 'low' | 'medium' | 'high' | 'critical';
  vendor_status?: 'active' | 'inactive' | 'under_review' | 'terminated';
  risk_score?: number;
  last_assessment_date?: number;
  next_assessment_due?: number;
  notes?: string;
  created_by?: string;
  created_at: number;
  updated_at: number;
  // Computed fields from stats
  latest_assessment_score?: number;
  open_findings?: number;
}

export interface Assessment {
  id: string;
  organization_id: string;
  assessment_type: 'organization' | 'vendor';
  vendor_id?: string;
  template_id?: string;
  name: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  overall_score?: number;
  started_at?: number;
  completed_at?: number;
  created_by?: string;
  created_at: number;
  updated_at: number;
  vendor?: Vendor;
  stats?: AssessmentStats;
}

export interface AssessmentStats {
  total: number;
  compliant: number;
  partial: number;
  nonCompliant: number;
  notAssessed: number;
  notApplicable: number;
  assessed: number;
  completionPercentage: number;
}

export interface CsfFunction {
  id: string;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CsfCategory {
  id: string;
  function_id: string;
  name: string;
  description?: string;
  sort_order: number;
}

export interface CsfSubcategory {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  sort_order: number;
}

export interface AssessmentItem {
  id: string;
  assessment_id: string;
  subcategory_id: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'not_applicable';
  notes?: string;
  evidence_summary?: string;
  ai_suggested_status?: string;
  ai_confidence_score?: number;
  ai_reasoning?: string;
  ai_analyzed_at?: number;
  created_at: number;
  updated_at: number;
  subcategory?: {
    id: string;
    name: string;
    description?: string;
    priority: string;
    category_id: string;
  };
  category?: {
    id: string;
    name: string;
    function_id: string;
  };
  function?: {
    id: string;
    name: string;
  };
}

export interface EvidenceFile {
  id: string;
  assessment_id: string;
  assessment_item_id?: string;
  wizard_step?: number;
  file_name: string;
  file_size: number;
  file_type?: string;
  r2_key: string;
  uploaded_by?: string;
  uploaded_at?: number;
  created_at: number;
  download_url?: string;
}

export interface GapRecommendation {
  id: string;
  assessment_id: string;
  assessment_item_id?: string;
  title: string;
  description: string;
  priority: 'quick_win' | 'medium_term' | 'long_term';
  effort?: 'low' | 'medium' | 'high';
  impact?: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'completed' | 'dismissed';
  created_at: number;
  updated_at: number;
}

export interface ExecutiveSummary {
  id: string;
  assessment_id: string;
  summary_text: string;
  maturity_tier?: number;
  top_strengths?: string; // JSON string
  top_gaps?: string; // JSON string
  generated_at?: number;
  created_at: number;
  updated_at: number;
}

export interface WizardProgress {
  id: string;
  assessment_id: string;
  step_number: number;
  step_name: string;
  notes?: string;
  is_complete: boolean;
  completion_percentage?: number;
  last_saved_at?: number;
  created_at: number;
  updated_at: number;
}

// API Response types
export interface ApiError {
  error: string;
  message?: string;
}

export interface VendorStats {
  vendor: Vendor;
  totalAssessments: number;
  completedAssessments: number;
  inProgressAssessments: number;
  averageScore: number | null;
  latestAssessment: Assessment | null;
}

// API Request types
export interface CreateAssessmentData {
  organization_id: string;
  vendor_id?: string;
  name: string;
  description?: string;
  type: 'organization' | 'vendor';
}

export interface UpdateAssessmentData {
  name?: string;
  description?: string;
  status?: 'draft' | 'in_progress' | 'completed' | 'archived';
}

export interface UpdateAssessmentItemData {
  status?: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'not_applicable';
  notes?: string;
  evidence_summary?: string;
}

// Vendor Self-Assessment Invitation types
export interface VendorAssessmentInvitation {
  id: string;
  organization_assessment_id: string;
  vendor_self_assessment_id: string | null;
  vendor_id: string;
  organization_id: string;
  vendor_contact_email: string;
  vendor_contact_name: string | null;
  access_token: string;
  token_expires_at: number;
  token_consumed_at?: number | null;
  session_token?: string | null;
  session_expires_at?: number | null;
  revoked_at?: number | null;
  revoked_by?: string | null;
  invitation_status: 'pending' | 'accessed' | 'completed' | 'expired' | 'revoked';
  sent_at: number;
  accessed_at: number | null;
  last_accessed_at: number | null;
  completed_at: number | null;
  message: string | null;
  created_at: number;
  updated_at: number;
}

export interface SendInvitationData {
  organization_assessment_id: string;
  vendor_contact_email: string;
  vendor_contact_name?: string;
  message?: string;
  token_expiry_days?: number;
}

export interface SendInvitationResponse {
  invitation_id: string;
  magic_link: string;
  expires_at: number;
  vendor_email: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  invitation?: VendorAssessmentInvitation;
  assessment?: Assessment;
  vendor_contact_name?: string;
  error?: string;
}

export interface ComparisonItem {
  subcategory_id: string;
  subcategory: CsfSubcategory | null;
  category: CsfCategory | null;
  function: CsfFunction | null;
  org_item: AssessmentItem;
  vendor_item: AssessmentItem | null;
  matches: boolean;
  difference: string | null;
}

export interface ComparisonData {
  organization_assessment: Assessment;
  vendor_self_assessment: Assessment | null;
  invitation: VendorAssessmentInvitation | null;
  comparison_items: ComparisonItem[];
}
