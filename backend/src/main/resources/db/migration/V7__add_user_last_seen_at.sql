-- Migration V7: Add last_seen_at column for user heartbeat and active session monitoring
ALTER TABLE users ADD COLUMN last_seen_at DATETIME(6) NULL;
UPDATE users SET last_seen_at = updated_at WHERE last_seen_at IS NULL;
CREATE INDEX idx_users_last_seen_at ON users (last_seen_at);
