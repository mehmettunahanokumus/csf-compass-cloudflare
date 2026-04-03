/**
 * Vendor Invitations API Client
 * Handles vendor self-assessment invitation management
 */

import { apiClient } from './client';
import type {
  SendInvitationData,
  SendInvitationResponse,
  ValidateTokenResponse,
  ComparisonData,
  VendorAssessmentInvitation,
  UpdateAssessmentItemData,
  AssessmentItem,
  ConsolidatedViewResponse,
  ConsolidatedAnswerResponse,
  EvidenceFile,
  VendorPortalStats,
  VendorPortalExportData,
  AIAnalysisResult,
  AIRecommendation,
  AIExecutiveSummary,
} from '../types';

// Create a separate axios instance with credentials for vendor portal endpoints
import axios from 'axios';
import { API_BASE_URL } from './client';

const vendorApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CRITICAL: Enable cookies for session management
  timeout: 30000,
});

export const vendorInvitationsApi = {
  /**
   * Send assessment invitation to vendor
   */
  async send(data: SendInvitationData): Promise<SendInvitationResponse> {
    const response = await apiClient.post<SendInvitationResponse>(
      '/api/vendor-invitations',
      data
    );
    return response.data;
  },

  /**
   * Validate token and load vendor assessment (public endpoint)
   * Uses withCredentials to receive session cookie
   */
  async validate(token: string): Promise<ValidateTokenResponse> {
    const response = await vendorApiClient.get<ValidateTokenResponse>(
      `/api/vendor-invitations/validate/${token}`
    );
    return response.data;
  },

  /**
   * Get all assessment items for vendor (public endpoint with session cookie auth)
   */
  async getItems(token: string): Promise<AssessmentItem[]> {
    const response = await vendorApiClient.get<{ items: AssessmentItem[] }>(
      `/api/vendor-invitations/${token}/items`
    );
    return response.data.items;
  },

  /**
   * Update vendor assessment item (public endpoint with session cookie auth)
   */
  async updateItem(
    token: string,
    itemId: string,
    data: UpdateAssessmentItemData
  ): Promise<AssessmentItem> {
    const response = await vendorApiClient.patch<AssessmentItem>(
      `/api/vendor-invitations/${token}/items/${itemId}`,
      data
    );
    return response.data;
  },

  /**
   * Mark vendor self-assessment as complete (public endpoint with session cookie auth)
   */
  async complete(token: string, respondentName?: string): Promise<{ success: boolean; completed_at: number }> {
    const response = await vendorApiClient.post<{ success: boolean; completed_at: number }>(
      `/api/vendor-invitations/${token}/complete`,
      respondentName ? { respondent_name: respondentName } : undefined
    );
    return response.data;
  },

  /**
   * Get comparison data between org assessment and vendor self-assessment
   * Requires organization authentication
   */
  async getComparison(organizationAssessmentId: string): Promise<ComparisonData> {
    const response = await apiClient.get<ComparisonData>(
      `/api/vendor-invitations/${organizationAssessmentId}/comparison`,
    );
    return response.data;
  },

  /**
   * Get invitation for organization assessment
   * Returns null if no invitation exists
   */
  async getInvitation(assessmentId: string): Promise<VendorAssessmentInvitation | null> {
    try {
      const response = await apiClient.get<VendorAssessmentInvitation | null>(
        `/api/vendor-invitations/assessments/${assessmentId}/invitation`
      );
      return response.data;
    } catch (error) {
      // Return null if not found
      return null;
    }
  },

  /**
   * Revoke vendor invitation magic link
   */
  async revoke(invitationId: string): Promise<{ success: boolean; revoked_at: number }> {
    const response = await apiClient.post<{ success: boolean; revoked_at: number }>(
      `/api/vendor-invitations/${invitationId}/revoke`
    );
    return response.data;
  },

  /**
   * Get consolidated questions view for vendor portal
   */
  async getConsolidatedView(token: string): Promise<ConsolidatedViewResponse> {
    const response = await vendorApiClient.get<ConsolidatedViewResponse>(
      `/api/vendor-invitations/${token}/consolidated`
    );
    return response.data;
  },

  /**
   * Submit a consolidated question answer (maturity level)
   */
  async submitConsolidatedAnswer(
    token: string,
    data: { consolidated_question_id: string; maturity_level: number; notes?: string }
  ): Promise<ConsolidatedAnswerResponse> {
    const response = await vendorApiClient.post<ConsolidatedAnswerResponse>(
      `/api/vendor-invitations/${token}/consolidated-answer`,
      data
    );
    return response.data;
  },

  /**
   * Upload evidence file from vendor portal
   */
  async uploadEvidence(token: string, file: File, assessmentItemId?: string): Promise<EvidenceFile> {
    const formData = new FormData();
    formData.append('file', file);
    if (assessmentItemId) formData.append('assessment_item_id', assessmentItemId);
    const response = await vendorApiClient.post<EvidenceFile>(
      `/api/vendor-invitations/${token}/evidence/upload`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
    );
    return response.data;
  },

  /**
   * Get evidence files for a specific assessment item (vendor portal)
   */
  async getEvidenceForItem(token: string, itemId: string): Promise<EvidenceFile[]> {
    const response = await vendorApiClient.get<{ files: EvidenceFile[] }>(
      `/api/vendor-invitations/${token}/evidence/item/${itemId}`
    );
    return response.data.files;
  },

  /**
   * Delete evidence file from vendor portal
   */
  async deleteEvidence(token: string, evidenceId: string): Promise<void> {
    await vendorApiClient.delete(`/api/vendor-invitations/${token}/evidence/${evidenceId}`);
  },

  // ========================================================================
  // Phase 3: Export
  // ========================================================================

  /**
   * Get assessment statistics for the vendor portal
   */
  async getStats(token: string): Promise<VendorPortalStats> {
    const response = await vendorApiClient.get<VendorPortalStats>(
      `/api/vendor-invitations/${token}/stats`
    );
    return response.data;
  },

  /**
   * Get full export data (items + stats) for client-side PDF/Excel/CSV generation
   */
  async getExportData(token: string): Promise<VendorPortalExportData> {
    const response = await vendorApiClient.get<VendorPortalExportData>(
      `/api/vendor-invitations/${token}/export-data`
    );
    return response.data;
  },

  // ========================================================================
  // Phase 4: AI Analysis
  // ========================================================================

  /**
   * AI analysis for a specific assessment item
   */
  async analyzeItem(
    token: string,
    data: {
      assessment_item_id?: string;
      subcategory_code: string;
      subcategory_description?: string;
      evidence_notes?: string;
      file_names?: string[];
      current_status: string;
    }
  ): Promise<{ success: boolean; result: AIAnalysisResult }> {
    const response = await vendorApiClient.post<{ success: boolean; result: AIAnalysisResult }>(
      `/api/vendor-invitations/${token}/ai/analyze`,
      data
    );
    return response.data;
  },

  /**
   * AI gap analysis for the full vendor assessment
   */
  async requestGapAnalysis(token: string): Promise<{ success: boolean; recommendations: AIRecommendation[] }> {
    const response = await vendorApiClient.post<{ success: boolean; recommendations: AIRecommendation[] }>(
      `/api/vendor-invitations/${token}/ai/gap-analysis`
    );
    return response.data;
  },

  /**
   * AI executive summary for the vendor assessment
   */
  async requestExecutiveSummary(
    token: string,
    data: {
      organization_name?: string;
      overall_score: number;
      function_scores: Array<{ code: string; name: string; score: number; compliant: number; partial: number; non_compliant: number; total: number }>;
      distribution: { compliant: number; partial: number; non_compliant: number; not_assessed: number; not_applicable: number };
      top_gaps: Array<{ subcategoryCode: string; description: string; functionCode: string }>;
    }
  ): Promise<{ success: boolean; summary: AIExecutiveSummary }> {
    const response = await vendorApiClient.post<{ success: boolean; summary: AIExecutiveSummary }>(
      `/api/vendor-invitations/${token}/ai/executive-summary`,
      data
    );
    return response.data;
  },
};
