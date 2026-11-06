package com.devpulse.analytics.dto;

import java.util.List;
import java.util.UUID;

public record TodayAnalyticsResponse(
        String date,
        long totalDurationSeconds,
        int sessionCount,
        int projectCount,
        UUID activeSessionId,
        long activeSessionTodayWorkingSeconds,
        List<ProjectDurationDto> projects,
        List<TodaySessionDto> sessions
) {}
