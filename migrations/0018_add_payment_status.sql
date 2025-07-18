-- Add payment_status column to users table
ALTER TABLE users ADD COLUMN payment_status TEXT DEFAULT 'trial'; 