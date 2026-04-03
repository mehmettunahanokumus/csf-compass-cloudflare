-- Authentication system: password-based login, org invitations, org settings
-- Migration 0012

-- Add auth fields to profiles
ALTER TABLE profiles ADD COLUMN password_hash TEXT;
ALTER TABLE profiles ADD COLUMN password_reset_token TEXT;
ALTER TABLE profiles ADD COLUMN password_reset_expires_at INTEGER;
ALTER TABLE profiles ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;

-- Add branding fields to organizations
ALTER TABLE organizations ADD COLUMN logo_url TEXT;
ALTER TABLE organizations ADD COLUMN primary_color TEXT DEFAULT '#6366f1';

-- Org member invitations
CREATE TABLE IF NOT EXISTS org_invitations (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  accepted_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

CREATE INDEX idx_org_invitations_org ON org_invitations(organization_id);
CREATE INDEX idx_org_invitations_token ON org_invitations(token);
CREATE INDEX idx_org_invitations_email ON org_invitations(email);
