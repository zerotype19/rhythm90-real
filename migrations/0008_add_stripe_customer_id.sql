-- Add stripe_customer_id column to users table
-- Migration: 0008_add_stripe_customer_id.sql

ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id); 