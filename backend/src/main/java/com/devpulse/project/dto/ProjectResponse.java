package com.devpulse.project.dto;

import com.devpulse.project.Project;
import com.devpulse.project.ProjectStatus;

import java.time.Instant;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        UUID userId,
        String name,
        String description,
        String repositoryUrl,
        String techStack,
        ProjectStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static ProjectResponse fromProject(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getUserId(),
                project.getName(),
                project.getDescription(),
                project.getRepositoryUrl(),
                project.getTechStack(),
                project.getStatus(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }
}

