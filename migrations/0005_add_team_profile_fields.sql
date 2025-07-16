-- Add team profile fields to teams table
ALTER TABLE teams ADD COLUMN focus_areas TEXT;
ALTER TABLE teams ADD COLUMN team_description TEXT;

-- Update existing teams to have default values
UPDATE teams SET focus_areas = '[]' WHERE focus_areas IS NULL;
UPDATE teams SET team_description = '' WHERE team_description IS NULL; 