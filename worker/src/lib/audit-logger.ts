/**
 * Centralized Audit Logging for Vendor Portal Actions
 *
 * Logs all security-relevant events to vendor_audit_log table.
 * Captures IP address, user agent, and custom metadata for forensic analysis.
 */

import { Context } from 'hono';

/**
 * Audit actions tracked in the system
 */
export type AuditAction =
  | 'token_validated'
  | 'token_rejected'
  | 'token_expired'
  | 'status_updated'
  | 'assessment_submitted'
  | 'rate_limited'
  | 'token_revoked';

/**
 * Log an audit event to the database
 * @param c - Hono context with DB binding
 * @param invitationId - UUID of the invitation
 * @param action - Action type being logged
 * @param metadata - Optional additional context (will be JSON stringified)
 */
export async function logAuditEvent(
  c: Context,
  invitationId: string,
  action: AuditAction,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const ipAddress = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const userAgent = c.req.header('user-agent') || 'unknown';

    await c.env.DB.prepare(
      `INSERT INTO vendor_audit_log (id, invitation_id, action, ip_address, user_agent, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      invitationId,
      action,
      ipAddress,
      userAgent,
      metadata ? JSON.stringify(metadata) : null,
      Date.now()
    ).run();
  } catch (error) {
    // Log error but don't throw - audit logging failures shouldn't break the request
    console.error('Failed to log audit event:', error);
  }
}
