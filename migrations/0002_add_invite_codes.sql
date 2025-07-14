-- Add invite codes to teams table
-- Migration: 0002_add_invite_codes.sql

-- Add invite_code column to teams table (without UNIQUE constraint initially)
ALTER TABLE teams ADD COLUMN invite_code TEXT;

-- Create index for invite code lookups
CREATE INDEX idx_teams_invite_code ON teams(invite_code);

-- Record the migration
INSERT INTO migrations (migration_name, description, checksum) VALUES 
('0002_add_invite_codes', 'Add invite_code column to teams table for team joining functionality', 'sha256:add_invite_codes_v1'); 