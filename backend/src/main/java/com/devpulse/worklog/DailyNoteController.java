package com.devpulse.worklog;

import com.devpulse.common.ApiResponse;
import com.devpulse.security.UserPrincipal;
import com.devpulse.worklog.dto.DailyNoteResponse;
import com.devpulse.worklog.dto.DailyNoteSummaryResponse;
import com.devpulse.worklog.dto.SaveDailyNoteRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects/{projectId}/daily-notes")
@Tag(name = "Daily Notes", description = "Endpoints for managing project rich text development journal notes")
@SecurityRequirement(name = "bearerAuth")
public class DailyNoteController {

    private final DailyNoteService dailyNoteService;

    public DailyNoteController(DailyNoteService dailyNoteService) {
        this.dailyNoteService = dailyNoteService;
    }

    @GetMapping
    @Operation(summary = "List project daily notes history", description = "Retrieves all saved daily note dates and metadata for a project")
    public ResponseEntity<ApiResponse<List<DailyNoteSummaryResponse>>> getNotesHistory(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<DailyNoteSummaryResponse> history = dailyNoteService.getNotesHistoryForProject(principal.getId(), projectId);
        return ResponseEntity.ok(ApiResponse.success("Project daily notes history retrieved successfully", history));
    }

    @GetMapping("/{date}")
    @Operation(summary = "Get daily note by date", description = "Retrieves the rich text development journal note for a specific date")
    public ResponseEntity<ApiResponse<DailyNoteResponse>> getNoteByDate(
            @PathVariable UUID projectId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserPrincipal principal) {
        DailyNoteResponse note = dailyNoteService.getNoteByProjectAndDate(principal.getId(), projectId, date).orElse(null);
        return ResponseEntity.ok(ApiResponse.success("Daily note retrieved successfully", note));
    }

    @PutMapping("/{date}")
    @Operation(summary = "Save or update daily note", description = "Creates or updates the daily development note for a project on a specific calendar date")
    public ResponseEntity<ApiResponse<DailyNoteResponse>> saveNote(
            @PathVariable UUID projectId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @Valid @RequestBody SaveDailyNoteRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        DailyNoteResponse saved = dailyNoteService.saveNote(principal.getId(), projectId, date, request);
        return ResponseEntity.ok(ApiResponse.success("Daily note saved successfully", saved));
    }

    @DeleteMapping("/{date}")
    @Operation(summary = "Delete daily note", description = "Removes the daily note for a project on a specific calendar date")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @PathVariable UUID projectId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal UserPrincipal principal) {
        dailyNoteService.deleteNote(principal.getId(), projectId, date);
        return ResponseEntity.ok(ApiResponse.success("Daily note deleted successfully", null));
    }
}

