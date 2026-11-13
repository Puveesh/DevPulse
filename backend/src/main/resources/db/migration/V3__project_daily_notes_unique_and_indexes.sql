-- Migration V3: Update daily_notes table constraints and indexing

ALTER TABLE daily_notes DROP FOREIGN KEY fk_daily_notes_project;
ALTER TABLE daily_notes MODIFY COLUMN project_id BINARY(16) NOT NULL;
ALTER TABLE daily_notes ADD CONSTRAINT fk_daily_notes_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE daily_notes MODIFY COLUMN content LONGTEXT NOT NULL;
ALTER TABLE daily_notes ADD CONSTRAINT uk_daily_notes_project_date UNIQUE (project_id, note_date);
CREATE INDEX idx_daily_notes_user_project_date ON daily_notes(user_id, project_id, note_date);
