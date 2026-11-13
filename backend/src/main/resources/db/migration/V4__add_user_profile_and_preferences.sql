-- Migration V4: Add developer profile and workspace preferences to users table

ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN professional_title VARCHAR(150);
ALTER TABLE users ADD COLUMN experience_level VARCHAR(50);
ALTER TABLE users ADD COLUMN programming_languages TEXT;
ALTER TABLE users ADD COLUMN technologies TEXT;
ALTER TABLE users ADD COLUMN github_url VARCHAR(500);
ALTER TABLE users ADD COLUMN portfolio_url VARCHAR(500);
ALTER TABLE users ADD COLUMN current_focus TEXT;
ALTER TABLE users ADD COLUMN timezone VARCHAR(100);
ALTER TABLE users ADD COLUMN date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD';
ALTER TABLE users ADD COLUMN time_format VARCHAR(20) DEFAULT '24-hour';
ALTER TABLE users ADD COLUMN week_start_day VARCHAR(20) DEFAULT 'Monday';
ALTER TABLE users ADD COLUMN theme VARCHAR(50) DEFAULT 'dark';
ALTER TABLE users ADD COLUMN profile_image LONGTEXT;
