-- Migration 0005: Company Groups
-- Adds company_groups table and group_id to vendors

CREATE TABLE IF NOT EXISTS company_groups (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  logo_url TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_company_groups_org ON company_groups(organization_id);

ALTER TABLE vendors ADD COLUMN group_id TEXT REFERENCES company_groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_group ON vendors(group_id);
