-- Create ai_saved_responses table
CREATE TABLE ai_saved_responses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    team_id TEXT,  -- nullable if user has no team
    tool_name TEXT NOT NULL,
    summary TEXT,  -- optional short description
    response_blob TEXT NOT NULL,  -- full JSON output
    is_favorite BOOLEAN DEFAULT FALSE,
    is_shared_public BOOLEAN DEFAULT FALSE,
    shared_slug TEXT UNIQUE,  -- for public shareable links
    is_shared_team BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add index on (user_id, team_id) for efficient lookup
CREATE INDEX idx_ai_saved_responses_user_team ON ai_saved_responses(user_id, team_id);

-- Add index on shared_slug for public sharing lookups
CREATE INDEX idx_ai_saved_responses_shared_slug ON ai_saved_responses(shared_slug);

-- Add index on created_at for sorting
CREATE INDEX idx_ai_saved_responses_created_at ON ai_saved_responses(created_at DESC); 