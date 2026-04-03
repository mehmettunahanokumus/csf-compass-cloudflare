import { apiClient } from './client';
import type { CompanyGroup, GroupSummary } from '../types';

export const companyGroupsApi = {
  list: () =>
    apiClient.get<CompanyGroup[]>('/api/company-groups'),

  create: (data: { name: string; description?: string; industry?: string }) =>
    apiClient.post<CompanyGroup>('/api/company-groups', data),

  get: (id: string) =>
    apiClient.get<CompanyGroup & { vendors: any[] }>(`/api/company-groups/${id}`),

  update: (id: string, data: Partial<CompanyGroup>) =>
    apiClient.patch<CompanyGroup>(`/api/company-groups/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/api/company-groups/${id}`),

  getSummary: (id: string) =>
    apiClient.get<GroupSummary>(`/api/company-groups/${id}/summary`),
};
