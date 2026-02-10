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

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors({
  origin: '*', // TODO: Restrict in production
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
app.use('*', logger());

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
