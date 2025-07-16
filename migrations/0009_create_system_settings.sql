-- Create system_settings table
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default OpenAI model
INSERT INTO system_settings (setting_key, setting_value) VALUES ('openai_model', 'gpt-3.5-turbo');

-- Insert default system announcement (empty)
INSERT INTO system_settings (setting_key, setting_value) VALUES ('system_announcement', ''); 