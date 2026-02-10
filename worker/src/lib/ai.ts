/**
 * AI Client for Anthropic Claude API
 *
 * Handles:
 * - Evidence analysis for subcategories
 * - Gap recommendations generation
 * - Executive summary generation
 */

import Anthropic from '@anthropic-ai/sdk';

// Default model configuration
export const AI_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4000,
  temperature: 0.3,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface AIAnalysisResult {
  suggestedStatus: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
  confidenceScore: number;
  reasoning: string;
  gaps: string[];
  recommendations: string[];
}

export interface AIRecommendation {
  title: string;
  description: string;
  priority: 'quick_win' | 'medium_term' | 'long_term';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  relatedSubcategories: string[];
}

export interface AIExecutiveSummary {
  summary: string;
  overallMaturityTier: number;
  topStrengths: string[];
  topGaps: string[];
  priorityActions: string[];
  riskAssessment: string;
}

// ============================================================================
// EVIDENCE ANALYSIS
// ============================================================================

export interface AnalyzeEvidenceInput {
  subcategoryCode: string;
  subcategoryDescription: string;
  evidenceNotes: string;
  fileNames: string[];
  currentStatus: string;
}

export async function analyzeEvidence(
  apiKey: string,
  input: AnalyzeEvidenceInput
): Promise<AIAnalysisResult> {
  const client = new Anthropic({ apiKey });

  const prompt = `You are a NIST Cybersecurity Framework 2.0 compliance expert. Analyze the evidence provided for the following subcategory and determine the compliance status.

## Subcategory Information
- **Code**: ${input.subcategoryCode}
- **Description**: ${input.subcategoryDescription}
- **Current Status**: ${input.currentStatus}

## Evidence Provided
### Notes:
${input.evidenceNotes || 'No notes provided'}

### Uploaded Files:
${input.fileNames.length > 0 ? input.fileNames.map((f) => `- ${f}`).join('\n') : 'No files uploaded'}

## Your Task
Based on the evidence provided, analyze the compliance level and provide:
1. A suggested compliance status (compliant, partial, non_compliant, or not_assessed)
2. A confidence score from 0 to 1 (how confident you are in your assessment)
3. Clear reasoning for your assessment
4. Specific gaps identified (what's missing or needs improvement)
5. Actionable recommendations to achieve or maintain compliance

## Response Format
Respond in JSON format only, with this exact structure:
{
  "suggestedStatus": "compliant" | "partial" | "non_compliant" | "not_assessed",
  "confidenceScore": 0.0-1.0,
  "reasoning": "Your detailed reasoning here",
  "gaps": ["Gap 1", "Gap 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}

Important:
- Be conservative in your assessment - only mark as "compliant" if there's strong evidence
- Consider industry best practices and NIST CSF 2.0 requirements
- Provide specific, actionable recommendations
- If evidence is insufficient, suggest what additional evidence would help`;

  try {
    const response = await client.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const result = JSON.parse(jsonMatch[0]) as AIAnalysisResult;
    return result;
  } catch (error) {
    console.error('AI analysis error:', error);
    throw error;
  }
}

// ============================================================================
// GAP RECOMMENDATIONS
// ============================================================================

export interface GenerateRecommendationsInput {
  assessmentItems: {
    subcategoryCode: string;
    subcategoryDescription: string;
    functionCode: string;
    functionName: string;
    status: string;
    notes?: string;
  }[];
  organizationInfo?: {
    name: string;
    industry: string;
    size: string;
  };
}

