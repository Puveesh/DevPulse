package com.devpulse.analytics;

import com.devpulse.analytics.dto.*;
import com.devpulse.common.ApiResponse;
import com.devpulse.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@Tag(name = "Analytics", description = "Endpoints for deriving development activity summaries from work sessions")
@SecurityRequirement(name = "bearerAuth")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard/today")
    @Operation(summary = "Get today's logged development time",
               description = "Aggregates working duration, session count, and project-wise distribution for today in the user's local timezone")
    public ResponseEntity<ApiResponse<TodayAnalyticsResponse>> getTodayAnalytics(
            @RequestParam(value = "timezone", required = false) String timezone,
            @AuthenticationPrincipal UserPrincipal principal) {
        TodayAnalyticsResponse response = analyticsService.getTodayAnalytics(principal.getId(), timezone);
        return ResponseEntity.ok(ApiResponse.success("Today's analytics retrieved successfully", response));
    }

    @GetMapping("/dashboard/weekly")
    @Operation(summary = "Get weekly development activity",
               description = "Computes daily working durations from Monday through Sunday, total weekly time, project breakdown, and active days for the specified or current week")
    public ResponseEntity<ApiResponse<WeeklyAnalyticsResponse>> getWeeklyAnalytics(
            @RequestParam(value = "timezone", required = false) String timezone,
            @RequestParam(value = "weekStart", required = false) String weekStart,
            @AuthenticationPrincipal UserPrincipal principal) {
        WeeklyAnalyticsResponse response = analyticsService.getWeeklyAnalytics(principal.getId(), timezone, weekStart);
        return ResponseEntity.ok(ApiResponse.success("Weekly analytics retrieved successfully", response));
    }

    @GetMapping("/report")
    @Operation(summary = "Get comprehensive developer analytics report",
               description = "Provides unified metrics: productivity overview, time-series, project distribution, task completion, consistency & streaks, insights, and recent activity.")
    public ResponseEntity<ApiResponse<AnalyticsReportResponse>> getAnalyticsReport(
            @RequestParam(value = "preset", required = false, defaultValue = "LAST_30_DAYS") String preset,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "timezone", required = false) String timezone,
            @AuthenticationPrincipal UserPrincipal principal) {
        AnalyticsReportResponse response = analyticsService.getComprehensiveReport(
                principal.getId(), timezone, preset, startDate, endDate
        );
        return ResponseEntity.ok(ApiResponse.success("Analytics report generated successfully", response));
    }

    @GetMapping("/overview")
    @Operation(summary = "Get developer productivity overview KPI cards")
    public ResponseEntity<ApiResponse<ProductivityOverviewDto>> getProductivityOverview(
            @RequestParam(value = "preset", required = false, defaultValue = "LAST_30_DAYS") String preset,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "timezone", required = false) String timezone,
            @AuthenticationPrincipal UserPrincipal principal) {
        AnalyticsReportResponse report = analyticsService.getComprehensiveReport(principal.getId(), timezone, preset, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Productivity overview retrieved successfully", report.overview()));
    }

    @GetMapping("/development-time")
    @Operation(summary = "Get development time-series timeline")
    public ResponseEntity<ApiResponse<List<DailyActivityDto>>> getDevelopmentTime(
            @RequestParam(value = "preset", required = false, defaultValue = "LAST_30_DAYS") String preset,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "timezone", required = false) String timezone,
            @AuthenticationPrincipal UserPrincipal principal) {
        AnalyticsReportResponse report = analyticsService.getComprehensiveReport(principal.getId(), timezone, preset, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Development time series retrieved successfully", report.dailyTimeline()));
    }

    @GetMapping("/project-distribution")
    @Operation(summary = "Get project-wise breakdown and task progress")
    public ResponseEntity<ApiResponse<List<ProjectAnalyticsDto>>> getProjectDistribution(
            @RequestParam(value = "preset", required = false, defaultValue = "LAST_30_DAYS") String preset,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "timezone", required = false) String timezone,
            @AuthenticationPrincipal UserPrincipal principal) {
        AnalyticsReportResponse report = analyticsService.getComprehensiveReport(principal.getId(), timezone, preset, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Project distribution retrieved successfully", report.projects()));
    }

    @GetMapping("/task-progress")
    @Operation(summary = "Get overall task progress and completion breakdown")
    public ResponseEntity<ApiResponse<TaskOverviewDto>> getTaskProgress(
            @RequestParam(value = "preset", required = false, defaultValue = "LAST_30_DAYS") String preset,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "timezone", required = false) String timezone,
            @AuthenticationPrincipal UserPrincipal principal) {
        AnalyticsReportResponse report = analyticsService.getComprehensiveReport(principal.getId(), timezone, preset, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Task progress retrieved successfully", report.tasks()));
    }

    @GetMapping("/consistency")
    @Operation(summary = "Get consistency, streak, and work habits metrics")
    public ResponseEntity<ApiResponse<ConsistencyDto>> getConsistency(
            @RequestParam(value = "preset", required = false, defaultValue = "LAST_30_DAYS") String preset,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "timezone", required = false) String timezone,
            @AuthenticationPrincipal UserPrincipal principal) {
        AnalyticsReportResponse report = analyticsService.getComprehensiveReport(principal.getId(), timezone, preset, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Consistency metrics retrieved successfully", report.consistency()));
    }

    @GetMapping("/recent-activity")
    @Operation(summary = "Get recent development activities timeline")
    public ResponseEntity<ApiResponse<List<RecentActivityItemDto>>> getRecentActivity(
            @RequestParam(value = "preset", required = false, defaultValue = "LAST_30_DAYS") String preset,
            @RequestParam(value = "startDate", required = false) String startDate,
            @RequestParam(value = "endDate", required = false) String endDate,
            @RequestParam(value = "timezone", required = false) String timezone,
            @AuthenticationPrincipal UserPrincipal principal) {
        AnalyticsReportResponse report = analyticsService.getComprehensiveReport(principal.getId(), timezone, preset, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Recent activity retrieved successfully", report.recentActivities()));
    }
}
