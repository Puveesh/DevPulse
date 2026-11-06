package com.devpulse.analytics.dto;

import com.devpulse.worklog.WorkSessionStatus;

import java.time.Instant;
import java.util.UUID;

public record TodaySessionDto(
        UUID id,
        UUID projectId,
        String projectName,
        String title,
        WorkSessionStatus status,
        Instant startedAt,
        Instant endedAt,
        long todayWorkingSeconds,
        Long totalDurationSeconds,
        String initialNotes,
        String sessionNotes
) {}

