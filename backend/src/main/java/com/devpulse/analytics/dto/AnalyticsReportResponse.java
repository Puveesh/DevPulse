package com.devpulse.analytics.dto;

import java.util.List;

public record AnalyticsReportResponse(
        DateRangeDto dateRange,
        ProductivityOverviewDto overview,
        List<DailyActivityDto> dailyTimeline,
        List<ProjectAnalyticsDto> projects,
        TaskOverviewDto tasks,
        ConsistencyDto consistency,
        List<AnalyticsInsightDto> insights,
        List<RecentActivityItemDto> recentActivities
) {
}
