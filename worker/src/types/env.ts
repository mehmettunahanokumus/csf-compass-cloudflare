/**
 * Cloudflare Worker environment bindings
 */
export interface Env {
  // D1 Database binding
  DB: D1Database;

  // R2 Storage binding
  EVIDENCE_BUCKET: R2Bucket;

  // KV Namespace binding (for rate limiting)
  RATE_LIMIT_KV: KVNamespace;

  // Secrets
  ANTHROPIC_API_KEY: string;
  JWT_SECRET: string;
  RESEND_API_KEY: string;

  // Environment variables
  ENVIRONMENT: string;
  ALLOWED_ORIGINS?: string;
  FRONTEND_URL?: string;
  FROM_EMAIL?: string;
}

/**
 * Hono context variables set by auth middleware
 */
export interface AuthVariables {
  userId: string;
  organizationId: string;
  userRole: string;
}
