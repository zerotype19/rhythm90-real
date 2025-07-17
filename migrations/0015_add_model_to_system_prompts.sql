-- Add model column to ai_system_prompts table
ALTER TABLE ai_system_prompts
ADD COLUMN model VARCHAR(50) NOT NULL DEFAULT 'gpt-4-turbo';

-- Update all existing rows to have the default model
UPDATE ai_system_prompts 
SET model = 'gpt-4-turbo' 
WHERE model IS NULL OR model = ''; 