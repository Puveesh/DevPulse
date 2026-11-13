package com.devpulse.analytics.dto;

public record TaskOverviewDto(
        int totalTasks,
        int completedTasks,
        int inProgressTasks,
        int todoTasks,
        int cancelledTasks,
        double overallCompletionPercentage
) {
}
