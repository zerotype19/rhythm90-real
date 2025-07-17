-- Create assistant chat sessions table
CREATE TABLE assistant_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

-- Create assistant chat messages table
CREATE TABLE assistant_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES assistant_chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_assistant_sessions_team ON assistant_chat_sessions(team_id);
CREATE INDEX idx_assistant_messages_session ON assistant_chat_messages(session_id);
CREATE INDEX idx_assistant_messages_created_at ON assistant_chat_messages(created_at); 