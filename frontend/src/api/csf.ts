/**
 * CSF Reference Data API Service
 */

import { apiClient } from './client';
import type { CsfFunction, CsfCategory, CsfSubcategory } from '../types';

export const csfApi = {
  /**
   * Get all CSF functions
   */
  getFunctions: async (): Promise<CsfFunction[]> => {
    const response = await apiClient.get<CsfFunction[]>('/api/csf/functions');
    return response.data;
  },

  /**
   * Get CSF categories (optionally filtered by function)
   */
  getCategories: async (functionId?: string): Promise<CsfCategory[]> => {
    const params = functionId ? { functionId } : undefined;
    const response = await apiClient.get<CsfCategory[]>('/api/csf/categories', { params });
    return response.data;
  },

  /**
   * Get CSF subcategories (optionally filtered by category)
   */
  getSubcategories: async (categoryId?: string): Promise<CsfSubcategory[]> => {
    const params = categoryId ? { categoryId } : undefined;
    const response = await apiClient.get<CsfSubcategory[]>('/api/csf/subcategories', { params });
    return response.data;
  },

  /**
   * Get specific subcategory by ID
   */
  getSubcategory: async (id: string): Promise<CsfSubcategory> => {
    const response = await apiClient.get<CsfSubcategory>(`/api/csf/subcategories/${id}`);
    return response.data;
  },
};
