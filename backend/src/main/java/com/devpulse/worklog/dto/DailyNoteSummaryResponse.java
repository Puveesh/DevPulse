package com.devpulse.worklog.dto;

import com.devpulse.worklog.DailyNote;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DailyNoteSummaryResponse(
        UUID id,
        UUID projectId,
        LocalDate noteDate,
        Instant createdAt,
        Instant updatedAt
) {
    public static DailyNoteSummaryResponse fromEntity(DailyNote note) {
        return new DailyNoteSummaryResponse(
                note.getId(),
                note.getProjectId(),
                note.getNoteDate(),
                note.getCreatedAt(),
                note.getUpdatedAt()
        );
    }
}
