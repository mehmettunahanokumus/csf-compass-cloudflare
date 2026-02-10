/**
 * Drizzle ORM Schema for CSF Compass
 * SQLite (D1) Database
 *
 * Key Type Conversions from PostgreSQL:
 * - UUID → TEXT (36 chars with hyphens)
 * - TIMESTAMP WITH TIMEZONE → INTEGER (Unix milliseconds)
 * - JSONB → TEXT (JSON.stringify/parse)
 * - Arrays → TEXT (JSON arrays as strings)
 * - DECIMAL → REAL (SQLite's floating point)
 */

import { sqliteTable, text, integer, real, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * Organizations table
 */
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  industry: text('industry'),
  size: text('size'), // Small, Medium, Large, Enterprise
  description: text('description'),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

/**
 * User profiles table
 */
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organization_id: text('organization_id').references(() => organizations.id, { onDelete: 'set null' }),
  email: text('email').notNull().unique(),
  full_name: text('full_name'),
  role: text('role').default('member'), // admin, member, viewer
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  orgIdx: index('idx_profiles_organization').on(table.organization_id),
}));

/**
 * Vendors table
 */
export const vendors = sqliteTable('vendors', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organization_id: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  industry: text('industry'),
  website: text('website'),
  contact_name: text('contact_name'),
  contact_email: text('contact_email'),
  contact_phone: text('contact_phone'),

  // Risk management
  criticality_level: text('criticality_level').notNull().default('medium'), // low, medium, high, critical
  vendor_status: text('vendor_status').notNull().default('active'), // active, inactive, under_review, terminated
  risk_score: real('risk_score').default(0.00),
  last_assessment_date: integer('last_assessment_date', { mode: 'timestamp_ms' }),
  next_assessment_due: integer('next_assessment_due', { mode: 'timestamp_ms' }),

  // Metadata
  notes: text('notes'),
  created_by: text('created_by').references(() => profiles.id),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  orgIdx: index('idx_vendors_org').on(table.organization_id),
  criticalityIdx: index('idx_vendors_criticality').on(table.criticality_level),
  statusIdx: index('idx_vendors_status').on(table.vendor_status),
  riskScoreIdx: index('idx_vendors_risk_score').on(table.risk_score),
  uniqueNamePerOrg: uniqueIndex('unique_vendor_name_per_org').on(table.organization_id, table.name),
}));

/**
 * Assessments table
 */
export const assessments = sqliteTable('assessments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organization_id: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  assessment_type: text('assessment_type').notNull().default('organization'), // organization, vendor
  vendor_id: text('vendor_id').references(() => vendors.id, { onDelete: 'cascade' }),
  template_id: text('template_id').references(() => vendor_assessment_templates.id, { onDelete: 'set null' }),

  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('draft'), // draft, in_progress, completed, archived
  overall_score: real('overall_score').default(0.00), // 0-100

  started_at: integer('started_at', { mode: 'timestamp_ms' }),
  completed_at: integer('completed_at', { mode: 'timestamp_ms' }),
  created_by: text('created_by').references(() => profiles.id, { onDelete: 'set null' }),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  orgIdx: index('idx_assessments_organization').on(table.organization_id),
  statusIdx: index('idx_assessments_status').on(table.status),
  createdByIdx: index('idx_assessments_created_by').on(table.created_by),
  typeVendorIdx: index('idx_assessments_type_vendor').on(table.assessment_type, table.vendor_id),
  typeIdx: index('idx_assessments_type').on(table.assessment_type),
}));

/**
 * Vendor assessment templates table
 */
export const vendor_assessment_templates = sqliteTable('vendor_assessment_templates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organization_id: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  is_default: integer('is_default', { mode: 'boolean' }).default(false),

  created_by: text('created_by').references(() => profiles.id),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  orgIdx: index('idx_templates_org').on(table.organization_id),
  uniqueNamePerOrg: uniqueIndex('unique_template_name_per_org').on(table.organization_id, table.name),
}));

