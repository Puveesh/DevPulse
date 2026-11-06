package com.devpulse.worklog;

import com.devpulse.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "work_sessions")
public class WorkSession extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "task_id")
    private UUID taskId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private WorkSessionStatus status = WorkSessionStatus.ACTIVE;

    public WorkSession() {
    }

    public WorkSession(UUID userId, UUID projectId, UUID taskId, String title, String notes, Instant startedAt) {
        this.userId = userId;
        this.projectId = projectId;
        this.taskId = taskId;
        this.title = title;
        this.notes = notes;
        this.startedAt = startedAt != null ? startedAt : Instant.now();
        this.status = WorkSessionStatus.ACTIVE;
    }

    public void completeSession(Instant endTime) {
        Instant actualEnd = endTime != null ? endTime : Instant.now();
        if (actualEnd.isBefore(this.startedAt)) {
            actualEnd = this.startedAt;
        }
        this.endedAt = actualEnd;
        this.durationSeconds = Duration.between(this.startedAt, actualEnd).getSeconds();
        this.status = WorkSessionStatus.COMPLETED;
    }

    public void cancelSession() {
        Instant actualEnd = Instant.now();
        if (actualEnd.isBefore(this.startedAt)) {
            actualEnd = this.startedAt;
        }
        this.endedAt = actualEnd;
        this.durationSeconds = Duration.between(this.startedAt, actualEnd).getSeconds();
        this.status = WorkSessionStatus.CANCELLED;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
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

    public Long getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Long durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public WorkSessionStatus getStatus() {
        return status;
    }

    public void setStatus(WorkSessionStatus status) {
        this.status = status;
    }
}

