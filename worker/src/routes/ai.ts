/**
 * AI Analysis Routes
 *
 * Anthropic Claude API integration endpoints:
 * - POST /api/ai/analyze - Analyze evidence for a subcategory
 * - POST /api/ai/gap-analysis - Generate gap recommendations
 * - POST /api/ai/executive-summary - Generate executive summary
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Env } from '../types/env';
import { createDbClient } from '../db/client';
import {
  assessment_items,
  ai_analysis_logs,
  gap_recommendations,
  executive_summaries,
  csf_subcategories,
  organizations,
} from '../db/schema';
import Anthropic from '@anthropic-ai/sdk';
import {
  AI_CONFIG,
  analyzeEvidence,
  generateRecommendations,
  generateExecutiveSummary,
} from '../lib/ai';

const app = new Hono<{ Bindings: Env }>();

/**
 * POST /api/ai/analyze
 * Analyze evidence for a specific assessment item
 *
 * Body:
 * {
 *   "assessment_item_id": "xxx",
 *   "subcategory_code": "GV.OC-01",
 *   "subcategory_description": "...",
 *   "evidence_notes": "...",
 *   "file_names": ["file1.pdf", "file2.docx"],
 *   "current_status": "not_assessed"
 * }
 */
app.post('/analyze', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const body = await c.req.json();

    // Validate required fields
    if (!body.assessment_item_id || !body.subcategory_code) {
      return c.json(
        { error: 'assessment_item_id and subcategory_code are required' },
        400
      );
    }

    // Verify assessment item exists
    const item = await db
      .select()
      .from(assessment_items)
      .where(eq(assessment_items.id, body.assessment_item_id))
      .limit(1);

    if (item.length === 0) {
      return c.json({ error: 'Assessment item not found' }, 404);
    }

    const startTime = Date.now();

    // Call AI analysis
    const result = await analyzeEvidence(c.env.ANTHROPIC_API_KEY, {
      subcategoryCode: body.subcategory_code,
      subcategoryDescription: body.subcategory_description || '',
      evidenceNotes: body.evidence_notes || '',
      fileNames: body.file_names || [],
      currentStatus: body.current_status || 'not_assessed',
    });

    const processingTime = Date.now() - startTime;

    // Update assessment item with AI results
    await db
      .update(assessment_items)
      .set({
        ai_suggested_status: result.suggestedStatus,
        ai_confidence_score: result.confidenceScore,
        ai_reasoning: result.reasoning,
        ai_analyzed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(assessment_items.id, body.assessment_item_id));

    // Log AI analysis
    await db.insert(ai_analysis_logs).values({
      assessment_id: item[0].assessment_id,
      assessment_item_id: body.assessment_item_id,
      operation_type: 'evidence_analysis',
      model_used: 'claude-sonnet-4-20250514',
      processing_time_ms: processingTime,
      success: true,
    });

    return c.json({
      success: true,
      result,
      processingTime,
    });
  } catch (error) {
    console.error('Error analyzing evidence:', error);

    // Log failed analysis
    try {
      const db = createDbClient(c.env.DB);
      const body = await c.req.json();
      if (body.assessment_item_id) {
        const item = await db
          .select()
          .from(assessment_items)
          .where(eq(assessment_items.id, body.assessment_item_id))
          .limit(1);

        if (item.length > 0) {
          await db.insert(ai_analysis_logs).values({
            assessment_id: item[0].assessment_id,
            assessment_item_id: body.assessment_item_id,
            operation_type: 'evidence_analysis',
            model_used: 'claude-sonnet-4-20250514',
            success: false,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    } catch (logError) {
      console.error('Error logging failed analysis:', logError);
    }

    return c.json({ error: 'Failed to analyze evidence' }, 500);
  }
});

/**
 * POST /api/ai/gap-analysis
 * Generate gap recommendations for an assessment
 *
 * Body:
 * {
 *   "assessment_id": "xxx",
 *   "organization_info": {
 *     "name": "Demo Org",
 *     "industry": "Technology",
 *     "size": "Medium"
 *   }
 * }
 */
app.post('/gap-analysis', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const body = await c.req.json();

    if (!body.assessment_id) {
      return c.json({ error: 'assessment_id is required' }, 400);
    }

    // Get assessment items with subcategory and function info
    const items = await db
      .select({
        subcategoryCode: csf_subcategories.id,
        subcategoryDescription: csf_subcategories.description,
        functionCode: csf_subcategories.category_id, // We'll extract function from category
        functionName: csf_subcategories.name,
        status: assessment_items.status,
        notes: assessment_items.notes,
      })
      .from(assessment_items)
      .innerJoin(
        csf_subcategories,
        eq(assessment_items.subcategory_id, csf_subcategories.id)
      )
      .where(eq(assessment_items.assessment_id, body.assessment_id));

    const startTime = Date.now();

    // Generate recommendations
    const recommendations = await generateRecommendations(c.env.ANTHROPIC_API_KEY, {
      assessmentItems: items.map((item) => ({
        subcategoryCode: item.subcategoryCode,
        subcategoryDescription: item.subcategoryDescription || '',
        functionCode: item.functionCode.split('.')[0], // Extract function code (e.g., "GV" from "GV.OC")
        functionName: item.functionName,
        status: item.status || 'not_assessed',
        notes: item.notes || undefined,
      })),
      organizationInfo: body.organization_info,
    });

    const processingTime = Date.now() - startTime;

    // Save recommendations to database
    const savedRecommendations = await Promise.all(
      recommendations.map((rec) =>
        db.insert(gap_recommendations).values({
          assessment_id: body.assessment_id,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          effort: rec.effort,
          impact: rec.impact,
        }).returning()
      )
    );

    // Log AI operation
    await db.insert(ai_analysis_logs).values({
      assessment_id: body.assessment_id,
      operation_type: 'gap_identification',
      model_used: 'claude-sonnet-4-20250514',
      processing_time_ms: processingTime,
      success: true,
    });

    return c.json({
      success: true,
      recommendations: savedRecommendations.map(r => r[0]),
      processingTime,
    });
  } catch (error) {
    console.error('Error generating gap analysis:', error);
    return c.json({ error: 'Failed to generate gap analysis' }, 500);
  }
});

/**
 * POST /api/ai/executive-summary
 * Generate executive summary for an assessment
 *
 * Body:
 * {
 *   "assessment_id": "xxx",
 *   "organization_name": "Demo Org",
 *   "industry": "Technology",
 *   "overall_score": 65.5,
 *   "function_scores": [...],
 *   "distribution": {...},
 *   "top_gaps": [...]
 * }
 */
app.post('/executive-summary', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const body = await c.req.json();

    if (!body.assessment_id) {
      return c.json({ error: 'assessment_id is required' }, 400);
    }

    const startTime = Date.now();

    // Generate executive summary
    const summary = await generateExecutiveSummary(c.env.ANTHROPIC_API_KEY, {
      organizationName: body.organization_name || 'Organization',
      industry: body.industry || 'Unknown',
      overallScore: body.overall_score || 0,
      functionScores: body.function_scores || [],
      distribution: body.distribution || {
        compliant: 0,
        partial: 0,
        non_compliant: 0,
        not_assessed: 0,
        not_applicable: 0,
      },
      topGaps: body.top_gaps || [],
    });

    const processingTime = Date.now() - startTime;

    // Save summary to database
    const savedSummary = await db
      .insert(executive_summaries)
      .values({
        assessment_id: body.assessment_id,
        summary_text: summary.summary,
        maturity_tier: summary.overallMaturityTier,
        top_strengths: JSON.stringify(summary.topStrengths),
        top_gaps: JSON.stringify(summary.topGaps),
      })
      .returning();

    // Log AI operation
    await db.insert(ai_analysis_logs).values({
      assessment_id: body.assessment_id,
      operation_type: 'executive_summary',
      model_used: 'claude-sonnet-4-20250514',
      processing_time_ms: processingTime,
      success: true,
    });

    return c.json({
      success: true,
      summary: {
        ...savedSummary[0],
        top_strengths: JSON.parse(savedSummary[0].top_strengths || '[]'),
        top_gaps: JSON.parse(savedSummary[0].top_gaps || '[]'),
      },
      processingTime,
    });
  } catch (error) {
    console.error('Error generating executive summary:', error);
    return c.json({ error: 'Failed to generate executive summary' }, 500);
  }
});

