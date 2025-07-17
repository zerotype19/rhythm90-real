-- Fix NOT NULL constraints on assistant table primary keys
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the tables

-- Drop existing tables
DROP TABLE IF EXISTS assistant_chat_messages;
DROP TABLE IF EXISTS assistant_chat_sessions;

-- Recreate assistant_chat_sessions with proper NOT NULL constraints
CREATE TABLE assistant_chat_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    team_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Recreate assistant_chat_messages with proper NOT NULL constraints
CREATE TABLE assistant_chat_messages (
    id TEXT PRIMARY KEY NOT NULL,
    session_id TEXT NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assistant_chat_sessions(id) ON DELETE CASCADE
);

-- Recreate indexes
CREATE INDEX idx_assistant_sessions_team ON assistant_chat_sessions(team_id);
CREATE INDEX idx_assistant_messages_session ON assistant_chat_messages(session_id);
CREATE INDEX idx_assistant_messages_created_at ON assistant_chat_messages(created_at); 