package com.devpulse.worklog;

import com.devpulse.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "daily_notes")
public class DailyNote extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "note_date", nullable = false)
    private LocalDate noteDate;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    public DailyNote() {
    }

    public DailyNote(UUID userId, UUID projectId, LocalDate noteDate, String content) {
        this.userId = userId;
        this.projectId = projectId;
        this.noteDate = noteDate;
        this.content = content;
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

    public LocalDate getNoteDate() {
        return noteDate;
    }

    public void setNoteDate(LocalDate noteDate) {
        this.noteDate = noteDate;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}