/**
 * POST /api/ai/chat
 * Chat with AI assistant — returns a Server-Sent Events stream
 *
 * Body: { messages: [{role: 'user'|'assistant', content: string}], page_context?: string }
 */
app.post('/chat', async (c) => {
  try {
    const body = await c.req.json();
    const messages: Array<{ role: string; content: string }> = body.messages ?? [];
    const pageContext: string = body.page_context ?? '';

    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: 'messages array is required' }, 400);
    }

    const client = new Anthropic({ apiKey: c.env.ANTHROPIC_API_KEY });

    const systemPrompt =
      `You are a NIST CSF 2.0 compliance expert embedded in the CSF Compass platform. ` +
      `You help users understand controls, gather evidence, and improve their compliance posture. ` +
      `Be concise, practical, and reference specific CSF control IDs when relevant.\n\n` +
      `Current page context: ${pageContext || 'General platform view'}`;

    const apiMessages = messages
      .filter(
        (m) =>
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim().length > 0,
      )
      .slice(-10)
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    if (apiMessages.length === 0) {
      return c.json({ error: 'No valid messages provided' }, 400);
    }

    const stream = await client.messages.create({
      model: AI_CONFIG.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
      stream: true,
    });

    const enc = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(
                enc.encode(`data: ${JSON.stringify({ token: event.delta.text })}\n\n`),
              );
            }
          }
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
        } catch (err) {
          controller.enqueue(
            enc.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return c.json({ error: 'Failed to process chat request' }, 500);
  }
});

export default app;