// ============================================================================
// NIST CSF 2.0 REFERENCE TABLES
// ============================================================================

/**
 * CSF Functions (6 total: GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER)
 */
export const csf_functions = sqliteTable('csf_functions', {
  id: text('id').primaryKey(), // GV, ID, PR, DE, RS, RC
  name: text('name').notNull(),
  description: text('description'),
  sort_order: integer('sort_order').notNull(),
});

/**
 * CSF Categories (22 total)
 */
export const csf_categories = sqliteTable('csf_categories', {
  id: text('id').primaryKey(), // e.g., GV.OC, ID.AM, PR.AA
  function_id: text('function_id').notNull().references(() => csf_functions.id),
  name: text('name').notNull(),
  description: text('description'),
  sort_order: integer('sort_order').notNull(),
});

/**
 * CSF Subcategories (106 total)
 */
export const csf_subcategories = sqliteTable('csf_subcategories', {
  id: text('id').primaryKey(), // e.g., GV.OC-01, ID.AM-01
  category_id: text('category_id').notNull().references(() => csf_categories.id),
  name: text('name').notNull(),
  description: text('description'),
  priority: text('priority').default('medium'), // high, medium, low
  sort_order: integer('sort_order').notNull(),
});

// ============================================================================
// ASSESSMENT DATA TABLES
// ============================================================================

/**
 * Assessment items (106 per assessment)
 */
export const assessment_items = sqliteTable('assessment_items', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  assessment_id: text('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  subcategory_id: text('subcategory_id').notNull().references(() => csf_subcategories.id),
  status: text('status').default('not_assessed'), // compliant, partial, non_compliant, not_assessed, not_applicable
  notes: text('notes'),
  evidence_summary: text('evidence_summary'),

  // AI analysis results
  ai_suggested_status: text('ai_suggested_status'),
  ai_confidence_score: real('ai_confidence_score'), // 0.00 to 1.00
  ai_reasoning: text('ai_reasoning'),
  ai_analyzed_at: integer('ai_analyzed_at', { mode: 'timestamp_ms' }),

  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  assessmentIdx: index('idx_assessment_items_assessment').on(table.assessment_id),
  subcategoryIdx: index('idx_assessment_items_subcategory').on(table.subcategory_id),
  statusIdx: index('idx_assessment_items_status').on(table.status),
  uniqueAssessmentSubcategory: uniqueIndex('unique_assessment_subcategory').on(table.assessment_id, table.subcategory_id),
}));

/**
 * Wizard progress tracking
 */
export const wizard_progress = sqliteTable('wizard_progress', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  assessment_id: text('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  step_number: integer('step_number').notNull(), // 1-15
  step_name: text('step_name').notNull(),
  notes: text('notes'),
  is_complete: integer('is_complete', { mode: 'boolean' }).default(false),
  completion_percentage: real('completion_percentage').default(0.00),
  last_saved_at: integer('last_saved_at', { mode: 'timestamp_ms' }).default(sql`(strftime('%s', 'now') * 1000)`),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  assessmentIdx: index('idx_wizard_progress_assessment').on(table.assessment_id),
  uniqueAssessmentStep: uniqueIndex('unique_assessment_step').on(table.assessment_id, table.step_number),
}));

/**
 * Evidence files
 */
export const evidence_files = sqliteTable('evidence_files', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  assessment_id: text('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  assessment_item_id: text('assessment_item_id').references(() => assessment_items.id, { onDelete: 'cascade' }),
  wizard_step: integer('wizard_step'), // 1-15

  file_name: text('file_name').notNull(),
  file_size: integer('file_size').notNull(), // bytes
  file_type: text('file_type'),
  r2_key: text('r2_key').notNull().unique(), // Path in R2 bucket

  uploaded_by: text('uploaded_by').references(() => profiles.id, { onDelete: 'set null' }),
  uploaded_at: integer('uploaded_at', { mode: 'timestamp_ms' }).default(sql`(strftime('%s', 'now') * 1000)`),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  assessmentIdx: index('idx_evidence_files_assessment').on(table.assessment_id),
  itemIdx: index('idx_evidence_files_item').on(table.assessment_item_id),
}));

