-- DevPulse Initial Schema Migration (PostgreSQL)
-- Matches current JPA entities and replaces historical MySQL migrations for production PostgreSQL (Neon).

-- 1. Users Table
CREATE TABLE users (
    id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    professional_title VARCHAR(150),
    experience_level VARCHAR(50),
    programming_languages TEXT,
    technologies TEXT,
    github_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    current_focus TEXT,
    timezone VARCHAR(100),
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    time_format VARCHAR(20) DEFAULT '24-hour',
    week_start_day VARCHAR(20) DEFAULT 'Monday',
    theme VARCHAR(50) DEFAULT 'dark',
    profile_image TEXT,
    last_seen_at TIMESTAMP(6) WITH TIME ZONE,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE INDEX idx_users_last_seen_at ON users (last_seen_at);

-- 2. Projects Table
CREATE TABLE projects (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    repository_url VARCHAR(500),
    tech_stack VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_user_status ON projects(user_id, status);

-- 3. Tasks Table
CREATE TABLE tasks (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    project_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'TODO',
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    due_date TIMESTAMP(6) WITH TIME ZONE,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- 4. Work Sessions Table
CREATE TABLE work_sessions (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    project_id UUID,
    task_id UUID,
    title VARCHAR(255) NOT NULL,
    initial_notes TEXT,
    session_notes TEXT,
    started_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP(6) WITH TIME ZONE,
    total_duration_seconds BIGINT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT chk_work_sessions_time CHECK (ended_at IS NULL OR ended_at >= started_at),
    CONSTRAINT fk_work_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_work_sessions_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    CONSTRAINT fk_work_sessions_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

CREATE INDEX idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX idx_work_sessions_user_started ON work_sessions(user_id, started_at);
CREATE INDEX idx_work_sessions_status ON work_sessions(user_id, status);

-- PostgreSQL Partial Unique Index: enforce at most one ACTIVE or PAUSED session per user
CREATE UNIQUE INDEX uk_work_sessions_user_active ON work_sessions(user_id) WHERE status IN ('ACTIVE', 'PAUSED');

-- 5. Session Pause Intervals Table
CREATE TABLE session_pause_intervals (
    id UUID NOT NULL,
    session_id UUID NOT NULL,
    paused_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    resumed_at TIMESTAMP(6) WITH TIME ZONE,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_pause_intervals_session FOREIGN KEY (session_id) REFERENCES work_sessions(id) ON DELETE CASCADE,
    CONSTRAINT chk_pause_interval_time CHECK (resumed_at IS NULL OR resumed_at >= paused_at)
);

CREATE INDEX idx_pause_intervals_session_id ON session_pause_intervals(session_id);

-- 6. Daily Notes Table
CREATE TABLE daily_notes (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    project_id UUID NOT NULL,
    note_date DATE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_daily_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_daily_notes_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT uk_daily_notes_project_date UNIQUE (project_id, note_date)
);

CREATE INDEX idx_daily_notes_user_project_date ON daily_notes(user_id, project_id, note_date);
CREATE INDEX idx_daily_notes_user_date ON daily_notes(user_id, note_date);

-- 7. Attachments Table
CREATE TABLE attachments (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    project_id UUID,
    filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    storage_key VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_attachments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_attachments_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE INDEX idx_attachments_user_id ON attachments(user_id);
CREATE INDEX idx_attachments_project_id ON attachments(project_id);

-- 8. OAuth Sessions Table
CREATE TABLE oauth_sessions (
    id UUID NOT NULL,
    state VARCHAR(255) NOT NULL,
    client_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    code_challenge VARCHAR(255),
    google_code_verifier VARCHAR(255),
    user_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_oauth_sessions_state UNIQUE (state)
);

CREATE INDEX idx_oauth_sessions_state ON oauth_sessions(state);

-- 9. User Authentication Identities Table
CREATE TABLE user_auth_identities (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_subject VARCHAR(255) NOT NULL,
    provider_email VARCHAR(255) NOT NULL,
    provider_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_identities_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_identities_provider_sub UNIQUE (provider, provider_subject),
    CONSTRAINT uk_identities_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX idx_identities_user_id ON user_auth_identities(user_id);
CREATE INDEX idx_identities_provider_sub ON user_auth_identities(provider, provider_subject);