export async function generateRecommendations(
  apiKey: string,
  input: GenerateRecommendationsInput
): Promise<AIRecommendation[]> {
  const client = new Anthropic({ apiKey });

  // Group items by status
  const nonCompliantItems = input.assessmentItems.filter(
    (i) => i.status === 'non_compliant'
  );
  const partialItems = input.assessmentItems.filter((i) => i.status === 'partial');

  const prompt = `You are a NIST Cybersecurity Framework 2.0 compliance expert. Based on the assessment results provided, generate prioritized recommendations to improve the organization's cybersecurity posture.

## Organization Context
${
  input.organizationInfo
    ? `- Name: ${input.organizationInfo.name}
- Industry: ${input.organizationInfo.industry}
- Size: ${input.organizationInfo.size}`
    : 'No organization information provided'
}

## Assessment Results Summary
- Total Non-Compliant Items: ${nonCompliantItems.length}
- Total Partial Items: ${partialItems.length}

## Non-Compliant Items (Priority Focus)
${nonCompliantItems
  .slice(0, 20)
  .map((i) => `- **${i.subcategoryCode}** (${i.functionCode}): ${i.subcategoryDescription}`)
  .join('\n')}

## Partial Items
${partialItems
  .slice(0, 15)
  .map((i) => `- **${i.subcategoryCode}** (${i.functionCode}): ${i.subcategoryDescription}`)
  .join('\n')}

## Your Task
Generate 10-15 prioritized recommendations that address the most critical gaps. For each recommendation:
1. Provide a clear, actionable title
2. Detailed description of what needs to be done
3. Priority classification (quick_win, medium_term, long_term)
4. Effort required (low, medium, high)
5. Impact on security posture (low, medium, high)
6. Related subcategory codes

## Response Format
Respond in JSON format only, with this exact structure:
{
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": "quick_win" | "medium_term" | "long_term",
      "effort": "low" | "medium" | "high",
      "impact": "low" | "medium" | "high",
      "relatedSubcategories": ["GV.OC-01", "PR.AA-02"]
    }
  ]
}

Prioritization Guidelines:
- quick_win: Low effort, high impact - implement within 1-2 weeks
- medium_term: Medium effort/impact - implement within 1-3 months
- long_term: High effort, strategic - implement within 6-12 months`;

  try {
    const response = await client.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const result = JSON.parse(jsonMatch[0]);
    return result.recommendations as AIRecommendation[];
  } catch (error) {
    console.error('AI recommendation generation error:', error);
    throw error;
  }
}

// ============================================================================
// EXECUTIVE SUMMARY
// ============================================================================

export interface GenerateExecutiveSummaryInput {
  organizationName: string;
  industry: string;
  overallScore: number;
  functionScores: {
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
  topGaps: {
    subcategoryCode: string;
    description: string;
    functionCode: string;
  }[];
}

export async function generateExecutiveSummary(
  apiKey: string,
  input: GenerateExecutiveSummaryInput
): Promise<AIExecutiveSummary> {
  const client = new Anthropic({ apiKey });

  const prompt = `You are a NIST Cybersecurity Framework 2.0 compliance expert. Generate an executive summary for the following assessment results.

## Organization
- **Name**: ${input.organizationName}
- **Industry**: ${input.industry}

## Overall Compliance Score
**${input.overallScore}%**

## Score by Function
${input.functionScores
  .map(
    (f) =>
      `- **${f.code} (${f.name})**: ${f.score}% (${f.compliant} compliant, ${f.partial} partial, ${f.non_compliant} non-compliant out of ${f.total})`
  )
  .join('\n')}

## Compliance Distribution
- Compliant: ${input.distribution.compliant}
- Partial: ${input.distribution.partial}
- Non-Compliant: ${input.distribution.non_compliant}
- Not Assessed: ${input.distribution.not_assessed}
- Not Applicable: ${input.distribution.not_applicable}

## Top Gaps (Non-Compliant Items)
${input.topGaps
  .slice(0, 10)
  .map((g) => `- **${g.subcategoryCode}** (${g.functionCode}): ${g.description}`)
  .join('\n')}

## Your Task
Generate a comprehensive executive summary that includes:
1. A 2-3 paragraph summary suitable for C-level executives
2. Overall maturity tier (1-4 based on NIST CSF)
3. Top 5 organizational strengths
4. Top 5 critical gaps that need attention
5. 5 priority actions for the next quarter
6. Brief risk assessment

## Response Format
Respond in JSON format only:
{
  "summary": "Executive summary paragraphs here...",
  "overallMaturityTier": 1-4,
  "topStrengths": ["Strength 1", "Strength 2", "Strength 3", "Strength 4", "Strength 5"],
  "topGaps": ["Gap 1", "Gap 2", "Gap 3", "Gap 4", "Gap 5"],
  "priorityActions": ["Action 1", "Action 2", "Action 3", "Action 4", "Action 5"],
  "riskAssessment": "Brief risk assessment paragraph"
}

Maturity Tier Guidelines:
- Tier 1 (Partial): 0-25% - Risk management not formalized
- Tier 2 (Risk Informed): 26-50% - Practices approved but not policy
- Tier 3 (Repeatable): 51-75% - Formalized and documented
- Tier 4 (Adaptive): 76-100% - Continuously improving`;

  try {
    const response = await client.messages.create({
      model: AI_CONFIG.model,
      max_tokens: AI_CONFIG.maxTokens,
      temperature: AI_CONFIG.temperature,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const result = JSON.parse(jsonMatch[0]) as AIExecutiveSummary;
    return result;
  } catch (error) {
    console.error('AI executive summary error:', error);
    throw error;
  }
}
