-- Migration: Create AI Usage Logs Table
-- This table tracks usage of AI tools for analytics and subscription limits

CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient queries by user_id and timestamp
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_timestamp 
ON ai_usage_logs(user_id, timestamp);

-- Create index for tool usage analytics
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_tool_timestamp 
ON ai_usage_logs(tool_name, timestamp); 