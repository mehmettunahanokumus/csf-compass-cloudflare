/**
 * Evidence API Service
 */

import { apiClient } from './client';
import type { EvidenceFile } from '../types';

export const evidenceApi = {
  /**
   * Upload evidence file
   */
  upload: async (
    file: File,
    assessmentId: string,
    assessmentItemId?: string
  ): Promise<EvidenceFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assessment_id', assessmentId);
    // organization_id and uploaded_by are derived from the auth session cookie

    if (assessmentItemId) {
      formData.append('assessment_item_id', assessmentItemId);
    }

    const response = await apiClient.post<EvidenceFile>('/api/evidence/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  /**
   * Delete evidence file
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/evidence/${id}`);
  },

  /**
   * Get evidence files for an assessment item
   */
  getForItem: async (itemId: string): Promise<EvidenceFile[]> => {
    const response = await apiClient.get<EvidenceFile[]>(`/api/evidence/item/${itemId}`);
    return response.data;
  },

  /**
   * Get all evidence files for an assessment
   */
  getForAssessment: async (assessmentId: string): Promise<EvidenceFile[]> => {
    const response = await apiClient.get<EvidenceFile[]>(
      `/api/evidence/assessment/${assessmentId}`
    );
    return response.data;
  },

  /**
   * Get download URL for evidence file (returns the full URL from API response)
   */
  getDownloadUrl: (downloadUrl: string): string => {
    // If download_url is relative, prepend API base
    if (downloadUrl.startsWith('/')) {
      return `${apiClient.defaults.baseURL}${downloadUrl}`;
    }
    return downloadUrl;
  },
};
