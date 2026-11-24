# Fresh MySQL Database Setup & Migrations Guide

DevPulse uses **Flyway** for automated database versioning. When deploying to a completely fresh MySQL database on Railway, the complete schema is automatically initialized on the first application startup.

---

## 1. Schema Migration History

The migrations are located in [backend/src/main/resources/db/migration/](file:///e:/Projects/DevPulse%20Desktop%20Version/backend/src/main/resources/db/migration):

1. **`V1__init_schema.sql`**
   - Creates `users` table (UUID primary keys stored as `BINARY(16)`, unique lowercase email, BCrypt password hash).
   - Creates `projects` table (cascading foreign key to users, tech stack, repository URL, project status).
   - Creates `tasks` table (user relationship, nullable project foreign key, priority, status enum).
   - Creates `work_sessions` table (user relationship, started/ended timestamps, check constraints).
   - Creates `daily_notes` table (user/project note tracking).
   - Creates `attachments` table (document and telemetry metadata).

2. **`V2__session_timer_and_pause_intervals.sql`**
   - Adds `initial_notes` and `session_notes` to work sessions.
   - Adds `total_duration_seconds` to work sessions.
   - Enforces unique active/paused session per user via generated column `active_user_id`.
   - Creates `session_pause_intervals` table with foreign key constraint and check constraints.

3. **`V3__project_daily_notes_unique_and_indexes.sql`**
   - Enforces unique note per project and date (`uk_daily_notes_project_date`).
   - Upgrades daily note content to `LONGTEXT`.
   - Adds composite index `idx_daily_notes_user_project_date`.

4. **`V4__add_user_profile_and_preferences.sql`**
   - Adds developer profile fields to `users`: bio, title, experience, languages, technologies, URLs, focus.
   - Adds user preferences: timezone, date format, time format, week start day, theme.
   - Adds `profile_image` (`LONGTEXT`) for storing Base64 profile photos in the database.

---

## 2. Automatic Fresh Database Initialization

When the backend container boots against a fresh MySQL instance:
1. Spring Boot connects via HikariCP.
2. Flyway verifies the `flyway_schema_history` table (creates it if missing).
3. Flyway detects an empty schema (`<< Empty Schema >>`).
4. Flyway executes `V1`, `V2`, `V3`, and `V4` in sequential order within database transactions.
5. Hibernate JPA runs `ddl-auto: validate` to verify that all Java entity mappings match the database tables.

---

## 3. Database Backup & Recovery

### Creating a Production Backup
Run `mysqldump` from a machine with access to the database (or using Railway CLI):

```bash
mysqldump -h <DB_HOST> -P <DB_PORT> -u <DB_USERNAME> -p<DB_PASSWORD> \
  --single-transaction \
  --quick \
  --databases <DB_NAME> > devpulse_backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restoring a Backup
To restore data into an empty MySQL instance:

```bash
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USERNAME> -p<DB_PASSWORD> <DB_NAME> < devpulse_backup_YYYYMMDD_HHMMSS.sql
```

> [!CAUTION]
> Never restore into an active production database without creating a snapshot backup immediately beforehand.
