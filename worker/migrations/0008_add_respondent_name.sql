-- Add respondent_name column to vendor_assessment_invitations
-- Stores the name of the person who actually filled out the assessment
ALTER TABLE vendor_assessment_invitations ADD COLUMN respondent_name TEXT;
