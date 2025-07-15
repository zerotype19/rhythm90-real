-- Add additional indexes for enhanced team shared page performance

-- Add composite index for team shared filtering (optimized for the main query)
CREATE INDEX idx_ai_saved_responses_team_shared ON ai_saved_responses(team_id, is_shared_team, created_at DESC);

-- Add index on tool_name for filtering
CREATE INDEX idx_ai_saved_responses_tool_name ON ai_saved_responses(tool_name);

-- Add index on is_favorite for favorites filtering
CREATE INDEX idx_ai_saved_responses_favorite ON ai_saved_responses(is_favorite); 