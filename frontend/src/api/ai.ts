/**
 * AI Analysis API Service
 */

import { apiClient } from './client';
import type { GapRecommendation, ExecutiveSummary } from '../types';

export interface AnalyzeEvidenceRequest {
  assessment_item_id: string;
  subcategory_code: string;
  subcategory_description: string;
  evidence_notes: string;
  file_names: string[];
  current_status: string;
}

export interface AnalyzeEvidenceResponse {
  success: boolean;
  result: {
    suggestedStatus: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
    confidenceScore: number;
    reasoning: string;
    gaps: string[];
    recommendations: string[];
  };
  processingTime: number;
}

export interface GenerateRecommendationsRequest {
  assessment_id: string;
  organization_info?: {
    name: string;
    industry: string;
    size: string;
  };
}

export interface GenerateRecommendationsResponse {
  success: boolean;
  recommendations: GapRecommendation[];
  processingTime: number;
}

export interface GenerateExecutiveSummaryRequest {
  assessment_id: string;
  organization_name: string;
  industry: string;
  overall_score: number;
  function_scores: {
    code: string;
    name: string;
    score: number;
    compliant: number;
    partial: number;
    non_compliant: number;
    total: number;
  }[];
  distribution: {
    compliant: number;
    partial: number;
    non_compliant: number;
    not_assessed: number;
    not_applicable: number;
  };
  top_gaps: {
    subcategoryCode: string;
    description: string;
    functionCode: string;
  }[];
}

export interface GenerateExecutiveSummaryResponse {
  success: boolean;
  summary: ExecutiveSummary & {
    top_strengths: string[];
    top_gaps: string[];
  };
  processingTime: number;
}

export const aiApi = {
  /**
   * Analyze evidence for a subcategory
   */
  analyzeEvidence: async (
    request: AnalyzeEvidenceRequest
  ): Promise<AnalyzeEvidenceResponse> => {
    const response = await apiClient.post<AnalyzeEvidenceResponse>(
      '/api/ai/analyze',
      request
    );
    return response.data;
  },

  /**
   * Generate gap recommendations for an assessment
   */
  generateRecommendations: async (
    request: GenerateRecommendationsRequest
  ): Promise<GenerateRecommendationsResponse> => {
    const response = await apiClient.post<GenerateRecommendationsResponse>(
      '/api/ai/gap-analysis',
      request
    );
    return response.data;
  },

  /**
   * Generate executive summary for an assessment
   */
  generateExecutiveSummary: async (
    request: GenerateExecutiveSummaryRequest
  ): Promise<GenerateExecutiveSummaryResponse> => {
    const response = await apiClient.post<GenerateExecutiveSummaryResponse>(
      '/api/ai/executive-summary',
      request
    );
    return response.data;
  },
};
