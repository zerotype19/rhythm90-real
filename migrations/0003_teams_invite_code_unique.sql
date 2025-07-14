-- Migration: 0003_teams_invite_code_unique.sql
-- Add invite_code TEXT UNIQUE to teams table, migrate data, and preserve all indexes/constraints

-- 1. Create new teams table with invite_code TEXT UNIQUE
CREATE TABLE teams_new (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    invite_code TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Copy data from old teams table to new table, generating random invite codes for existing teams
INSERT INTO teams_new (id, name, industry, owner_id, invite_code, created_at)
SELECT id, name, industry, owner_id,
       substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', abs(random()) % 36 + 1, 1) ||
       substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', abs(random()) % 36 + 1, 1) ||
       substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', abs(random()) % 36 + 1, 1) ||
       substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', abs(random()) % 36 + 1, 1) ||
       substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', abs(random()) % 36 + 1, 1) ||
       substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', abs(random()) % 36 + 1, 1),
       created_at
FROM teams;

-- 3. Drop old teams table
DROP TABLE teams;

-- 4. Rename new table to teams
ALTER TABLE teams_new RENAME TO teams;

-- 5. Recreate indexes for teams table
CREATE INDEX idx_teams_owner_id ON teams(owner_id);
CREATE INDEX idx_teams_invite_code ON teams(invite_code);

-- 6. (Foreign key already defined in table schema)

-- 7. Record the migration (using d1_migrations standard format)
INSERT INTO d1_migrations (name, applied_at) VALUES 
('0003_teams_invite_code_unique', datetime('now')); 