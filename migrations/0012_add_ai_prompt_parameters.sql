-- Migration: Add AI prompt parameters to ai_system_prompts table
-- Date: 2025-01-15

-- Add new columns with default values (SQLite doesn't support multiple ADD COLUMN in one statement)
ALTER TABLE ai_system_prompts ADD COLUMN max_tokens INT DEFAULT 1000;
ALTER TABLE ai_system_prompts ADD COLUMN temperature FLOAT DEFAULT 0.7;
ALTER TABLE ai_system_prompts ADD COLUMN top_p FLOAT DEFAULT 1.0;
ALTER TABLE ai_system_prompts ADD COLUMN frequency_penalty FLOAT DEFAULT 0.0;
ALTER TABLE ai_system_prompts ADD COLUMN presence_penalty FLOAT DEFAULT 0.0;

-- Update existing records to have the default values
UPDATE ai_system_prompts 
SET 
    max_tokens = 1000,
    temperature = 0.7,
    top_p = 1.0,
    frequency_penalty = 0.0,
    presence_penalty = 0.0
WHERE max_tokens IS NULL; 