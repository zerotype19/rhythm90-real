-- Create assistant chat sessions table (corrected for SQLite)
CREATE TABLE assistant_chat_sessions (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Create assistant chat messages table (corrected for SQLite)
CREATE TABLE assistant_chat_messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES assistant_chat_sessions(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_assistant_sessions_team ON assistant_chat_sessions(team_id);
CREATE INDEX idx_assistant_messages_session ON assistant_chat_messages(session_id);
CREATE INDEX idx_assistant_messages_created_at ON assistant_chat_messages(created_at); 