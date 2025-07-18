-- Add columns for storing full prompt context
ALTER TABLE ai_saved_responses ADD COLUMN system_prompt TEXT;
ALTER TABLE ai_saved_responses ADD COLUMN user_input TEXT;
ALTER TABLE ai_saved_responses ADD COLUMN final_prompt TEXT;
ALTER TABLE ai_saved_responses ADD COLUMN raw_response_text TEXT; 