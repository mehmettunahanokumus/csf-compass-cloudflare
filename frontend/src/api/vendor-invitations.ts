/**
 * Vendor Invitations API Client
 * Handles vendor self-assessment invitation management
 */

import { apiClient, DEMO_ORG_ID } from './client';
import type {
  SendInvitationData,
  SendInvitationResponse,
  ValidateTokenResponse,
  ComparisonData,
  VendorAssessmentInvitation,
  UpdateAssessmentItemData,
  AssessmentItem,
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
      {
        ...data,
        organization_id: DEMO_ORG_ID,
      }
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
  async complete(token: string): Promise<{ success: boolean; completed_at: number }> {
    const response = await vendorApiClient.post<{ success: boolean; completed_at: number }>(
      `/api/vendor-invitations/${token}/complete`
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
      {
        params: { organization_id: DEMO_ORG_ID },
      }
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
        `/api/vendor-invitations/assessments/${assessmentId}/invitation`,
        {
          params: { organization_id: DEMO_ORG_ID },
        }
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
};
