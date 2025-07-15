-- Migration: Create team_benchmarks table
-- Date: 2025-07-15

CREATE TABLE IF NOT EXISTS team_benchmarks (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
    team_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_team_benchmarks_team_id ON team_benchmarks(team_id);
CREATE INDEX IF NOT EXISTS idx_team_benchmarks_metric_name ON team_benchmarks(metric_name);
CREATE INDEX IF NOT EXISTS idx_team_benchmarks_period ON team_benchmarks(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_team_benchmarks_updated_at ON team_benchmarks(updated_at);

-- Create unique constraint to prevent duplicate metrics for same team/period
CREATE UNIQUE INDEX IF NOT EXISTS idx_team_benchmarks_unique ON team_benchmarks(team_id, metric_name, period_start, period_end); 