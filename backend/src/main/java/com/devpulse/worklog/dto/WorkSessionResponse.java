package com.devpulse.worklog.dto;

import com.devpulse.worklog.WorkSession;
import com.devpulse.worklog.WorkSessionStatus;

import java.time.Instant;
import java.util.UUID;

public record WorkSessionResponse(
        UUID id,
        UUID userId,
        UUID projectId,
        String projectName,
        UUID taskId,
        String title,
        String notes,
        Instant startedAt,
        Instant endedAt,
        Long durationSeconds,
        WorkSessionStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static WorkSessionResponse fromSession(WorkSession session, String projectName) {
        return new WorkSessionResponse(
                session.getId(),
                session.getUserId(),
                session.getProjectId(),
                projectName,
                session.getTaskId(),
                session.getTitle(),
                session.getNotes(),
                session.getStartedAt(),
                session.getEndedAt(),
                session.getDurationSeconds(),
                session.getStatus(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}
