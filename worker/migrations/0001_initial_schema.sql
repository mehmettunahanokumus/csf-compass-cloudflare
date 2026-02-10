CREATE TABLE `ai_analysis_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`assessment_item_id` text,
	`operation_type` text NOT NULL,
	`model_used` text,
	`tokens_consumed` integer,
	`processing_time_ms` integer,
	`success` integer DEFAULT true,
	`error_message` text,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assessment_item_id`) REFERENCES `assessment_items`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_ai_logs_assessment` ON `ai_analysis_logs` (`assessment_id`);--> statement-breakpoint
CREATE TABLE `assessment_items` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`subcategory_id` text NOT NULL,
	`status` text DEFAULT 'not_assessed',
	`notes` text,
	`evidence_summary` text,
	`ai_suggested_status` text,
	`ai_confidence_score` real,
	`ai_reasoning` text,
	`ai_analyzed_at` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subcategory_id`) REFERENCES `csf_subcategories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_assessment_items_assessment` ON `assessment_items` (`assessment_id`);--> statement-breakpoint
CREATE INDEX `idx_assessment_items_subcategory` ON `assessment_items` (`subcategory_id`);--> statement-breakpoint
CREATE INDEX `idx_assessment_items_status` ON `assessment_items` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_assessment_subcategory` ON `assessment_items` (`assessment_id`,`subcategory_id`);--> statement-breakpoint
CREATE TABLE `assessments` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`assessment_type` text DEFAULT 'organization' NOT NULL,
	`vendor_id` text,
	`template_id` text,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft',
	`overall_score` real DEFAULT 0,
	`started_at` integer,
	`completed_at` integer,
	`created_by` text,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vendor_id`) REFERENCES `vendors`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`template_id`) REFERENCES `vendor_assessment_templates`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_assessments_organization` ON `assessments` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_assessments_status` ON `assessments` (`status`);--> statement-breakpoint
CREATE INDEX `idx_assessments_created_by` ON `assessments` (`created_by`);--> statement-breakpoint
CREATE INDEX `idx_assessments_type_vendor` ON `assessments` (`assessment_type`,`vendor_id`);--> statement-breakpoint
CREATE INDEX `idx_assessments_type` ON `assessments` (`assessment_type`);--> statement-breakpoint
CREATE TABLE `csf_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`function_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`function_id`) REFERENCES `csf_functions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `csf_functions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `csf_subcategories` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`priority` text DEFAULT 'medium',
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `csf_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `evidence_files` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`assessment_item_id` text,
	`wizard_step` integer,
	`file_name` text NOT NULL,
	`file_size` integer NOT NULL,
	`file_type` text,
	`r2_key` text NOT NULL,
	`uploaded_by` text,
	`uploaded_at` integer DEFAULT (strftime('%s', 'now') * 1000),
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assessment_item_id`) REFERENCES `assessment_items`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `evidence_files_r2_key_unique` ON `evidence_files` (`r2_key`);--> statement-breakpoint
CREATE INDEX `idx_evidence_files_assessment` ON `evidence_files` (`assessment_id`);--> statement-breakpoint
CREATE INDEX `idx_evidence_files_item` ON `evidence_files` (`assessment_item_id`);--> statement-breakpoint
CREATE TABLE `executive_summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`summary_text` text NOT NULL,
	`maturity_tier` integer,
	`top_strengths` text,
	`top_gaps` text,
	`generated_at` integer DEFAULT (strftime('%s', 'now') * 1000),
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `executive_summaries_assessment_id_unique` ON `executive_summaries` (`assessment_id`);--> statement-breakpoint
CREATE TABLE `gap_recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`assessment_item_id` text,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`priority` text DEFAULT 'medium',
	`effort` text,
	`impact` text,
	`status` text DEFAULT 'open',
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`assessment_item_id`) REFERENCES `assessment_items`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_gap_recommendations_assessment` ON `gap_recommendations` (`assessment_id`);--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`industry` text,
	`size` text,
	`description` text,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text,
	`email` text NOT NULL,
	`full_name` text,
	`role` text DEFAULT 'member',
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);--> statement-breakpoint
CREATE INDEX `idx_profiles_organization` ON `profiles` (`organization_id`);--> statement-breakpoint
CREATE TABLE `vendor_assessment_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_default` integer DEFAULT false,
	`created_by` text,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_templates_org` ON `vendor_assessment_templates` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_template_name_per_org` ON `vendor_assessment_templates` (`organization_id`,`name`);--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`name` text NOT NULL,
	`industry` text,
	`website` text,
	`contact_name` text,
	`contact_email` text,
	`contact_phone` text,
	`criticality_level` text DEFAULT 'medium' NOT NULL,
	`vendor_status` text DEFAULT 'active' NOT NULL,
	`risk_score` real DEFAULT 0,
	`last_assessment_date` integer,
	`next_assessment_due` integer,
	`notes` text,
	`created_by` text,
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_vendors_org` ON `vendors` (`organization_id`);--> statement-breakpoint
CREATE INDEX `idx_vendors_criticality` ON `vendors` (`criticality_level`);--> statement-breakpoint
CREATE INDEX `idx_vendors_status` ON `vendors` (`vendor_status`);--> statement-breakpoint
CREATE INDEX `idx_vendors_risk_score` ON `vendors` (`risk_score`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_vendor_name_per_org` ON `vendors` (`organization_id`,`name`);--> statement-breakpoint
CREATE TABLE `wizard_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`assessment_id` text NOT NULL,
	`step_number` integer NOT NULL,
	`step_name` text NOT NULL,
	`notes` text,
	`is_complete` integer DEFAULT false,
	`completion_percentage` real DEFAULT 0,
	`last_saved_at` integer DEFAULT (strftime('%s', 'now') * 1000),
	`created_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now') * 1000) NOT NULL,
	FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_wizard_progress_assessment` ON `wizard_progress` (`assessment_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_assessment_step` ON `wizard_progress` (`assessment_id`,`step_number`);