/**
 * Auth Routes
 *
 * Endpoints:
 * - POST /api/auth/signup         — Create org + user, set session
 * - POST /api/auth/login          — Verify password, set session
 * - POST /api/auth/logout         — Clear session
 * - GET  /api/auth/me             — Get current user info
 * - POST /api/auth/forgot-password — Send password reset email
 * - POST /api/auth/reset-password  — Reset password with token
 * - POST /api/auth/invite-member   — Invite team member (requires auth)
 * - POST /api/auth/accept-invite   — Accept team invitation
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import type { Env } from '../types/env';
import { createDbClient } from '../db/client';
import { organizations, profiles, org_invitations } from '../db/schema';
import {
  hashPassword,
  verifyPassword,
  generateAuthToken,
  validateAuthToken,
  setAuthCookie,
  clearAuthCookie,
  getAuthToken,
} from '../lib/auth';
import { sendEmail, welcomeEmail, teamInviteEmail, passwordResetEmail } from '../lib/email';

const app = new Hono<{ Bindings: Env }>();

// ─── Validation helpers ──────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 128) return 'Password must be at most 128 characters';
  return null;
}

// ─── POST /api/auth/signup ───────────────────────────────────────────────────

app.post('/signup', async (c) => {
  try {
    const body = await c.req.json() as Record<string, unknown>;
    const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const orgName = typeof body.organization_name === 'string' ? body.organization_name.trim() : '';

    if (!email || !isValidEmail(email)) {
      return c.json({ error: 'Valid email is required' }, 400);
    }
    const pwError = isValidPassword(password);
    if (pwError) return c.json({ error: pwError }, 400);
    if (!fullName) return c.json({ error: 'Full name is required' }, 400);
    if (!orgName) return c.json({ error: 'Organization name is required' }, 400);

    const db = createDbClient(c.env.DB);

    // Check email uniqueness
    const existing = await db.select({ id: profiles.id })
      .from(profiles).where(eq(profiles.email, email)).limit(1);
    if (existing.length > 0) {
      return c.json({ error: 'An account with this email already exists' }, 409);
    }

    // Create organization
    const [org] = await db.insert(organizations).values({ name: orgName }).returning();

    // Create user profile
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(profiles).values({
      organization_id: org.id,
      email,
      full_name: fullName,
      role: 'admin', // Org creator is admin
      password_hash: passwordHash,
      email_verified: 1, // Auto-verify for now
    }).returning();

    // Set session
    const token = await generateAuthToken(c.env.JWT_SECRET, user.id, org.id, 'admin');
    setAuthCookie(c, token);

    // Send welcome email (fire and forget)
    sendEmail(c.env.RESEND_API_KEY, c.env.FROM_EMAIL || 'noreply@csf-compass.pages.dev', email,
      'Welcome to CSF Compass', welcomeEmail(fullName, orgName)
    ).catch(err => console.error('Welcome email failed:', err));

    return c.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      organization: { id: org.id, name: org.name },
    }, 201);
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────

app.post('/login', async (c) => {
  try {
    const body = await c.req.json() as Record<string, unknown>;
    const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const db = createDbClient(c.env.DB);
    const [user] = await db.select()
      .from(profiles).where(eq(profiles.email, email)).limit(1);

    if (!user || !user.password_hash) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    if (!user.organization_id) {
      return c.json({ error: 'Account not associated with an organization' }, 403);
    }

    // Get org info
    const [org] = await db.select({ id: organizations.id, name: organizations.name })
      .from(organizations).where(eq(organizations.id, user.organization_id)).limit(1);

    const token = await generateAuthToken(c.env.JWT_SECRET, user.id, user.organization_id, user.role || 'member');
    setAuthCookie(c, token);

    return c.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      organization: org ? { id: org.id, name: org.name } : null,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Failed to log in' }, 500);
  }
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────

app.post('/logout', async (c) => {
  clearAuthCookie(c);
  return c.json({ success: true });
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────

app.get('/me', async (c) => {
  try {
    const token = getAuthToken(c);
    if (!token) {
      return c.json({ authenticated: false }, 401);
    }

    const result = await validateAuthToken(c.env.JWT_SECRET, token);
    if (!result.valid || !result.userId) {
      return c.json({ authenticated: false }, 401);
    }

    const db = createDbClient(c.env.DB);
    const [user] = await db.select({
      id: profiles.id,
      email: profiles.email,
      full_name: profiles.full_name,
      role: profiles.role,
      organization_id: profiles.organization_id,
    }).from(profiles).where(eq(profiles.id, result.userId)).limit(1);

    if (!user || !user.organization_id) {
      return c.json({ authenticated: false }, 401);
    }

    const [org] = await db.select({
      id: organizations.id,
      name: organizations.name,
      logo_url: organizations.logo_url,
      primary_color: organizations.primary_color,
    }).from(organizations).where(eq(organizations.id, user.organization_id)).limit(1);

    return c.json({
      authenticated: true,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      organization: org || null,
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return c.json({ authenticated: false }, 401);
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────

app.post('/forgot-password', async (c) => {
  try {
    const body = await c.req.json() as Record<string, unknown>;
    const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();

    // Always return success to prevent email enumeration
    if (!email || !isValidEmail(email)) {
      return c.json({ success: true });
    }

    const db = createDbClient(c.env.DB);
    const [user] = await db.select({ id: profiles.id })
      .from(profiles).where(eq(profiles.email, email)).limit(1);

    if (user) {
      const resetToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.update(profiles).set({
        password_reset_token: resetToken,
        password_reset_expires_at: expiresAt,
        updated_at: new Date(),
      }).where(eq(profiles.id, user.id));

      const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
      const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

      sendEmail(c.env.RESEND_API_KEY, c.env.FROM_EMAIL || 'noreply@csf-compass.pages.dev', email,
        'Password Reset — CSF Compass', passwordResetEmail(resetLink)
      ).catch(err => console.error('Password reset email failed:', err));
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ success: true });
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────

app.post('/reset-password', async (c) => {
  try {
    const body = await c.req.json() as Record<string, unknown>;
    const token = typeof body.token === 'string' ? body.token : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!token) return c.json({ error: 'Reset token is required' }, 400);
    const pwError = isValidPassword(password);
    if (pwError) return c.json({ error: pwError }, 400);

    const db = createDbClient(c.env.DB);
    const [user] = await db.select()
      .from(profiles)
      .where(eq(profiles.password_reset_token, token))
      .limit(1);

    if (!user) {
      return c.json({ error: 'Invalid or expired reset link' }, 400);
    }

    // Check expiry
    const expiresAt = user.password_reset_expires_at;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return c.json({ error: 'Invalid or expired reset link' }, 400);
    }

    const passwordHash = await hashPassword(password);
    await db.update(profiles).set({
      password_hash: passwordHash,
      password_reset_token: null,
      password_reset_expires_at: null,
      updated_at: new Date(),
    }).where(eq(profiles.id, user.id));

    return c.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

// ─── POST /api/auth/invite-member ────────────────────────────────────────────

app.post('/invite-member', async (c) => {
  try {
    // Require auth
    const authToken = getAuthToken(c);
    if (!authToken) return c.json({ error: 'Authentication required' }, 401);

    const authResult = await validateAuthToken(c.env.JWT_SECRET, authToken);
    if (!authResult.valid || !authResult.organizationId) {
      return c.json({ error: 'Invalid session' }, 401);
    }

    // Only admins can invite
    if (authResult.role !== 'admin') {
      return c.json({ error: 'Only admins can invite team members' }, 403);
    }

    const body = await c.req.json() as Record<string, unknown>;
    const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
    const role = typeof body.role === 'string' && ['admin', 'member', 'viewer'].includes(body.role)
      ? body.role : 'member';

    if (!email || !isValidEmail(email)) {
      return c.json({ error: 'Valid email is required' }, 400);
    }

    const db = createDbClient(c.env.DB);

    // Check if user already exists in org
    const [existingUser] = await db.select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    if (existingUser) {
      return c.json({ error: 'A user with this email already exists' }, 409);
    }

    // Create invitation
    const inviteToken = crypto.randomUUID();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const [invitation] = await db.insert(org_invitations).values({
      organization_id: authResult.organizationId,
      email,
      role,
      token: inviteToken,
      invited_by: authResult.userId!,
      expires_at: new Date(expiresAt),
    }).returning();

    // Get org name and inviter name for email
    const [org] = await db.select({ name: organizations.name })
      .from(organizations).where(eq(organizations.id, authResult.organizationId)).limit(1);
    const [inviter] = await db.select({ full_name: profiles.full_name })
      .from(profiles).where(eq(profiles.id, authResult.userId!)).limit(1);

    const frontendUrl = c.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/accept-invite/${inviteToken}`;

    sendEmail(c.env.RESEND_API_KEY, c.env.FROM_EMAIL || 'noreply@csf-compass.pages.dev', email,
      `You're invited to ${org?.name || 'CSF Compass'}`,
      teamInviteEmail(email, inviter?.full_name || 'A team member', org?.name || 'CSF Compass', inviteLink)
    ).catch(err => console.error('Team invite email failed:', err));

    return c.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expires_at: invitation.expires_at,
    }, 201);
  } catch (error) {
    console.error('Invite member error:', error);
    return c.json({ error: 'Failed to send invitation' }, 500);
  }
});

// ─── POST /api/auth/accept-invite ────────────────────────────────────────────

app.post('/accept-invite', async (c) => {
  try {
    const body = await c.req.json() as Record<string, unknown>;
    const token = typeof body.token === 'string' ? body.token : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim() : '';

    if (!token) return c.json({ error: 'Invitation token is required' }, 400);
    const pwError = isValidPassword(password);
    if (pwError) return c.json({ error: pwError }, 400);
    if (!fullName) return c.json({ error: 'Full name is required' }, 400);

    const db = createDbClient(c.env.DB);

    const [invitation] = await db.select()
      .from(org_invitations)
      .where(eq(org_invitations.token, token))
      .limit(1);

    if (!invitation) {
      return c.json({ error: 'Invalid or expired invitation' }, 400);
    }
    if (invitation.accepted_at) {
      return c.json({ error: 'This invitation has already been used' }, 400);
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return c.json({ error: 'This invitation has expired' }, 400);
    }

    // Check email not already taken
    const [existingUser] = await db.select({ id: profiles.id })
      .from(profiles).where(eq(profiles.email, invitation.email)).limit(1);
    if (existingUser) {
      return c.json({ error: 'An account with this email already exists' }, 409);
    }

    // Create profile
    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(profiles).values({
      organization_id: invitation.organization_id,
      email: invitation.email,
      full_name: fullName,
      role: invitation.role,
      password_hash: passwordHash,
      email_verified: 1,
    }).returning();

    // Mark invitation as accepted
    await db.update(org_invitations).set({
      accepted_at: new Date(),
    }).where(eq(org_invitations.id, invitation.id));

    // Set session
    const authToken = await generateAuthToken(
      c.env.JWT_SECRET, user.id, invitation.organization_id, invitation.role
    );
    setAuthCookie(c, authToken);

    const [org] = await db.select({ id: organizations.id, name: organizations.name })
      .from(organizations).where(eq(organizations.id, invitation.organization_id)).limit(1);

    return c.json({
      token: authToken,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      organization: org || null,
    }, 201);
  } catch (error) {
    console.error('Accept invite error:', error);
    return c.json({ error: 'Failed to accept invitation' }, 500);
  }
});

export default app;
