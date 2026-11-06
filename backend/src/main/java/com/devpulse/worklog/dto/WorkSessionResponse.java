package com.devpulse.worklog.dto;

import com.devpulse.worklog.WorkSession;
import com.devpulse.worklog.WorkSessionStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record WorkSessionResponse(
        UUID id,
        UUID userId,
        UUID projectId,
        String projectName,
        UUID taskId,
        String title,
        String initialNotes,
        String sessionNotes,
        Instant startedAt,
        Instant endedAt,
        Long totalDurationSeconds,
        WorkSessionStatus status,
        List<PauseIntervalDto> pauseIntervals,
        Instant createdAt,
        Instant updatedAt
) {
    public static WorkSessionResponse fromSession(
            WorkSession session,
            String projectName,
            Long currentWorkingSeconds,
            List<PauseIntervalDto> intervals
    ) {
        Long duration = session.getStatus() == WorkSessionStatus.COMPLETED
                ? session.getTotalDurationSeconds()
                : currentWorkingSeconds;

        return new WorkSessionResponse(
                session.getId(),
                session.getUserId(),
                session.getProjectId(),
                projectName,
                session.getTaskId(),
                session.getTitle(),
                session.getInitialNotes(),
                session.getSessionNotes(),
                session.getStartedAt(),
                session.getEndedAt(),
                duration,
                session.getStatus(),
                intervals != null ? intervals : List.of(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}
