-- Phase 1 Migration: Support Initial Notes, Session Notes, Total Duration, and Pause Intervals

ALTER TABLE work_sessions ADD COLUMN initial_notes TEXT;
ALTER TABLE work_sessions ADD COLUMN session_notes TEXT;

-- Migrate any existing notes to session_notes
UPDATE work_sessions SET session_notes = notes WHERE notes IS NOT NULL;
ALTER TABLE work_sessions DROP COLUMN notes;

-- Add total_duration_seconds and copy duration_seconds
ALTER TABLE work_sessions ADD COLUMN total_duration_seconds BIGINT;
UPDATE work_sessions SET total_duration_seconds = duration_seconds WHERE duration_seconds IS NOT NULL;
ALTER TABLE work_sessions DROP COLUMN duration_seconds;

-- Generated column to enforce at most one ACTIVE or PAUSED session per user
ALTER TABLE work_sessions ADD COLUMN active_user_id BINARY(16) GENERATED ALWAYS AS (CASE WHEN status IN ('ACTIVE', 'PAUSED') THEN user_id ELSE NULL END);
CREATE UNIQUE INDEX uk_work_sessions_user_active ON work_sessions(active_user_id);

-- Session Pause Intervals Table
CREATE TABLE session_pause_intervals (
    id BINARY(16) NOT NULL,
    session_id BINARY(16) NOT NULL,
    paused_at DATETIME(6) NOT NULL,
    resumed_at DATETIME(6),
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_pause_intervals_session FOREIGN KEY (session_id) REFERENCES work_sessions(id) ON DELETE CASCADE,
    CONSTRAINT chk_pause_interval_time CHECK (resumed_at IS NULL OR resumed_at >= paused_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_pause_intervals_session_id ON session_pause_intervals(session_id);
