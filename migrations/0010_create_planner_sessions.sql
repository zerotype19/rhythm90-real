-- Create planner_sessions table for Quarterly Planner module
-- Migration: 0010_create_planner_sessions.sql

CREATE TABLE planner_sessions (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    created_by TEXT NOT NULL,
    inputs_json TEXT NOT NULL, -- JSON string containing all planner inputs
    output_summary TEXT, -- Generated summary from AI
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX idx_planner_sessions_team_id ON planner_sessions(team_id);
CREATE INDEX idx_planner_sessions_created_by ON planner_sessions(created_by);
CREATE INDEX idx_planner_sessions_created_at ON planner_sessions(created_at); 