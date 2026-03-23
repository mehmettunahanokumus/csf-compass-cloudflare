-- Fix: Remove consolidated questions that reference non-existent CSF 2.0 categories.
-- CQ-ID.GV references "ID.GV" — doesn't exist in CSF 2.0 (governance moved to GV function).
-- CQ-ID.SC references "ID.SC" — doesn't exist in CSF 2.0 (supply chain moved to GV.SC).
--
-- These had zero subcategory mappings, causing "No mapped subcategories found" errors
-- when vendors tried to answer them. Their topics are already fully covered by:
--   CQ-GV.OC + CQ-GV.OV (governance oversight) and CQ-GV.SC (supply chain).
--
-- Adding overlapping mappings to the same subcategories would cause answer overwrites,
-- so we remove the orphaned questions instead. This brings the count from 25 to 23.

DELETE FROM consolidated_question_mappings WHERE consolidated_question_id IN ('CQ-ID.GV', 'CQ-ID.SC');
DELETE FROM consolidated_questions WHERE id IN ('CQ-ID.GV', 'CQ-ID.SC');
