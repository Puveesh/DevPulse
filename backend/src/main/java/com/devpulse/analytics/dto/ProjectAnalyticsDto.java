package com.devpulse.analytics.dto;

import java.util.UUID;

public record ProjectAnalyticsDto(
        UUID projectId,
        String projectName,
        String techStack,
        String status,
        long totalWorkingSeconds,
        double percentageOfTotalTime,
        int sessionCount,
        int activeDays,
        int totalTasks,
        int completedTasks,
        int inProgressTasks,
        int todoTasks,
        int cancelledTasks,
        double completionPercentage
) {
}

