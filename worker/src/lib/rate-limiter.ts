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
  'status_update': { requests: 30, window: 60 },      // 30 requests per minute
};

/**
 * Check if operation is rate limited
 * @param c - Hono context with KV binding
 * @param operation - Operation type to rate limit
 * @returns Rate limit result with allowed flag and retry-after seconds
 */
export async function rateLimiter(
  c: Context,
  operation: 'token_validation' | 'status_update'
): Promise<{ allowed: boolean, retryAfter?: number }> {
  const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
  const config = RATE_LIMITS[operation];

  // KV key format: rate:{operation}:{ip}
  const key = `rate:${operation}:${ipAddress}`;

  try {
    // Get current count from KV
    const currentCount = await c.env.RATE_LIMIT_KV.get(key);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    if (count >= config.requests) {
      return { allowed: false, retryAfter: config.window };
    }

    // Increment counter with TTL (auto-expires after window)
    await c.env.RATE_LIMIT_KV.put(
      key,
      (count + 1).toString(),
      { expirationTtl: config.window }  // Auto-cleanup
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
  operation: 'token_validation' | 'status_update'
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
