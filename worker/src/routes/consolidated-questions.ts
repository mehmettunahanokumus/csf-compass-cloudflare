/**
 * Consolidated Questions Routes
 *
 * GET /api/consolidated-questions?tier=medium
 * Returns consolidated questions filtered by tier, with mapped subcategory IDs.
 */

import { Hono } from 'hono';
import type { Env } from '../types/env';
import { TIER_ORDER } from '../lib/maturity-levels';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /api/consolidated-questions
 * Query params:
 *   - tier: 'low' | 'medium' | 'high' | 'critical' (optional, defaults to all)
 */
app.get('/', async (c) => {
  try {
    const tier = c.req.query('tier');

    // Get all consolidated questions
    let questionsResult;
    if (tier && TIER_ORDER[tier]) {
      // Filter: include questions whose min_tier <= requested tier
      questionsResult = await c.env.DB.prepare(
        `SELECT * FROM consolidated_questions
         WHERE CASE min_tier WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 WHEN 'critical' THEN 4 END
            <= CASE ? WHEN 'low' THEN 1 WHEN 'medium' THEN 2 WHEN 'high' THEN 3 WHEN 'critical' THEN 4 END
         ORDER BY sort_order`
      ).bind(tier).all();
    } else {
      questionsResult = await c.env.DB.prepare(
        'SELECT * FROM consolidated_questions ORDER BY sort_order'
      ).all();
    }

    const questions = questionsResult.results || [];

    // Get all mappings for returned questions
    if (questions.length === 0) {
      return c.json({ questions: [] });
    }

    const questionIds = questions.map(q => q.id as string);

    // Fetch mappings in batches to stay under D1's 100 param limit
    const allMappings: Record<string, string[]> = {};
    const batchSize = 25;

    for (let i = 0; i < questionIds.length; i += batchSize) {
      const batch = questionIds.slice(i, i + batchSize);
      const placeholders = batch.map(() => '?').join(',');
      const mappingsResult = await c.env.DB.prepare(
        `SELECT consolidated_question_id, subcategory_id
         FROM consolidated_question_mappings
         WHERE consolidated_question_id IN (${placeholders})`
      ).bind(...batch).all();

      for (const m of mappingsResult.results || []) {
        const cqId = m.consolidated_question_id as string;
        if (!allMappings[cqId]) allMappings[cqId] = [];
        allMappings[cqId].push(m.subcategory_id as string);
      }
    }

    // Combine questions with their subcategory IDs
    const enrichedQuestions = questions.map(q => ({
      ...q,
      subcategory_ids: allMappings[q.id as string] || [],
      subcategory_count: (allMappings[q.id as string] || []).length,
    }));

    return c.json({ questions: enrichedQuestions });
  } catch (error) {
    console.error('Error fetching consolidated questions:', error);
    return c.json({ error: 'Failed to fetch consolidated questions' }, 500);
  }
});

export default app;
