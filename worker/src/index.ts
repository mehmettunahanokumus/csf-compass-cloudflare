import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Env } from './types/env';

// Import route handlers
import assessmentsRouter from './routes/assessments';
import vendorsRouter from './routes/vendors';
import evidenceRouter from './routes/evidence';
import csfRouter from './routes/csf';
import aiRouter from './routes/ai';
import vendorInvitationsRouter from './routes/vendor-invitations';
import companyGroupsRouter from './routes/company-groups';
import importRouter from './routes/import';
import consolidatedQuestionsRouter from './routes/consolidated-questions';

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());

// Unified CORS middleware
// Hono's app.use('/exact-path', handler) does NOT reliably match OPTIONS preflight
// for that exact path, so we use a single '*' middleware for all CORS handling.
app.use('*', async (c, next) => {
  const origin = c.req.header('origin') || '';
  const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || ['http://localhost:5173'];

  const isAllowed = allowedOrigins.includes(origin)
    || /^https:\/\/[a-f0-9]+\.csf-compass\.pages\.dev$/.test(origin);

  const isVendorInvitations = c.req.path === '/api/vendor-invitations'
    || c.req.path.startsWith('/api/vendor-invitations/');

  if (isVendorInvitations) {
    // Vendor invitations: strict origin check + credentials for session cookies
    if (isAllowed) {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Access-Control-Allow-Credentials', 'true');
      c.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
      c.header('Access-Control-Allow-Headers', 'Content-Type');
      c.header('Vary', 'Origin');
    }
  } else {
    // General API: allow known origins, fallback to '*'
    c.header('Access-Control-Allow-Origin', isAllowed ? origin : '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }

  await next();
});

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'development',
  });
});

// Mount API routes
app.route('/api/assessments', assessmentsRouter);
app.route('/api/vendors', vendorsRouter);
app.route('/api/evidence', evidenceRouter);
app.route('/api/csf', csfRouter);
app.route('/api/ai', aiRouter);
app.route('/api/vendor-invitations', vendorInvitationsRouter);
app.route('/api/company-groups', companyGroupsRouter);
app.route('/api/import', importRouter);
app.route('/api/consolidated-questions', consolidatedQuestionsRouter);

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;
