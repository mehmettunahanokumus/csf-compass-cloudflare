/**
 * Assessments API Service
 */

import { apiClient, DEMO_ORG_ID, DEMO_USER_ID } from './client';
import type { Assessment, AssessmentItem } from '../types';

export interface CreateAssessmentData {
  name: string;
  description?: string;
  assessment_type: 'organization' | 'vendor';
  vendor_id?: string;
  template_id?: string;
  status?: 'draft' | 'in_progress';
}

export interface UpdateAssessmentData {
  name?: string;
  description?: string;
  status?: 'draft' | 'in_progress' | 'completed' | 'archived';
  started_at?: number;
  completed_at?: number;
}

export interface UpdateAssessmentItemData {
  status?: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed' | 'not_applicable';
  notes?: string;
  evidence_summary?: string;
}

export const assessmentsApi = {
  /**
   * List assessments for organization
   */
  list: async (type?: 'organization' | 'vendor'): Promise<Assessment[]> => {
    const params: Record<string, string> = {
      organization_id: DEMO_ORG_ID,
    };

    if (type) {
      params.type = type;
    }

    const response = await apiClient.get<Assessment[]>('/api/assessments', { params });
    return response.data;
  },

  /**
   * Get assessment by ID
   */
  get: async (id: string): Promise<Assessment> => {
    const response = await apiClient.get<Assessment>(`/api/assessments/${id}`);
    return response.data;
  },

  /**
   * Create new assessment
   */
  create: async (data: CreateAssessmentData): Promise<Assessment> => {
    const response = await apiClient.post<Assessment>('/api/assessments', {
      ...data,
      organization_id: DEMO_ORG_ID,
      created_by: DEMO_USER_ID,
    });
    return response.data;
  },

  /**
   * Update assessment
   */
  update: async (id: string, data: UpdateAssessmentData): Promise<Assessment> => {
    const response = await apiClient.patch<Assessment>(`/api/assessments/${id}`, data);
    return response.data;
  },

  /**
   * Delete assessment
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/assessments/${id}`);
  },

  /**
   * Get assessment items with subcategory details
   */
  getItems: async (id: string, functionId?: string): Promise<AssessmentItem[]> => {
    const params = functionId ? { functionId } : undefined;
    const response = await apiClient.get<AssessmentItem[]>(
      `/api/assessments/${id}/items`,
      { params }
    );
    return response.data;
  },

  /**
   * Update assessment item
   */
  updateItem: async (
    assessmentId: string,
    itemId: string,
    data: UpdateAssessmentItemData
  ): Promise<AssessmentItem> => {
    const response = await apiClient.patch<AssessmentItem>(
      `/api/assessments/${assessmentId}/items/${itemId}`,
      data
    );
    return response.data;
  },

  /**
   * Recalculate assessment score
   */
  calculateScore: async (id: string): Promise<{ score: number }> => {
    const response = await apiClient.post<{ score: number }>(
      `/api/assessments/${id}/calculate-score`
    );
    return response.data;
  },
};
