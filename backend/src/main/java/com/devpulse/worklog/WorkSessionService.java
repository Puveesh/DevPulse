package com.devpulse.worklog;

import com.devpulse.common.BadRequestException;
import com.devpulse.common.ConflictException;
import com.devpulse.common.ResourceNotFoundException;
import com.devpulse.project.Project;
import com.devpulse.project.ProjectRepository;
import com.devpulse.worklog.dto.EndWorkSessionRequest;
import com.devpulse.worklog.dto.PauseIntervalDto;
import com.devpulse.worklog.dto.StartWorkSessionRequest;
import com.devpulse.worklog.dto.UpdateSessionNotesRequest;
import com.devpulse.worklog.dto.WorkSessionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WorkSessionService {

    private final WorkSessionRepository workSessionRepository;
    private final SessionPauseIntervalRepository pauseIntervalRepository;
    private final ProjectRepository projectRepository;

    public WorkSessionService(WorkSessionRepository workSessionRepository,
                              SessionPauseIntervalRepository pauseIntervalRepository,
                              ProjectRepository projectRepository) {
        this.workSessionRepository = workSessionRepository;
        this.pauseIntervalRepository = pauseIntervalRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional
    public WorkSessionResponse startSession(UUID userId, StartWorkSessionRequest request) {
        if (request.projectId() == null) {
            throw new BadRequestException("Project selection is mandatory");
        }

        Project project = projectRepository.findByIdAndUserId(request.projectId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.projectId()));

        boolean hasActive = workSessionRepository.existsByUserIdAndStatusIn(
                userId, List.of(WorkSessionStatus.ACTIVE, WorkSessionStatus.PAUSED)
        );
        if (hasActive) {
            throw new ConflictException("You already have an active or paused work session in progress. Please end it before starting a new one.");
        }

        WorkSession session = new WorkSession(
                userId,
                request.projectId(),
                request.taskId(),
                request.title().trim(),
                request.initialNotes() != null && !request.initialNotes().isBlank() ? request.initialNotes().trim() : null,
                Instant.now()
        );

        WorkSession savedSession = workSessionRepository.save(session);
        return WorkSessionResponse.fromSession(savedSession, project.getName(), 0L, List.of());
    }

    @Transactional(readOnly = true)
    public Optional<WorkSessionResponse> getActiveSession(UUID userId) {
        return workSessionRepository.findFirstByUserIdAndStatusInOrderByStartedAtDesc(
                userId, List.of(WorkSessionStatus.ACTIVE, WorkSessionStatus.PAUSED)
        ).map(session -> {
            String projectName = resolveProjectName(session.getProjectId(), userId);
            List<SessionPauseInterval> intervals = pauseIntervalRepository.findBySessionIdOrderByPausedAtAsc(session.getId());
            long workingSeconds = calculateWorkingDurationSeconds(session, intervals, Instant.now());
            List<PauseIntervalDto> intervalDtos = intervals.stream().map(PauseIntervalDto::fromEntity).toList();
            return WorkSessionResponse.fromSession(session, projectName, workingSeconds, intervalDtos);
        });
    }

    @Transactional
    public WorkSessionResponse pauseSession(UUID userId, UUID sessionId) {
        WorkSession session = workSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Work session not found with id: " + sessionId));

        if (session.getStatus() == WorkSessionStatus.COMPLETED) {
            throw new BadRequestException("Completed work session cannot be paused");
        }

        // Idempotent: if already paused, return the confirmed paused state safely
        if (session.getStatus() == WorkSessionStatus.PAUSED) {
            String projectName = resolveProjectName(session.getProjectId(), userId);
            List<SessionPauseInterval> intervals = pauseIntervalRepository.findBySessionIdOrderByPausedAtAsc(sessionId);
            List<PauseIntervalDto> dtos = intervals.stream().map(PauseIntervalDto::fromEntity).toList();
            return WorkSessionResponse.fromSession(session, projectName, session.getTotalDurationSeconds(), dtos);
        }

        if (session.getStatus() != WorkSessionStatus.ACTIVE) {
            throw new BadRequestException("Only an active session can be paused. Current status: " + session.getStatus());
        }

        SessionPauseInterval pauseInterval = new SessionPauseInterval(sessionId, Instant.now());
        pauseIntervalRepository.save(pauseInterval);

        session.setStatus(WorkSessionStatus.PAUSED);

        List<SessionPauseInterval> intervals = new ArrayList<>(
                pauseIntervalRepository.findBySessionIdOrderByPausedAtAsc(sessionId)
        );
        long workingSeconds = calculateWorkingDurationSeconds(session, intervals, Instant.now());
        session.setTotalDurationSeconds(workingSeconds);

        WorkSession saved = workSessionRepository.save(session);
        String projectName = resolveProjectName(saved.getProjectId(), userId);
        List<PauseIntervalDto> dtos = intervals.stream().map(PauseIntervalDto::fromEntity).toList();
        return WorkSessionResponse.fromSession(saved, projectName, workingSeconds, dtos);
    }

    @Transactional
    public WorkSessionResponse resumeSession(UUID userId, UUID sessionId) {
        WorkSession session = workSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Work session not found with id: " + sessionId));

        if (session.getStatus() == WorkSessionStatus.COMPLETED) {
            throw new BadRequestException("Completed work session cannot be resumed");
        }

        // Idempotent: if already active, return the confirmed active state safely
        if (session.getStatus() == WorkSessionStatus.ACTIVE) {
            String projectName = resolveProjectName(session.getProjectId(), userId);
            List<SessionPauseInterval> intervals = pauseIntervalRepository.findBySessionIdOrderByPausedAtAsc(sessionId);
            long workingSeconds = calculateWorkingDurationSeconds(session, intervals, Instant.now());
            List<PauseIntervalDto> dtos = intervals.stream().map(PauseIntervalDto::fromEntity).toList();
            return WorkSessionResponse.fromSession(session, projectName, workingSeconds, dtos);
        }

        if (session.getStatus() != WorkSessionStatus.PAUSED) {
            throw new BadRequestException("Only a paused session can be resumed. Current status: " + session.getStatus());
        }

        SessionPauseInterval openPause = pauseIntervalRepository
                .findFirstBySessionIdAndResumedAtIsNullOrderByPausedAtDesc(sessionId)
                .orElseThrow(() -> new BadRequestException("No open pause interval found for this session"));

        openPause.setResumedAt(Instant.now());
        pauseIntervalRepository.save(openPause);

        session.setStatus(WorkSessionStatus.ACTIVE);
        WorkSession saved = workSessionRepository.save(session);

        List<SessionPauseInterval> intervals = pauseIntervalRepository.findBySessionIdOrderByPausedAtAsc(sessionId);
        long workingSeconds = calculateWorkingDurationSeconds(saved, intervals, Instant.now());
        String projectName = resolveProjectName(saved.getProjectId(), userId);
        List<PauseIntervalDto> dtos = intervals.stream().map(PauseIntervalDto::fromEntity).toList();
        return WorkSessionResponse.fromSession(saved, projectName, workingSeconds, dtos);
    }

    @Transactional
    public WorkSessionResponse endSession(UUID userId, UUID sessionId, EndWorkSessionRequest request) {
        WorkSession session = workSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Work session not found with id: " + sessionId));

        // Idempotent completion: if already completed, return existing completed session
        if (session.getStatus() == WorkSessionStatus.COMPLETED) {
            if (request != null && request.sessionNotes() != null && !request.sessionNotes().isBlank()
                    && (session.getSessionNotes() == null || session.getSessionNotes().isBlank())) {
                session.setSessionNotes(request.sessionNotes().trim());
                workSessionRepository.save(session);
            }
            String projectName = resolveProjectName(session.getProjectId(), userId);
            List<SessionPauseInterval> intervals = pauseIntervalRepository.findBySessionIdOrderByPausedAtAsc(sessionId);
            List<PauseIntervalDto> dtos = intervals.stream().map(PauseIntervalDto::fromEntity).toList();
            return WorkSessionResponse.fromSession(session, projectName, session.getTotalDurationSeconds(), dtos);
        }

        Instant now = Instant.now();

        // Close any unfinished pause interval
        pauseIntervalRepository.findFirstBySessionIdAndResumedAtIsNullOrderByPausedAtDesc(sessionId)
                .ifPresent(openPause -> {
                    openPause.setResumedAt(now);
                    pauseIntervalRepository.save(openPause);
                });

        Instant endTime = (request != null && request.endedAt() != null) ? request.endedAt() : now;
        if (endTime.isBefore(session.getStartedAt())) {
            endTime = session.getStartedAt();
        }

        session.setEndedAt(endTime);
        session.setStatus(WorkSessionStatus.COMPLETED);

        if (request != null && request.sessionNotes() != null && !request.sessionNotes().isBlank()) {
            session.setSessionNotes(request.sessionNotes().trim());
        }

        List<SessionPauseInterval> intervals = pauseIntervalRepository.findBySessionIdOrderByPausedAtAsc(sessionId);
        long totalWorkingSeconds = calculateWorkingDurationSeconds(session, intervals, endTime);
        session.setTotalDurationSeconds(totalWorkingSeconds);

        WorkSession saved = workSessionRepository.save(session);
        String projectName = resolveProjectName(saved.getProjectId(), userId);
        List<PauseIntervalDto> dtos = intervals.stream().map(PauseIntervalDto::fromEntity).toList();
        return WorkSessionResponse.fromSession(saved, projectName, totalWorkingSeconds, dtos);
    }

    @Transactional(readOnly = true)
    public WorkSessionResponse getSessionById(UUID userId, UUID sessionId) {
        WorkSession session = workSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Work session not found with id: " + sessionId));

        String projectName = resolveProjectName(session.getProjectId(), userId);
        List<SessionPauseInterval> intervals = pauseIntervalRepository.findBySessionIdOrderByPausedAtAsc(sessionId);
        long workingSeconds = calculateWorkingDurationSeconds(session, intervals, Instant.now());
        List<PauseIntervalDto> dtos = intervals.stream().map(PauseIntervalDto::fromEntity).toList();
        return WorkSessionResponse.fromSession(session, projectName, workingSeconds, dtos);
    }

    @Transactional
    public WorkSessionResponse updateSessionNotes(UUID userId, UUID sessionId, UpdateSessionNotesRequest request) {
        WorkSession session = workSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Work session not found with id: " + sessionId));

        session.setSessionNotes(request.sessionNotes() != null ? request.sessionNotes().trim() : null);
        WorkSession saved = workSessionRepository.save(session);

        String projectName = resolveProjectName(saved.getProjectId(), userId);
        List<SessionPauseInterval> intervals = pauseIntervalRepository.findBySessionIdOrderByPausedAtAsc(sessionId);
        long workingSeconds = calculateWorkingDurationSeconds(saved, intervals, Instant.now());
        List<PauseIntervalDto> dtos = intervals.stream().map(PauseIntervalDto::fromEntity).toList();
        return WorkSessionResponse.fromSession(saved, projectName, workingSeconds, dtos);
    }

    @Transactional(readOnly = true)
    public Page<WorkSessionResponse> getSessions(UUID userId, Pageable pageable) {
        return getSessions(userId, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<WorkSessionResponse> getSessions(UUID userId, UUID projectId, Pageable pageable) {
        Page<WorkSession> page;
        if (projectId != null) {
            projectRepository.findByIdAndUserId(projectId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
            page = workSessionRepository.findByProjectIdAndUserIdOrderByStartedAtDesc(projectId, userId, pageable);
        } else {
            page = workSessionRepository.findByUserIdOrderByStartedAtDesc(userId, pageable);
        }

        Map<UUID, String> projectNames = fetchProjectNames(page.getContent(), userId);

        return page.map(s -> {
            String projectName = s.getProjectId() != null ? projectNames.get(s.getProjectId()) : null;
            return WorkSessionResponse.fromSession(s, projectName, s.getTotalDurationSeconds(), List.of());
        });
    }

    public long calculateWorkingDurationSeconds(WorkSession session, List<SessionPauseInterval> pauseIntervals, Instant asOf) {
        if (session == null || session.getStartedAt() == null) {
            return 0L;
        }

        Instant ceiling = session.getEndedAt() != null ? session.getEndedAt() : asOf;
        long closedPausedSeconds = 0L;

        for (SessionPauseInterval interval : pauseIntervals) {
            if (interval.getResumedAt() != null) {
                long diff = Duration.between(interval.getPausedAt(), interval.getResumedAt()).getSeconds();
                closedPausedSeconds += Math.max(0L, diff);
            } else {
                // Open pause interval - pause in progress
                if (interval.getPausedAt().isBefore(ceiling)) {
                    ceiling = interval.getPausedAt();
                }
            }
        }

        if (ceiling.isBefore(session.getStartedAt())) {
            return 0L;
        }

        long totalWallClockSeconds = Duration.between(session.getStartedAt(), ceiling).getSeconds();
        long workingSeconds = totalWallClockSeconds - closedPausedSeconds;
        return Math.max(0L, workingSeconds);
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
