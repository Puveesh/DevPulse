package com.devpulse.worklog.dto;

import com.devpulse.worklog.DailyNote;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DailyNoteResponse(
        UUID id,
        UUID userId,
        UUID projectId,
        LocalDate noteDate,
        String content,
        Instant createdAt,
        Instant updatedAt
) {
    public static DailyNoteResponse fromEntity(DailyNote note) {
        return new DailyNoteResponse(
                note.getId(),
                note.getUserId(),
                note.getProjectId(),
                note.getNoteDate(),
                note.getContent(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}

