package com.devpulse.analytics.dto;

import java.util.List;
import java.util.UUID;

public record WeeklyAnalyticsResponse(
        String weekStart,
        String weekEnd,
        long totalDurationSeconds,
        int activeDays,
        String mostActiveDay,
        int projectCount,
        UUID activeSessionId,
        long activeSessionWeeklyWorkingSeconds,
        List<DailyActivityDto> dailyActivity
) {}
