package com.devpulse.analytics;

import com.devpulse.analytics.dto.TodayAnalyticsResponse;
import com.devpulse.analytics.dto.WeeklyAnalyticsResponse;
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
               description = "Computes daily working durations from Monday through Sunday, total weekly time, and active days for the current week")
    public ResponseEntity<ApiResponse<WeeklyAnalyticsResponse>> getWeeklyAnalytics(
            @RequestParam(value = "timezone", required = false) String timezone,
            @AuthenticationPrincipal UserPrincipal principal) {
        WeeklyAnalyticsResponse response = analyticsService.getWeeklyAnalytics(principal.getId(), timezone);
        return ResponseEntity.ok(ApiResponse.success("Weekly analytics retrieved successfully", response));
    }
}
