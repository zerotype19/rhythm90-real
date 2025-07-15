-- Add updated_at column to ai_saved_responses table
ALTER TABLE ai_saved_responses ADD COLUMN updated_at DATETIME;

-- Update existing records to have updated_at = created_at
UPDATE ai_saved_responses SET updated_at = created_at WHERE updated_at IS NULL; 