import axios from 'axios';
import type { ImportPreview } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const api = axios.create({ baseURL: API_URL });

export interface ImportItem {
  subcategory_id: string;
  status: string;
  notes?: string;
}

export interface ImportCompany {
  name: string;
  items: ImportItem[];
}

export interface ImportPayload {
  organization_id: string;
  group_name: string;
  group_description?: string;
  companies: ImportCompany[];
  assessment_name: string;
  assessment_date?: string;
}

export const importApi = {
  preview: (payload: ImportPayload) =>
    api.post<ImportPreview>('/api/import/preview', payload),

  confirm: (payload: ImportPayload) =>
    api.post('/api/import/confirm', payload),
};
