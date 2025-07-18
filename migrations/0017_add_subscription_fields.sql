-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN payment_status TEXT DEFAULT 'trial';

-- Create usage_logs table for tracking tool usage per user per month
CREATE TABLE usage_logs (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    usage_date TEXT NOT NULL DEFAULT (date('now')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, tool_name, usage_date)
);

-- Create index for efficient usage queries
CREATE INDEX idx_usage_logs_user_tool_date ON usage_logs(user_id, tool_name, usage_date); 