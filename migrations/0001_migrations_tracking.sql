-- Migration tracking table
CREATE TABLE migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    migration_name TEXT NOT NULL UNIQUE,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    checksum TEXT
);

-- Record the initial schema migration
INSERT INTO migrations (migration_name, description, checksum) VALUES 
('0000_initial_schema', 'Initial database schema for Rhythm90 Companion App - users, teams, team_members, subscriptions, plays, signals tables with indexes', 'sha256:initial_schema_v1'); 