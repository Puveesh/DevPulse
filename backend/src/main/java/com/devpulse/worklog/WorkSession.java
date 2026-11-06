package com.devpulse.worklog;

import com.devpulse.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "work_sessions")
public class WorkSession extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "task_id")
    private UUID taskId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "initial_notes", columnDefinition = "TEXT")
    private String initialNotes;

    @Column(name = "session_notes", columnDefinition = "TEXT")
    private String sessionNotes;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "total_duration_seconds")
    private Long totalDurationSeconds;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private WorkSessionStatus status = WorkSessionStatus.ACTIVE;

    public WorkSession() {
    }

    public WorkSession(UUID userId, UUID projectId, UUID taskId, String title, String initialNotes, Instant startedAt) {
        this.userId = userId;
        this.projectId = projectId;
        this.taskId = taskId;
        this.title = title;
        this.initialNotes = initialNotes;
        this.startedAt = startedAt != null ? startedAt : Instant.now();
        this.status = WorkSessionStatus.ACTIVE;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getProjectId() {
        return projectId;
    }

    public void setProjectId(UUID projectId) {
        this.projectId = projectId;
    }

    public UUID getTaskId() {
        return taskId;
    }

    public void setTaskId(UUID taskId) {
        this.taskId = taskId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getInitialNotes() {
        return initialNotes;
    }

    public void setInitialNotes(String initialNotes) {
        this.initialNotes = initialNotes;
    }

    public String getSessionNotes() {
        return sessionNotes;
    }

    public void setSessionNotes(String sessionNotes) {
        this.sessionNotes = sessionNotes;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public void setEndedAt(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public Long getTotalDurationSeconds() {
        return totalDurationSeconds;
    }

    public void setTotalDurationSeconds(Long totalDurationSeconds) {
        this.totalDurationSeconds = totalDurationSeconds;
    }

    public WorkSessionStatus getStatus() {
        return status;
    }

    public void setStatus(WorkSessionStatus status) {
        this.status = status;
    }
}
