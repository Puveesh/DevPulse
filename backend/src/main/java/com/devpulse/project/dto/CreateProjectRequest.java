package com.devpulse.project.dto;

import com.devpulse.project.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProjectRequest(
        @NotBlank(message = "Project name is required")
        @Size(max = 150, message = "Project name cannot exceed 150 characters")
        String name,

        String description,

        @Size(max = 500, message = "Repository URL cannot exceed 500 characters")
        String repositoryUrl,

        @Size(max = 500, message = "Tech stack cannot exceed 500 characters")
        String techStack,

        ProjectStatus status
) {}

