package com.devpulse.worklog;

import com.devpulse.common.ApiResponse;
import com.devpulse.security.UserPrincipal;
import com.devpulse.worklog.dto.EndWorkSessionRequest;
import com.devpulse.worklog.dto.StartWorkSessionRequest;
import com.devpulse.worklog.dto.WorkSessionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/work-sessions")
@Tag(name = "Work Sessions", description = "Endpoints for tracking active and historical development sessions")
@SecurityRequirement(name = "bearerAuth")
public class WorkSessionController {

    private final WorkSessionService workSessionService;

    public WorkSessionController(WorkSessionService workSessionService) {
        this.workSessionService = workSessionService;
    }

    @PostMapping("/start")
    @Operation(summary = "Start a work session", description = "Begins a new development session for the authenticated user")
    public ResponseEntity<ApiResponse<WorkSessionResponse>> startSession(
            @Valid @RequestBody StartWorkSessionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkSessionResponse session = workSessionService.startSession(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Work session started successfully", session));
    }

    @GetMapping("/active")
    @Operation(summary = "Get active work session", description = "Retrieves current active session if one is in progress")
    public ResponseEntity<ApiResponse<WorkSessionResponse>> getActiveSession(
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkSessionResponse activeSession = workSessionService.getActiveSession(principal.getId()).orElse(null);
        return ResponseEntity.ok(ApiResponse.success("Active session fetched", activeSession));
    }

    @PostMapping("/{id}/end")
    @Operation(summary = "End a work session", description = "Stops an active session, computes duration, and persists notes")
    public ResponseEntity<ApiResponse<WorkSessionResponse>> endSession(
            @PathVariable UUID id,
            @RequestBody(required = false) EndWorkSessionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkSessionResponse session = workSessionService.endSession(principal.getId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Work session completed successfully", session));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel a work session", description = "Cancels an in-progress work session")
    public ResponseEntity<ApiResponse<WorkSessionResponse>> cancelSession(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        WorkSessionResponse session = workSessionService.cancelSession(principal.getId(), id);
        return ResponseEntity.ok(ApiResponse.success("Work session cancelled", session));
    }

    @GetMapping("/recent")
    @Operation(summary = "List recent work sessions", description = "Retrieves up to 10 recent work sessions")
    public ResponseEntity<ApiResponse<List<WorkSessionResponse>>> getRecentSessions(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<WorkSessionResponse> sessions = workSessionService.getRecentSessions(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Recent sessions retrieved successfully", sessions));
    }

    @GetMapping
    @Operation(summary = "List all work sessions", description = "Retrieves paginated work sessions for the user")
    public ResponseEntity<ApiResponse<Page<WorkSessionResponse>>> getSessions(
            @PageableDefault(size = 20, sort = "startedAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        Page<WorkSessionResponse> sessions = workSessionService.getSessions(principal.getId(), pageable);
        return ResponseEntity.ok(ApiResponse.success("Work sessions retrieved successfully", sessions));
    }

    @GetMapping("/today-duration")
    @Operation(summary = "Get today's total logged seconds", description = "Retrieves total seconds spent in completed sessions today")
    public ResponseEntity<ApiResponse<Long>> getTodayLoggedDuration(
            @AuthenticationPrincipal UserPrincipal principal) {
        long seconds = workSessionService.getTodayLoggedDurationSeconds(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Today's logged seconds retrieved", seconds));
    }
}