// ============================================================================
// AI ANALYSIS TABLES
// ============================================================================

/**
 * AI analysis logs (for tracking usage and debugging)
 */
export const ai_analysis_logs = sqliteTable('ai_analysis_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  assessment_id: text('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  assessment_item_id: text('assessment_item_id').references(() => assessment_items.id, { onDelete: 'cascade' }),

  operation_type: text('operation_type').notNull(), // evidence_analysis, gap_identification, recommendations, executive_summary
  model_used: text('model_used'),
  tokens_consumed: integer('tokens_consumed'),
  processing_time_ms: integer('processing_time_ms'),

  success: integer('success', { mode: 'boolean' }).default(true),
  error_message: text('error_message'),

  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  assessmentIdx: index('idx_ai_logs_assessment').on(table.assessment_id),
}));

/**
 * Gap recommendations
 */
export const gap_recommendations = sqliteTable('gap_recommendations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  assessment_id: text('assessment_id').notNull().references(() => assessments.id, { onDelete: 'cascade' }),
  assessment_item_id: text('assessment_item_id').references(() => assessment_items.id, { onDelete: 'set null' }),

  title: text('title').notNull(),
  description: text('description').notNull(),
  priority: text('priority').default('medium'), // quick_win, medium_term, long_term
  effort: text('effort'), // low, medium, high
  impact: text('impact'), // low, medium, high

  status: text('status').default('open'), // open, in_progress, completed, dismissed

  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
}, (table) => ({
  assessmentIdx: index('idx_gap_recommendations_assessment').on(table.assessment_id),
}));

/**
 * Executive summaries
 */
export const executive_summaries = sqliteTable('executive_summaries', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  assessment_id: text('assessment_id').notNull().unique().references(() => assessments.id, { onDelete: 'cascade' }),

  summary_text: text('summary_text').notNull(),
  maturity_tier: integer('maturity_tier'), // 1-4

  top_strengths: text('top_strengths'), // JSON array stored as text
  top_gaps: text('top_gaps'), // JSON array stored as text

  generated_at: integer('generated_at', { mode: 'timestamp_ms' }).default(sql`(strftime('%s', 'now') * 1000)`),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
  updated_at: integer('updated_at', { mode: 'timestamp_ms' }).notNull().default(sql`(strftime('%s', 'now') * 1000)`),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type Assessment = typeof assessments.$inferSelect;
export type NewAssessment = typeof assessments.$inferInsert;

export type VendorAssessmentTemplate = typeof vendor_assessment_templates.$inferSelect;
export type NewVendorAssessmentTemplate = typeof vendor_assessment_templates.$inferInsert;

export type CsfFunction = typeof csf_functions.$inferSelect;
export type CsfCategory = typeof csf_categories.$inferSelect;
export type CsfSubcategory = typeof csf_subcategories.$inferSelect;

export type AssessmentItem = typeof assessment_items.$inferSelect;
export type NewAssessmentItem = typeof assessment_items.$inferInsert;

export type WizardProgress = typeof wizard_progress.$inferSelect;
export type NewWizardProgress = typeof wizard_progress.$inferInsert;

export type EvidenceFile = typeof evidence_files.$inferSelect;
export type NewEvidenceFile = typeof evidence_files.$inferInsert;

export type AiAnalysisLog = typeof ai_analysis_logs.$inferSelect;
export type NewAiAnalysisLog = typeof ai_analysis_logs.$inferInsert;

export type GapRecommendation = typeof gap_recommendations.$inferSelect;
export type NewGapRecommendation = typeof gap_recommendations.$inferInsert;

export type ExecutiveSummary = typeof executive_summaries.$inferSelect;
export type NewExecutiveSummary = typeof executive_summaries.$inferInsert;
