/**
 * Authentication & Authorization
 *
 * PBKDF2 password hashing (Web Crypto API — Cloudflare Workers native)
 * JWT session cookie validation
 * Org-scoped authorization middleware
 */

import { Context, Next } from 'hono';
import jwt from '@tsndr/cloudflare-worker-jwt';
import type { Env, AuthVariables } from '../types/env';

// ─── Password Hashing (PBKDF2-SHA256) ────────────────────────────────────────

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8,
  );
  return `${bufToHex(salt.buffer)}:${bufToHex(derivedBits)}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) return false;
  const salt = new Uint8Array(hexToBuf(saltHex));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    KEY_LENGTH * 8,
  );
  return bufToHex(derivedBits) === hashHex;
}

// ─── JWT Session Tokens ──────────────────────────────────────────────────────

export async function generateAuthToken(
  jwtSecret: string,
  userId: string,
  organizationId: string,
  role: string,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
  return await jwt.sign({ userId, organizationId, role, type: 'auth', exp }, jwtSecret);
}

export async function validateAuthToken(
  jwtSecret: string,
  token: string,
): Promise<{ valid: boolean; userId?: string; organizationId?: string; role?: string }> {
  try {
    const isValid = await jwt.verify(token, jwtSecret);
    if (!isValid) return { valid: false };

    const { payload } = jwt.decode(token) as { payload: Record<string, unknown> };
    if (payload.type !== 'auth') return { valid: false };
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: payload.userId as string,
      organizationId: payload.organizationId as string,
      role: payload.role as string,
    };
  } catch {
    return { valid: false };
  }
}

// ─── Session Cookie Helpers ──────────────────────────────────────────────────

const AUTH_COOKIE_NAME = 'csf-session';

export function setAuthCookie(c: Context, token: string) {
  const isProduction = c.env?.ENVIRONMENT === 'production';
  c.header('Set-Cookie',
    `${AUTH_COOKIE_NAME}=${token}; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`,
  );
}

export function clearAuthCookie(c: Context) {
  const isProduction = c.env?.ENVIRONMENT === 'production';
  c.header('Set-Cookie',
    `${AUTH_COOKIE_NAME}=; HttpOnly; ${isProduction ? 'Secure; ' : ''}SameSite=Lax; Path=/; Max-Age=0`,
  );
}

/**
 * Extract auth token from Authorization header (preferred) or cookie (fallback).
 * Cross-origin requests can't use cookies, so Bearer token is the primary method.
 */
export function getAuthToken(c: Context): string | null {
  // 1. Check Authorization header first (works cross-origin)
  const authHeader = c.req.header('authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // 2. Fallback to cookie (same-origin only)
  const cookies = c.req.header('cookie') || '';
  const match = cookies.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

// ─── Auth Middleware ─────────────────────────────────────────────────────────

/**
 * Middleware: validates JWT session cookie and sets userId/organizationId on context.
 * Returns 401 if no valid session.
 */
export async function requireOrgAuth(c: Context<{ Bindings: Env; Variables: AuthVariables }>, next: Next) {
  const token = getAuthToken(c);
  if (!token) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  const result = await validateAuthToken(c.env.JWT_SECRET, token);
  if (!result.valid || !result.userId || !result.organizationId) {
    return c.json({ error: 'Invalid or expired session' }, 401);
  }

  // If request includes organization_id, enforce it matches the session
  const method = c.req.method;
  let requestedOrgId: string | undefined;

  if (method === 'GET' || method === 'DELETE') {
    requestedOrgId = c.req.query('organization_id');
  } else if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
    try {
      const cloned = c.req.raw.clone();
      const contentType = c.req.header('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await cloned.json() as Record<string, unknown>;
        requestedOrgId = typeof body.organization_id === 'string' ? body.organization_id : undefined;
      }
    } catch {
      // Not JSON or no body — skip
    }
  }

  if (requestedOrgId && requestedOrgId !== result.organizationId) {
    return c.json({ error: 'Forbidden: organization access denied' }, 403);
  }

  // Set auth context for downstream handlers
  c.set('userId', result.userId!);
  c.set('organizationId', result.organizationId!);
  c.set('userRole', result.role || 'member');

  await next();
}
