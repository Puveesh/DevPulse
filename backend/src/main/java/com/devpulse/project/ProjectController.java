package com.devpulse.project;

import com.devpulse.common.ApiResponse;
import com.devpulse.project.dto.CreateProjectRequest;
import com.devpulse.project.dto.ProjectResponse;
import com.devpulse.project.dto.UpdateProjectRequest;
import com.devpulse.security.UserPrincipal;
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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@Tag(name = "Projects", description = "Endpoints for managing user projects")
@SecurityRequirement(name = "bearerAuth")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping
    @Operation(summary = "Create a project", description = "Creates a new project owned by the authenticated user")
    public ResponseEntity<ApiResponse<ProjectResponse>> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ProjectResponse projectResponse = projectService.createProject(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created successfully", projectResponse));
    }

    @GetMapping
    @Operation(summary = "List user projects", description = "Retrieves paginated projects owned by the authenticated user with optional filtering")
    public ResponseEntity<ApiResponse<Page<ProjectResponse>>> getProjects(
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {
        Page<ProjectResponse> projects = projectService.getProjects(principal.getId(), status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Projects retrieved successfully", projects));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project details", description = "Retrieves a single project by ID if owned by authenticated user")
    public ResponseEntity<ApiResponse<ProjectResponse>> getProjectById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ProjectResponse project = projectService.getProjectById(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Project retrieved successfully", project));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Update a project", description = "Updates fields of an existing project owned by authenticated user")
    public ResponseEntity<ApiResponse<ProjectResponse>> updateProject(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProjectRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        ProjectResponse updatedProject = projectService.updateProject(id, request, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Project updated successfully", updatedProject));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a project", description = "Deletes a project owned by authenticated user")
    public ResponseEntity<Void> deleteProject(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {
        projectService.deleteProject(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}

