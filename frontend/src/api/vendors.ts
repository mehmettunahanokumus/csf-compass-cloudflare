/**
 * Vendors API Service
 */

import { apiClient } from './client';
import type { Vendor, VendorStats, TieringResponse } from '../types';

export interface CreateVendorData {
  name: string;
  industry?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  criticality_level?: 'low' | 'medium' | 'high' | 'critical';
  vendor_status?: 'active' | 'inactive' | 'under_review' | 'terminated';
  notes?: string;
  group_id?: string;
}

export interface UpdateVendorData {
  name?: string;
  industry?: string;
  website?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  criticality_level?: 'low' | 'medium' | 'high' | 'critical';
  vendor_status?: 'active' | 'inactive' | 'under_review' | 'terminated';
  notes?: string;
}

export const vendorsApi = {
  /**
   * List vendors for organization (external only, excludes group subsidiaries)
   */
  list: async (): Promise<Vendor[]> => {
    const response = await apiClient.get<Vendor[]>('/api/vendors', {
      params: { exclude_grouped: 'true' },
    });
    return response.data;
  },

  /**
   * List ALL vendors including group subsidiaries (used for New Assessment step 2)
   */
  listAll: async (): Promise<Vendor[]> => {
    const response = await apiClient.get<Vendor[]>('/api/vendors', {
      params: {},
    });
    return response.data;
  },

  /**
   * Get vendor by ID
   */
  get: async (id: string): Promise<Vendor> => {
    const response = await apiClient.get<Vendor>(`/api/vendors/${id}`);
    return response.data;
  },

  /**
   * Create new vendor
   */
  create: async (data: CreateVendorData): Promise<Vendor> => {
    const response = await apiClient.post<Vendor>('/api/vendors', {
      ...data,
    });
    return response.data;
  },

  /**
   * Update vendor
   */
  update: async (id: string, data: UpdateVendorData): Promise<Vendor> => {
    const response = await apiClient.patch<Vendor>(`/api/vendors/${id}`, data);
    return response.data;
  },

  /**
   * Delete vendor
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/vendors/${id}`);
  },

  /**
   * Get vendor statistics
   */
  getStats: async (id: string): Promise<VendorStats> => {
    const response = await apiClient.get<VendorStats>(`/api/vendors/${id}/stats`);
    return response.data;
  },

  /**
   * Get vendor tiering info and questions
   */
  getTiering: async (vendorId: string): Promise<TieringResponse> => {
    const response = await apiClient.get<TieringResponse>(`/api/vendors/${vendorId}/tiering`);
    return response.data;
  },

  /**
   * Submit vendor tiering answers
   */
  submitTiering: async (vendorId: string, answers: Record<string, number>): Promise<Vendor> => {
    const response = await apiClient.post<Vendor>(`/api/vendors/${vendorId}/tiering`, { answers });
    return response.data;
  },
};
