-- Create dashboard_announcements table
CREATE TABLE dashboard_announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    link TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    author_email TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    CHECK (author_email = 'kevin.mcgovern@gmail.com')
);

-- Add indexes for performance
CREATE INDEX idx_dashboard_announcements_active ON dashboard_announcements(is_active);
CREATE INDEX idx_dashboard_announcements_created_at ON dashboard_announcements(created_at);

-- Insert migration record
INSERT INTO d1_migrations (name, applied_at) VALUES ('0008_create_dashboard_announcements', datetime('now')); 