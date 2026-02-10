/**
 * CSF Reference Data Routes
 *
 * Read-only endpoints for NIST CSF 2.0 framework data:
 * - GET /api/csf/functions - List all CSF functions
 * - GET /api/csf/categories - List all CSF categories
 * - GET /api/csf/subcategories - List all CSF subcategories
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Env } from '../types/env';
import { createDbClient } from '../db/client';
import { csf_functions, csf_categories, csf_subcategories } from '../db/schema';

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /api/csf/functions
 * List all CSF functions (6 total: GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER)
 */
app.get('/functions', async (c) => {
  try {
    const db = createDbClient(c.env.DB);

    const functions = await db
      .select()
      .from(csf_functions)
      .orderBy(csf_functions.sort_order);

    return c.json(functions);
  } catch (error) {
    console.error('Error fetching CSF functions:', error);
    return c.json({ error: 'Failed to fetch CSF functions' }, 500);
  }
});

/**
 * GET /api/csf/categories?functionId=GV
 * List all CSF categories (22 total)
 * Optional query param: functionId - Filter by function
 */
app.get('/categories', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const functionId = c.req.query('functionId');

    let query = db
      .select()
      .from(csf_categories)
      .orderBy(csf_categories.sort_order);

    // Filter by function if provided
    if (functionId) {
      query = query.where(eq(csf_categories.function_id, functionId)) as any;
    }

    const categories = await query;

    return c.json(categories);
  } catch (error) {
    console.error('Error fetching CSF categories:', error);
    return c.json({ error: 'Failed to fetch CSF categories' }, 500);
  }
});

/**
 * GET /api/csf/subcategories?categoryId=GV.OC
 * List all CSF subcategories (120 total)
 * Optional query param: categoryId - Filter by category
 */
app.get('/subcategories', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const categoryId = c.req.query('categoryId');

    let query = db
      .select()
      .from(csf_subcategories)
      .orderBy(csf_subcategories.sort_order);

    // Filter by category if provided
    if (categoryId) {
      query = query.where(eq(csf_subcategories.category_id, categoryId)) as any;
    }

    const subcategories = await query;

    return c.json(subcategories);
  } catch (error) {
    console.error('Error fetching CSF subcategories:', error);
    return c.json({ error: 'Failed to fetch CSF subcategories' }, 500);
  }
});

/**
 * GET /api/csf/subcategories/:id
 * Get a specific subcategory by ID
 */
app.get('/subcategories/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');

    const subcategory = await db
      .select()
      .from(csf_subcategories)
      .where(eq(csf_subcategories.id, id))
      .limit(1);

    if (subcategory.length === 0) {
      return c.json({ error: 'Subcategory not found' }, 404);
    }

    return c.json(subcategory[0]);
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    return c.json({ error: 'Failed to fetch subcategory' }, 500);
  }
});

export default app;
