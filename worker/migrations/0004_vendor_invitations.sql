-- Vendor Self-Assessment Invitation System with Security Hardening

-- Main invitations table
CREATE TABLE IF NOT EXISTS vendor_assessment_invitations (
  id TEXT PRIMARY KEY,
  organization_assessment_id TEXT NOT NULL,
  vendor_self_assessment_id TEXT,
  vendor_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,

  vendor_contact_email TEXT NOT NULL,
  vendor_contact_name TEXT,

  -- JWT tokens (signed with JWT_SECRET)
  access_token TEXT NOT NULL UNIQUE,
  token_expires_at INTEGER NOT NULL,

  -- Session management (one-time token consumption)
  token_consumed_at INTEGER,                    -- When magic link was first used
  session_token TEXT,                           -- Short-lived session token (24hr)
  session_expires_at INTEGER,                   -- Session expiry timestamp

  -- Token revocation
  revoked_at INTEGER,                           -- When invitation was revoked
  revoked_by TEXT,                              -- User ID who revoked it

  -- Status tracking
  invitation_status TEXT NOT NULL DEFAULT 'pending',
  sent_at INTEGER NOT NULL,
  accessed_at INTEGER,                          -- First access
  last_accessed_at INTEGER,                     -- Updated on every interaction
  completed_at INTEGER,

  message TEXT,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),

  FOREIGN KEY (organization_assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_self_assessment_id) REFERENCES assessments(id) ON DELETE SET NULL,
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_invitations_org_assessment ON vendor_assessment_invitations(organization_assessment_id);
CREATE INDEX idx_invitations_vendor_assessment ON vendor_assessment_invitations(vendor_self_assessment_id);
CREATE INDEX idx_invitations_token ON vendor_assessment_invitations(access_token);
CREATE INDEX idx_invitations_session ON vendor_assessment_invitations(session_token);
CREATE INDEX idx_invitations_status ON vendor_assessment_invitations(invitation_status);

-- Audit log table
CREATE TABLE IF NOT EXISTS vendor_audit_log (
  id TEXT PRIMARY KEY,
  invitation_id TEXT NOT NULL,
  action TEXT NOT NULL,                        -- 'token_validated', 'token_rejected', 'token_expired', 'status_updated', 'assessment_submitted', 'rate_limited', 'token_revoked'
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT,                               -- JSON string with additional context
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),

  FOREIGN KEY (invitation_id) REFERENCES vendor_assessment_invitations(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_log_invitation ON vendor_audit_log(invitation_id);
CREATE INDEX idx_audit_log_action ON vendor_audit_log(action);
CREATE INDEX idx_audit_log_created ON vendor_audit_log(created_at);

-- Note: Rate limiting uses Workers KV (RATE_LIMIT_KV binding), not D1 table

-- Add linked assessment field to assessments table
ALTER TABLE assessments ADD COLUMN linked_assessment_id TEXT;
CREATE INDEX idx_assessments_linked ON assessments(linked_assessment_id);
