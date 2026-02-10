-- Migration: Seed Demo Data
-- Created: 2026-02-10
-- Description: Creates demo organization, user, vendors, and sample assessment for testing

-- ============================================================================
-- DEMO ORGANIZATION & USER
-- ============================================================================

-- Demo organization
INSERT INTO organizations (id, name, industry, size, description, created_at, updated_at)
VALUES (
  'demo-org-123',
  'Demo Organization',
  'Technology',
  'Medium',
  'Demo organization for CSF Compass testing and evaluation',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- Demo user profile
INSERT INTO profiles (id, organization_id, email, full_name, role, created_at, updated_at)
VALUES (
  'demo-user-456',
  'demo-org-123',
  'demo@example.com',
  'Demo User',
  'admin',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- ============================================================================
-- DEMO VENDORS
-- ============================================================================

INSERT INTO vendors (
  id, organization_id, name, industry, website, contact_name, contact_email, contact_phone,
  criticality_level, vendor_status, risk_score, notes, created_by, created_at, updated_at
) VALUES
(
  'vendor-001',
  'demo-org-123',
  'CloudHost Pro',
  'Cloud Services',
  'https://cloudhost.example',
  'John Smith',
  'security@cloudhost.example',
  '+1-555-0100',
  'critical',
  'active',
  0.00,
  'Primary cloud infrastructure provider - hosts all production workloads',
  'demo-user-456',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
),
(
  'vendor-002',
  'demo-org-123',
  'PaymentPro Solutions',
  'Financial Services',
  'https://paymentpro.example',
  'Jane Doe',
  'compliance@paymentpro.example',
  '+1-555-0200',
  'high',
  'active',
  0.00,
  'Payment processing gateway - handles all credit card transactions',
  'demo-user-456',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
),
(
  'vendor-003',
  'demo-org-123',
  'DataBackup Inc',
  'Data Storage',
  'https://databackup.example',
  'Bob Johnson',
  'info@databackup.example',
  '+1-555-0300',
  'medium',
  'active',
  0.00,
  'Backup and disaster recovery services - daily backups and 30-day retention',
  'demo-user-456',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- ============================================================================
-- VENDOR ASSESSMENT TEMPLATE
-- ============================================================================

INSERT INTO vendor_assessment_templates (
  id, organization_id, name, description, is_default, created_by, created_at, updated_at
) VALUES (
  'template-001',
  'demo-org-123',
  'Standard Vendor Assessment',
  'Comprehensive NIST CSF 2.0 assessment template for all vendors. Includes all 106 subcategories across the 6 CSF functions (Govern, Identify, Protect, Detect, Respond, Recover).',
  1,
  'demo-user-456',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- ============================================================================
-- SAMPLE ORGANIZATION ASSESSMENT
-- ============================================================================

INSERT INTO assessments (
  id, organization_id, assessment_type, vendor_id, template_id,
  name, description, status, overall_score,
  started_at, completed_at, created_by, created_at, updated_at
) VALUES (
  'assessment-001',
  'demo-org-123',
  'organization',
  NULL,
  NULL,
  '2026 Q1 Internal Security Assessment',
  'Comprehensive NIST CSF 2.0 assessment of organization-wide cybersecurity posture for Q1 2026. Focus areas: identity management, data protection, incident response readiness.',
  'in_progress',
  0.00,
  strftime('%s', 'now') * 1000,
  NULL,
  'demo-user-456',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- Create assessment items for the sample assessment (106 items, one per subcategory)
INSERT INTO assessment_items (id, assessment_id, subcategory_id, status, notes, created_at, updated_at)
SELECT
  lower(hex(randomblob(16))),
  'assessment-001',
  id,
  'not_assessed',
  NULL,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
FROM csf_subcategories;

-- Create wizard progress records (15 steps)
INSERT INTO wizard_progress (id, assessment_id, step_number, step_name, notes, is_complete, completion_percentage, last_saved_at, created_at, updated_at)
VALUES
  (lower(hex(randomblob(16))), 'assessment-001', 1, 'Governance', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 2, 'Microsoft Entra ID', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 3, 'Microsoft Defender', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 4, 'AWS Configuration', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 5, 'Network Security', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 6, 'Endpoint Protection', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 7, 'Data Protection', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 8, 'Identity & Access Management', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 9, 'Security Monitoring', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 10, 'Incident Response', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 11, 'Backup & Recovery', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 12, 'Vulnerability Management', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 13, 'Third-Party Risk', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 14, 'Security Training', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-001', 15, 'Business Continuity', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);

-- ============================================================================
-- SAMPLE VENDOR ASSESSMENT
-- ============================================================================

INSERT INTO assessments (
  id, organization_id, assessment_type, vendor_id, template_id,
  name, description, status, overall_score,
  started_at, completed_at, created_by, created_at, updated_at
) VALUES (
  'assessment-002',
  'demo-org-123',
  'vendor',
  'vendor-001',
  'template-001',
  'CloudHost Pro - Initial Assessment',
  'Initial third-party risk assessment for CloudHost Pro as our primary cloud infrastructure provider. Focus on data security, access controls, and incident response capabilities.',
  'draft',
  0.00,
  strftime('%s', 'now') * 1000,
  NULL,
  'demo-user-456',
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
);

-- Create assessment items for vendor assessment
INSERT INTO assessment_items (id, assessment_id, subcategory_id, status, notes, created_at, updated_at)
SELECT
  lower(hex(randomblob(16))),
  'assessment-002',
  id,
  'not_assessed',
  NULL,
  strftime('%s', 'now') * 1000,
  strftime('%s', 'now') * 1000
FROM csf_subcategories;

-- Create wizard progress for vendor assessment
INSERT INTO wizard_progress (id, assessment_id, step_number, step_name, notes, is_complete, completion_percentage, last_saved_at, created_at, updated_at)
VALUES
  (lower(hex(randomblob(16))), 'assessment-002', 1, 'Governance', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 2, 'Microsoft Entra ID', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 3, 'Microsoft Defender', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 4, 'AWS Configuration', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 5, 'Network Security', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 6, 'Endpoint Protection', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 7, 'Data Protection', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 8, 'Identity & Access Management', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 9, 'Security Monitoring', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 10, 'Incident Response', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 11, 'Backup & Recovery', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 12, 'Vulnerability Management', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 13, 'Third-Party Risk', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 14, 'Security Training', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  (lower(hex(randomblob(16))), 'assessment-002', 15, 'Business Continuity', NULL, 0, 0.00, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);
