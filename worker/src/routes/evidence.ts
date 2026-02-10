/**
 * Evidence Routes
 *
 * File upload/download endpoints:
 * - POST /api/evidence/upload - Upload evidence file to R2
 * - GET /api/evidence/download/:token - Download evidence file
 * - DELETE /api/evidence/:id - Delete evidence file
 * - GET /api/evidence/item/:itemId - List evidence files for an assessment item
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Env } from '../types/env';
import { createDbClient } from '../db/client';
import { evidence_files, assessment_items } from '../db/schema';
import {
  generateR2Key,
  uploadFile,
  downloadFile,
  deleteFile,
  validateFile,
  generateDownloadToken,
  validateDownloadToken,
  getContentTypeFromExtension,
  getFileExtension,
} from '../lib/storage';

const app = new Hono<{ Bindings: Env }>();

/**
 * POST /api/evidence/upload
 * Upload evidence file to R2 and create database record
 *
 * Expects multipart/form-data with:
 * - file: The file to upload
 * - assessment_id: Assessment ID
 * - assessment_item_id: Assessment item ID (optional)
 * - organization_id: Organization ID
 * - uploaded_by: User ID
 */
app.post('/upload', async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const assessmentId = formData.get('assessment_id') as string;
    const assessmentItemId = formData.get('assessment_item_id') as string | null;
    const organizationId = formData.get('organization_id') as string;
    const uploadedBy = formData.get('uploaded_by') as string;

    // Validate required fields
    if (!file || !assessmentId || !organizationId) {
      return c.json(
        { error: 'file, assessment_id, and organization_id are required' },
        400
      );
    }

    // Validate file
    const validation = validateFile(file.type, file.size);
    if (!validation.valid) {
      return c.json({ error: validation.error }, 400);
    }

    // Generate R2 key
    const r2Key = generateR2Key(organizationId, assessmentId, file.name);

    // Upload to R2
    const fileBuffer = await file.arrayBuffer();
    await uploadFile(c.env.EVIDENCE_BUCKET, r2Key, fileBuffer, {
      contentType: file.type,
      fileName: file.name,
    });

    // Create database record
    const db = createDbClient(c.env.DB);
    const newEvidence = await db
      .insert(evidence_files)
      .values({
        assessment_id: assessmentId,
        assessment_item_id: assessmentItemId || undefined,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        r2_key: r2Key,
        uploaded_by: uploadedBy,
      })
      .returning();

    // Generate download token
    const downloadToken = await generateDownloadToken(r2Key);

    return c.json({
      ...newEvidence[0],
      download_url: `/api/evidence/download/${downloadToken}`,
    }, 201);
  } catch (error) {
    console.error('Error uploading evidence:', error);
    return c.json({ error: 'Failed to upload evidence file' }, 500);
  }
});

/**
 * GET /api/evidence/download/:token
 * Download evidence file using presigned token
 */
app.get('/download/:token', async (c) => {
  try {
    const token = c.req.param('token');

    // Validate token and get file path
    const decoded = await validateDownloadToken(token);
    if (!decoded) {
      return c.json({ error: 'Invalid or expired download token' }, 403);
    }

    // Download from R2
    const file = await downloadFile(c.env.EVIDENCE_BUCKET, decoded.key);
    if (!file) {
      return c.json({ error: 'File not found' }, 404);
    }

    // Extract filename from key
    const parts = decoded.key.split('/');
    const filenameWithTimestamp = parts[parts.length - 1];
    const filename = filenameWithTimestamp.split('-').slice(1).join('-'); // Remove timestamp

    // Return file with appropriate headers
    return new Response(file.body, {
      headers: {
        'Content-Type': file.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': file.size.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading evidence:', error);
    return c.json({ error: 'Failed to download evidence file' }, 500);
  }
});

/**
 * DELETE /api/evidence/:id
 * Delete evidence file from R2 and database
 */
app.delete('/:id', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const id = c.req.param('id');

    // Get evidence record
    const evidence = await db
      .select()
      .from(evidence_files)
      .where(eq(evidence_files.id, id))
      .limit(1);

    if (evidence.length === 0) {
      return c.json({ error: 'Evidence file not found' }, 404);
    }

    // Delete from R2
    await deleteFile(c.env.EVIDENCE_BUCKET, evidence[0].r2_key);

    // Delete from database
    await db.delete(evidence_files).where(eq(evidence_files.id, id));

    return c.json({ message: 'Evidence file deleted successfully' });
  } catch (error) {
    console.error('Error deleting evidence:', error);
    return c.json({ error: 'Failed to delete evidence file' }, 500);
  }
});

/**
 * GET /api/evidence/item/:itemId
 * List all evidence files for an assessment item
 */
app.get('/item/:itemId', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const itemId = c.req.param('itemId');

    // Verify assessment item exists
    const item = await db
      .select()
      .from(assessment_items)
      .where(eq(assessment_items.id, itemId))
      .limit(1);

    if (item.length === 0) {
      return c.json({ error: 'Assessment item not found' }, 404);
    }

    // Get evidence files
    const files = await db
      .select()
      .from(evidence_files)
      .where(eq(evidence_files.assessment_item_id, itemId));

    // Generate download tokens for each file
    const filesWithTokens = await Promise.all(
      files.map(async (file) => {
        const downloadToken = await generateDownloadToken(file.r2_key);
        return {
          ...file,
          download_url: `/api/evidence/download/${downloadToken}`,
        };
      })
    );

    return c.json(filesWithTokens);
  } catch (error) {
    console.error('Error fetching evidence files:', error);
    return c.json({ error: 'Failed to fetch evidence files' }, 500);
  }
});

/**
 * GET /api/evidence/assessment/:assessmentId
 * List all evidence files for an assessment
 */
app.get('/assessment/:assessmentId', async (c) => {
  try {
    const db = createDbClient(c.env.DB);
    const assessmentId = c.req.param('assessmentId');

    const files = await db
      .select()
      .from(evidence_files)
      .where(eq(evidence_files.assessment_id, assessmentId));

    // Generate download tokens
    const filesWithTokens = await Promise.all(
      files.map(async (file) => {
        const downloadToken = await generateDownloadToken(file.r2_key);
        return {
          ...file,
          download_url: `/api/evidence/download/${downloadToken}`,
        };
      })
    );

    return c.json(filesWithTokens);
  } catch (error) {
    console.error('Error fetching evidence files:', error);
    return c.json({ error: 'Failed to fetch evidence files' }, 500);
  }
});

export default app;
