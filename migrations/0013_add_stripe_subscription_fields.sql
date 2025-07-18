-- Add Stripe subscription fields to users table
-- Migration: 0013_add_stripe_subscription_fields.sql

-- Add subscription fields to users table
ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN plan_tier TEXT DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro_limited', 'pro_unlimited'));
ALTER TABLE users ADD COLUMN trial_end_date DATETIME;

-- Create indexes for performance
CREATE INDEX idx_users_stripe_subscription_id ON users(stripe_subscription_id);
CREATE INDEX idx_users_plan_tier ON users(plan_tier);
CREATE INDEX idx_users_trial_end_date ON users(trial_end_date);

-- Create usage_logs table for tracking tool usage
CREATE TABLE usage_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    usage_count INTEGER DEFAULT 1,
    period_start DATETIME NOT NULL,
    period_end DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for usage_logs
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_tool_name ON usage_logs(tool_name);
CREATE INDEX idx_usage_logs_period ON usage_logs(period_start, period_end);
CREATE INDEX idx_usage_logs_user_tool_period ON usage_logs(user_id, tool_name, period_start, period_end); 