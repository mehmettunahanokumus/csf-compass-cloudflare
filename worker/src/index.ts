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

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());

// CORS Configuration
// IMPORTANT: Same-Origin Cookie Strategy
// Frontend and backend MUST share the same origin for httpOnly cookies to work.
// For production, configure both to use same root domain or deploy Worker under Pages /_worker.js

// Vendor invitations CORS (requires credentials for session cookies)
// IMPORTANT: Register for BOTH the exact path and wildcard sub-paths.
// '/api/vendor-invitations/*' does NOT match '/api/vendor-invitations' (no trailing segment).
// The POST to create an invitation hits the exact path, so both patterns are needed.
const vendorInvitationsCors = async (c: any, next: any) => {
  const origin = c.req.header('origin') || '';
  const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || ['http://localhost:5173'];

  // Check if origin is allowed
  const isAllowed = allowedOrigins.includes(origin);

  // Set CORS headers
  if (isAllowed) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type');
    c.header('Vary', 'Origin');
  }

  // Handle preflight
  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }

  await next();
};
app.use('/api/vendor-invitations', vendorInvitationsCors);
app.use('/api/vendor-invitations/*', vendorInvitationsCors);

// General API CORS (exclude vendor invitations - they have their own CORS)
app.use('*', async (c, next) => {
  // Skip if this is a vendor invitations endpoint (already handled above)
  if (c.req.path.startsWith('/api/vendor-invitations')) {
    return next();
  }

  // Apply general CORS for other endpoints
  const origin = c.req.header('origin') || '';
  const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || ['http://localhost:5173'];

  // Allow all origins for general API endpoints (or restrict to allowed list)
  c.header('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
