-- Migration V6: Add updated_at column to oauth_sessions and oauth_tickets to satisfy BaseEntity schema validation
ALTER TABLE oauth_sessions ADD COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
ALTER TABLE oauth_tickets ADD COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6);
