/**
 * JWT Token Generation and Validation for Vendor Invitations
 *
 * Uses @tsndr/cloudflare-worker-jwt for cryptographic signing.
 * Tokens are signed with JWT_SECRET environment variable.
 */

import jwt from '@tsndr/cloudflare-worker-jwt';

/**
 * Generate signed JWT token for vendor invitation magic link
 * @param jwtSecret - Secret key for signing (from environment)
 * @param invitationId - UUID of the invitation record
 * @param vendorAssessmentId - UUID of the vendor's cloned assessment
 * @param orgAssessmentId - UUID of the organization's original assessment
 * @param expiresInDays - Token expiration in days (max 7 days)
 * @returns Signed JWT token string
 */
export async function generateInvitationToken(
  jwtSecret: string,
  invitationId: string,
  vendorAssessmentId: string,
  orgAssessmentId: string,
  expiresInDays: number = 7
): Promise<string> {
  // Enforce maximum 7-day expiration
  const maxExpiry = Math.min(expiresInDays, 7);
  const exp = Math.floor(Date.now() / 1000) + (maxExpiry * 24 * 60 * 60);

  const token = await jwt.sign({
    invitationId,
    vendorAssessmentId,
    orgAssessmentId,
    exp,
  }, jwtSecret);

  return token;
}

/**
 * Validate and verify signed JWT token
 * @param jwtSecret - Secret key for verification
 * @param token - JWT token to validate
 * @returns Validation result with payload if valid
 */
export async function validateInvitationToken(
  jwtSecret: string,
  token: string
): Promise<{
  valid: boolean,
  payload?: {
    invitationId: string,
    vendorAssessmentId: string,
    orgAssessmentId: string,
    exp: number
  },
  error?: string
}> {
  try {
    const isValid = await jwt.verify(token, jwtSecret);
    if (!isValid) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const { payload } = jwt.decode(token);

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Token expired' };
    }

    return {
      valid: true,
      payload: payload as {
        invitationId: string,
        vendorAssessmentId: string,
        orgAssessmentId: string,
        exp: number
      }
    };
  } catch (error) {
    return { valid: false, error: 'Invalid token format' };
  }
}

/**
 * Generate 24-hour session token (after magic link consumption)
 * @param jwtSecret - Secret key for signing
 * @param invitationId - UUID of the invitation record
 * @returns Signed session token
 */
export async function generateSessionToken(
  jwtSecret: string,
  invitationId: string
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours

  const token = await jwt.sign({
    invitationId,
    type: 'session',
    exp,
  }, jwtSecret);

  return token;
}

/**
 * Validate session token from cookie
 * @param jwtSecret - Secret key for verification
 * @param token - Session token to validate
 * @returns Validation result with invitationId if valid
 */
export async function validateSessionToken(
  jwtSecret: string,
  token: string
): Promise<{
  valid: boolean,
  invitationId?: string,
  error?: string
}> {
  try {
    const isValid = await jwt.verify(token, jwtSecret);
    if (!isValid) {
      return { valid: false, error: 'Invalid session token' };
    }

    const { payload } = jwt.decode(token);

    if (payload.type !== 'session') {
      return { valid: false, error: 'Not a session token' };
    }

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'Session expired' };
    }

    return { valid: true, invitationId: payload.invitationId };
  } catch (error) {
    return { valid: false, error: 'Invalid session token' };
  }
}

/**
 * Generate full magic link URL for vendor portal
 * @param token - JWT access token
 * @param baseUrl - Base URL of the frontend (e.g., https://your-app.pages.dev)
 * @returns Full magic link URL
 */
export function generateMagicLink(token: string, baseUrl: string): string {
  // Remove trailing slash from baseUrl if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/vendor-portal/${token}`;
}
