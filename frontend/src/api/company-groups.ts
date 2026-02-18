import axios from 'axios';
import type { CompanyGroup, GroupSummary } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

const api = axios.create({ baseURL: API_URL });

export const companyGroupsApi = {
  list: (organizationId: string) =>
    api.get<CompanyGroup[]>('/api/company-groups', { params: { organization_id: organizationId } }),

  create: (data: { organization_id: string; name: string; description?: string; industry?: string }) =>
    api.post<CompanyGroup>('/api/company-groups', data),

  get: (id: string) =>
    api.get<CompanyGroup & { vendors: any[] }>(`/api/company-groups/${id}`),

  update: (id: string, data: Partial<CompanyGroup>) =>
    api.patch<CompanyGroup>(`/api/company-groups/${id}`, data),

  delete: (id: string) =>
    api.delete(`/api/company-groups/${id}`),

  getSummary: (id: string) =>
    api.get<GroupSummary>(`/api/company-groups/${id}/summary`),
};
