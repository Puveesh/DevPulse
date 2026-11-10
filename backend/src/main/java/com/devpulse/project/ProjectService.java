package com.devpulse.project;

import com.devpulse.common.ResourceNotFoundException;
import com.devpulse.project.dto.CreateProjectRequest;
import com.devpulse.project.dto.ProjectResponse;
import com.devpulse.project.dto.UpdateProjectRequest;
import com.devpulse.worklog.WorkSessionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final WorkSessionRepository workSessionRepository;

    public ProjectService(ProjectRepository projectRepository, WorkSessionRepository workSessionRepository) {
        this.projectRepository = projectRepository;
        this.workSessionRepository = workSessionRepository;
    }

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest request, UUID userId) {
        Project project = new Project(
                userId,
                request.name().trim(),
                request.description() != null ? request.description().trim() : null,
                request.repositoryUrl() != null ? request.repositoryUrl().trim() : null,
                request.techStack() != null ? request.techStack().trim() : null,
                request.status() != null ? request.status() : ProjectStatus.ACTIVE
        );

        Project savedProject = projectRepository.save(project);
        return ProjectResponse.fromProject(savedProject, null);
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> getProjects(UUID userId, ProjectStatus status, String search, Pageable pageable) {
        String trimmedSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        Page<Project> projects = projectRepository.findByUserIdWithFilters(userId, status, trimmedSearch, pageable);

        return projects.map(p -> {
            Instant lastActivity = workSessionRepository
                    .findFirstByProjectIdAndUserIdOrderByStartedAtDesc(p.getId(), userId)
                    .map(s -> s.getEndedAt() != null ? s.getEndedAt() : s.getStartedAt())
                    .orElse(null);
            return ProjectResponse.fromProject(p, lastActivity);
        });
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(UUID id, UUID userId) {
        Project project = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        Instant lastActivity = workSessionRepository
                .findFirstByProjectIdAndUserIdOrderByStartedAtDesc(id, userId)
                .map(s -> s.getEndedAt() != null ? s.getEndedAt() : s.getStartedAt())
                .orElse(null);
        return ProjectResponse.fromProject(project, lastActivity);
    }

    @Transactional
    public ProjectResponse updateProject(UUID id, UpdateProjectRequest request, UUID userId) {
        Project project = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        if (request.name() != null && !request.name().isBlank()) {
            project.setName(request.name().trim());
        }
        if (request.description() != null) {
            project.setDescription(request.description().trim());
        }
        if (request.repositoryUrl() != null) {
            project.setRepositoryUrl(request.repositoryUrl().trim());
        }
        if (request.techStack() != null) {
            project.setTechStack(request.techStack().trim());
        }
        if (request.status() != null) {
            project.setStatus(request.status());
        }

        Project updatedProject = projectRepository.save(project);
        Instant lastActivity = workSessionRepository
                .findFirstByProjectIdAndUserIdOrderByStartedAtDesc(id, userId)
                .map(s -> s.getEndedAt() != null ? s.getEndedAt() : s.getStartedAt())
                .orElse(null);
        return ProjectResponse.fromProject(updatedProject, lastActivity);
    }

    @Transactional
    public void deleteProject(UUID id, UUID userId) {
        Project project = projectRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        projectRepository.delete(project);
    }

    @Transactional(readOnly = true)
    public long countActiveProjects(UUID userId) {
        return projectRepository.countByUserIdAndStatus(userId, ProjectStatus.ACTIVE);
    }

    @Transactional(readOnly = true)
    public long countTotalProjects(UUID userId) {
        return projectRepository.countByUserId(userId);
    }
}

