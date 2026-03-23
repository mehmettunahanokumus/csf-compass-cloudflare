/**
 * Rate Limiting Middleware using Workers KV
 *
 * Uses KV instead of D1 for:
 * - Faster reads/writes for high-frequency counters
 * - Built-in TTL for automatic cleanup
 * - Lower latency for rate limit checks
 */

import { Context } from 'hono';

interface RateLimitConfig {
  requests: number;  // Max requests
  window: number;    // Time window in seconds
}

/**
 * Rate limit configurations for different operations
 */
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'token_validation': { requests: 10, window: 60 },   // 10 requests per minute
  'status_update': { requests: 200, window: 60 },     // 200 requests per minute (vendors answering 120 controls)
  'evidence_upload': { requests: 20, window: 60 },    // 20 uploads per minute
  'ai_analysis': { requests: 5, window: 60 },         // 5 AI requests per minute
};

/**
 * Check if operation is rate limited
 * @param c - Hono context with KV binding
 * @param operation - Operation type to rate limit
 * @returns Rate limit result with allowed flag and retry-after seconds
 */
export async function rateLimiter(
  c: Context,
  operation: 'token_validation' | 'status_update' | 'evidence_upload' | 'ai_analysis'
): Promise<{ allowed: boolean, retryAfter?: number }> {
  const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const config = RATE_LIMITS[operation];

  // KV key format: rate:{operation}:{ip}
  const key = `rate:${operation}:${ipAddress}`;

  try {
    // Get current value: "count:windowStart"
    const currentValue = await c.env.RATE_LIMIT_KV.get(key);
    const now = Math.floor(Date.now() / 1000);
    let count = 0;
    let windowStart = now;

    if (currentValue) {
      const parts = currentValue.split(':');
      const storedCount = parseInt(parts[0], 10);
      const storedStart = parseInt(parts[1], 10) || now;

      // Check if we're still in the same window
      if (now - storedStart < config.window) {
        count = storedCount;
        windowStart = storedStart;
      }
      // Otherwise, window expired — reset counter
    }

    if (count >= config.requests) {
      const retryAfter = config.window - (now - windowStart);
      return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
    }

    // Store "count:windowStart" with TTL for auto-cleanup
    const remainingTtl = config.window - (now - windowStart);
    await c.env.RATE_LIMIT_KV.put(
      key,
      `${count + 1}:${windowStart}`,
      { expirationTtl: Math.max(remainingTtl, 1) }
    );

    return { allowed: true };
  } catch (error) {
    // If KV fails, allow the request (fail open for availability)
    console.error('Rate limiter KV error:', error);
    return { allowed: true };
  }
}

/**
 * Middleware wrapper for rate limiting
 * Returns 429 response if rate limit exceeded, null otherwise
 * @param c - Hono context
 * @param operation - Operation type to rate limit
 * @returns 429 Response if rate limited, null if allowed
 */
export async function checkRateLimit(
  c: Context,
  operation: 'token_validation' | 'status_update' | 'evidence_upload' | 'ai_analysis'
): Promise<Response | null> {
  const result = await rateLimiter(c, operation);

  if (!result.allowed) {
    return c.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      429,
      {
        'Retry-After': result.retryAfter?.toString() || '60',
      }
    );
  }

  return null;
}
