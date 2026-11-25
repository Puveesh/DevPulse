-- Migration V8: Add dedicated google_code_verifier column to oauth_sessions
ALTER TABLE oauth_sessions ADD COLUMN google_code_verifier VARCHAR(255) NULL;
