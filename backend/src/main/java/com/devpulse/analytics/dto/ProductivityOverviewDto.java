package com.devpulse.analytics.dto;

public record ProductivityOverviewDto(
        long totalWorkingSeconds,
        long averageDailyWorkingSeconds,
        long averageActiveDayWorkingSeconds,
        int totalSessions,
        int activeDays,
        int activeProjectCount,
        int tasksCompleted,
        long totalElapsedActiveSeconds
) {
}
