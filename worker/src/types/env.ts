/**
 * Cloudflare Worker environment bindings
 */
export interface Env {
  // D1 Database binding
  DB: D1Database;

  // R2 Storage binding
  EVIDENCE_BUCKET: R2Bucket;

  // Secrets
  ANTHROPIC_API_KEY: string;

  // Environment variables
  ENVIRONMENT: string;
}
