package com.devpulse.task;

import com.devpulse.common.ApiResponse;
import com.devpulse.security.UserPrincipal;
import com.devpulse.task.dto.CreateTaskRequest;
import com.devpulse.task.dto.ProjectTaskSummaryResponse;
import com.devpulse.task.dto.TaskResponse;
import com.devpulse.task.dto.UpdateTaskRequest;
import com.devpulse.task.dto.UpdateTaskStatusRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@Tag(name = "Tasks", description = "Endpoints for project tasks and task metrics")
@SecurityRequirement(name = "bearerAuth")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/api/v1/projects/{projectId}/tasks")
    @Operation(summary = "Create task for project", description = "Creates a new task associated with the specified project")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskResponse response = taskService.createTask(principal.getId(), projectId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created successfully", response));
    }

    @GetMapping("/api/v1/projects/{projectId}/tasks")
    @Operation(summary = "Get tasks for project", description = "Retrieves all tasks for the specified project")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasksForProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<TaskResponse> tasks = taskService.getTasksForProject(principal.getId(), projectId);
        return ResponseEntity.ok(ApiResponse.success("Tasks retrieved successfully", tasks));
    }

    @PatchMapping("/api/v1/projects/{projectId}/tasks/{taskId}/status")
    @Operation(summary = "Update task status", description = "Updates the status of an existing task")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskResponse response = taskService.updateTaskStatus(principal.getId(), projectId, taskId, request);
        return ResponseEntity.ok(ApiResponse.success("Task status updated successfully", response));
    }

    @PatchMapping("/api/v1/projects/{projectId}/tasks/{taskId}")
    @Operation(summary = "Update task details", description = "Updates title, description, priority, status, or due date of a task")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        TaskResponse response = taskService.updateTask(principal.getId(), projectId, taskId, request);
        return ResponseEntity.ok(ApiResponse.success("Task updated successfully", response));
    }

    @DeleteMapping("/api/v1/projects/{projectId}/tasks/{taskId}")
    @Operation(summary = "Delete task", description = "Deletes a task from the specified project")
    public ResponseEntity<Void> deleteTask(
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserPrincipal principal) {
        taskService.deleteTask(principal.getId(), projectId, taskId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping({"/api/v1/dashboard/project-task-summary", "/api/v1/projects/task-summary"})
    @Operation(summary = "Get project pending task summary", description = "Returns pending task counts grouped by project for the authenticated user")
    public ResponseEntity<ApiResponse<ProjectTaskSummaryResponse>> getProjectTaskSummary(
            @AuthenticationPrincipal UserPrincipal principal) {
        ProjectTaskSummaryResponse response = taskService.getProjectTaskSummary(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Project task summary retrieved successfully", response));
    }
}

