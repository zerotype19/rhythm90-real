-- Add is_admin field to users table
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Set kevin.mcgovern@gmail.com as admin
UPDATE users SET is_admin = TRUE WHERE email = 'kevin.mcgovern@gmail.com'; 