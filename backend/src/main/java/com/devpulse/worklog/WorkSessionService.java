package com.devpulse.worklog;

import com.devpulse.common.BadRequestException;
import com.devpulse.common.ResourceNotFoundException;
import com.devpulse.project.Project;
import com.devpulse.project.ProjectRepository;
import com.devpulse.worklog.dto.EndWorkSessionRequest;
import com.devpulse.worklog.dto.StartWorkSessionRequest;
import com.devpulse.worklog.dto.WorkSessionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WorkSessionService {

    private final WorkSessionRepository workSessionRepository;
    private final ProjectRepository projectRepository;

    public WorkSessionService(WorkSessionRepository workSessionRepository, ProjectRepository projectRepository) {
        this.workSessionRepository = workSessionRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public WorkSessionResponse startSession(UUID userId, StartWorkSessionRequest request) {
        // Auto-complete any existing active session for this user to prevent orphaned sessions
        workSessionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(userId, WorkSessionStatus.ACTIVE)
                .ifPresent(active -> {
                    active.completeSession(Instant.now());
                    workSessionRepository.save(active);
                });

        String projectName = null;
        if (request.projectId() != null) {
            Project project = projectRepository.findByIdAndUserId(request.projectId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.projectId()));
            projectName = project.getName();
        }

        WorkSession session = new WorkSession(
                userId,
                request.projectId(),
                request.taskId(),
                request.title().trim(),
                request.notes() != null && !request.notes().isBlank() ? request.notes().trim() : null,
                Instant.now()
        );

        WorkSession savedSession = workSessionRepository.save(session);
        return WorkSessionResponse.fromSession(savedSession, projectName);
    }

    @Transactional(readOnly = true)
    public Optional<WorkSessionResponse> getActiveSession(UUID userId) {
        return workSessionRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(userId, WorkSessionStatus.ACTIVE)
                .map(session -> {
                    String projectName = resolveProjectName(session.getProjectId(), userId);
                    return WorkSessionResponse.fromSession(session, projectName);
                });
    }

    @Transactional
    public WorkSessionResponse endSession(UUID userId, UUID sessionId, EndWorkSessionRequest request) {
        WorkSession session = workSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Work session not found with id: " + sessionId));

        if (session.getStatus() != WorkSessionStatus.ACTIVE) {
            throw new BadRequestException("Work session is not currently active: " + session.getStatus());
        }

        if (request != null && request.notes() != null && !request.notes().isBlank()) {
            String existingNotes = session.getNotes();
            if (existingNotes != null && !existingNotes.isBlank()) {
                session.setNotes(existingNotes + "\n" + request.notes().trim());
            } else {
                session.setNotes(request.notes().trim());
            }
        }

        Instant endTime = (request != null && request.endedAt() != null) ? request.endedAt() : Instant.now();
        session.completeSession(endTime);

        WorkSession saved = workSessionRepository.save(session);
        String projectName = resolveProjectName(saved.getProjectId(), userId);
        return WorkSessionResponse.fromSession(saved, projectName);
    }

    @Transactional
    public WorkSessionResponse cancelSession(UUID userId, UUID sessionId) {
        WorkSession session = workSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Work session not found with id: " + sessionId));

        if (session.getStatus() == WorkSessionStatus.ACTIVE) {
            session.cancelSession();
            session = workSessionRepository.save(session);
        }

        String projectName = resolveProjectName(session.getProjectId(), userId);
        return WorkSessionResponse.fromSession(session, projectName);
    }

    @Transactional(readOnly = true)
    public List<WorkSessionResponse> getRecentSessions(UUID userId) {
        List<WorkSession> sessions = workSessionRepository.findTop10ByUserIdOrderByStartedAtDesc(userId);
        Map<UUID, String> projectNames = fetchProjectNames(sessions, userId);

        return sessions.stream()
                .map(s -> WorkSessionResponse.fromSession(s, s.getProjectId() != null ? projectNames.get(s.getProjectId()) : null))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<WorkSessionResponse> getSessions(UUID userId, Pageable pageable) {
        Page<WorkSession> page = workSessionRepository.findByUserIdOrderByStartedAtDesc(userId, pageable);
        Map<UUID, String> projectNames = fetchProjectNames(page.getContent(), userId);

        return page.map(s -> WorkSessionResponse.fromSession(s, s.getProjectId() != null ? projectNames.get(s.getProjectId()) : null));
    }

    @Transactional(readOnly = true)
    public long getTodayLoggedDurationSeconds(UUID userId) {
        Instant startOfDay = LocalDate.now(ZoneOffset.UTC).atStartOfDay(ZoneOffset.UTC).toInstant();
        return workSessionRepository.getTotalDurationSecondsSince(userId, startOfDay);
    }

    private String resolveProjectName(UUID projectId, UUID userId) {
        if (projectId == null) {
            return null;
        }
        return projectRepository.findByIdAndUserId(projectId, userId)
                .map(Project::getName)
                .orElse(null);
    }

    private Map<UUID, String> fetchProjectNames(List<WorkSession> sessions, UUID userId) {
        List<UUID> projectIds = sessions.stream()
                .map(WorkSession::getProjectId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (projectIds.isEmpty()) {
            return Map.of();
        }

        return projectRepository.findAllById(projectIds).stream()
                .filter(p -> p.getUserId().equals(userId))
                .collect(Collectors.toMap(Project::getId, Project::getName));
    }
}
