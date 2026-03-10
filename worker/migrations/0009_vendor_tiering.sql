-- Migration 0009: Vendor Criticality Tiering & Adaptive Assessment
-- Adds tiering metadata to vendors, min_tier to subcategories, evidence_required to assessment_items

-- 1. Add tiering metadata columns to vendors
ALTER TABLE vendors ADD COLUMN tiering_score INTEGER DEFAULT 0;
ALTER TABLE vendors ADD COLUMN tiering_completed_at INTEGER;
ALTER TABLE vendors ADD COLUMN tiering_answers TEXT;

-- 2. Add min_tier to csf_subcategories
ALTER TABLE csf_subcategories ADD COLUMN min_tier TEXT DEFAULT 'low';

-- 3. Seed min_tier from existing priority column
-- priority='high' → min_tier='low' (always ask high-priority questions)
-- priority='medium' → min_tier='medium'
-- priority='low' → min_tier='high'
UPDATE csf_subcategories SET min_tier = CASE
  WHEN priority = 'high' THEN 'low'
  WHEN priority = 'medium' THEN 'medium'
  WHEN priority = 'low' THEN 'high'
  ELSE 'low'
END;

-- 4. Add evidence_required to assessment_items
ALTER TABLE assessment_items ADD COLUMN evidence_required INTEGER DEFAULT 0;
