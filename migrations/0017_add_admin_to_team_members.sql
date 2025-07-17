-- Add is_admin field to team_members table
-- Migration: 0017_add_admin_to_team_members.sql

-- Add is_admin column to team_members table
ALTER TABLE team_members ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Set existing team owners as admins
UPDATE team_members SET is_admin = TRUE WHERE role = 'owner';

-- Create index for admin lookups
CREATE INDEX idx_team_members_is_admin ON team_members(is_admin);

-- Record the migration
INSERT INTO d1_migrations (name, applied_at) VALUES 
('0017_add_admin_to_team_members', datetime('now')); 