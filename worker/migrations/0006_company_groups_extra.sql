-- Phase 25: Add extra fields to company_groups table
-- risk_level: overall risk classification for the group entity
-- primary_contact: main point-of-contact name/title for the group
ALTER TABLE company_groups ADD COLUMN risk_level TEXT DEFAULT 'medium';
ALTER TABLE company_groups ADD COLUMN primary_contact TEXT;
