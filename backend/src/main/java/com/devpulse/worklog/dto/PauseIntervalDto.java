package com.devpulse.worklog.dto;

import com.devpulse.worklog.SessionPauseInterval;

import java.time.Instant;
import java.util.UUID;

public record PauseIntervalDto(
        UUID id,
        Instant pausedAt,
        Instant resumedAt
) {
    public static PauseIntervalDto fromEntity(SessionPauseInterval interval) {
        return new PauseIntervalDto(interval.getId(), interval.getPausedAt(), interval.getResumedAt());
    }
}

