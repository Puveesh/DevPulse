package com.devpulse.analytics;

import com.devpulse.analytics.dto.DailyActivityDto;
import com.devpulse.analytics.dto.ProjectDurationDto;
import com.devpulse.analytics.dto.TodayAnalyticsResponse;
import com.devpulse.analytics.dto.WeeklyAnalyticsResponse;
import com.devpulse.project.Project;
import com.devpulse.project.ProjectRepository;
import com.devpulse.worklog.SessionPauseInterval;
import com.devpulse.worklog.SessionPauseIntervalRepository;
import com.devpulse.worklog.WorkSession;
import com.devpulse.worklog.WorkSessionRepository;
import com.devpulse.worklog.WorkSessionStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final WorkSessionRepository workSessionRepository;
    private final SessionPauseIntervalRepository pauseIntervalRepository;
    private final ProjectRepository projectRepository;

    public AnalyticsService(WorkSessionRepository workSessionRepository,
                            SessionPauseIntervalRepository pauseIntervalRepository,
                            ProjectRepository projectRepository) {
        this.workSessionRepository = workSessionRepository;
        this.pauseIntervalRepository = pauseIntervalRepository;
        this.projectRepository = projectRepository;
    }

    @Transactional(readOnly = true)
    public TodayAnalyticsResponse getTodayAnalytics(UUID userId, String timezone) {
        ZoneId zone = resolveZone(timezone);
        Instant now = Instant.now();
        LocalDate todayDate = LocalDate.now(zone);

        Instant todayStart = todayDate.atStartOfDay(zone).toInstant();
        Instant todayEnd = todayDate.plusDays(1).atStartOfDay(zone).toInstant();

        // 1. Fetch all candidate sessions intersecting today's window
        List<WorkSession> sessions = workSessionRepository.findSessionsIntersectingWindow(userId, todayStart, todayEnd);

        // 2. Fetch pause intervals for all candidate sessions in a single query
        List<UUID> sessionIds = sessions.stream().map(WorkSession::getId).toList();
        List<SessionPauseInterval> allPauses = sessionIds.isEmpty()
                ? List.of()
                : pauseIntervalRepository.findBySessionIdInOrderByPausedAtAsc(sessionIds);
        Map<UUID, List<SessionPauseInterval>> pausesBySession = allPauses.stream()
                .collect(Collectors.groupingBy(SessionPauseInterval::getSessionId));

        // 3. Process sessions and aggregate today's working time
        long totalWorkingSeconds = 0L;
        int sessionCount = 0;
        Set<UUID> distinctProjectIds = new HashSet<>();
        Map<UUID, Long> projectDurations = new HashMap<>();

        UUID activeSessionId = null;
        long activeSessionTodayWorkingSeconds = 0L;

        for (WorkSession session : sessions) {
            List<SessionPauseInterval> pauses = pausesBySession.getOrDefault(session.getId(), List.of());
            long workingInToday = calculateWorkingSecondsInWindow(
                    session.getStartedAt(),
                    session.getEndedAt(),
                    pauses,
                    todayStart,
                    todayEnd,
                    now
            );

            if (workingInToday > 0) {
                totalWorkingSeconds += workingInToday;
                sessionCount++;
                if (session.getProjectId() != null) {
                    distinctProjectIds.add(session.getProjectId());
                    projectDurations.merge(session.getProjectId(), workingInToday, Long::sum);
                }
            }

            if (session.getStatus() == WorkSessionStatus.ACTIVE && session.getEndedAt() == null) {
                activeSessionId = session.getId();
                activeSessionTodayWorkingSeconds = workingInToday;
            }
        }

        // 4. Resolve project names and sort breakdown descending by duration
        Map<UUID, String> projectNames = resolveProjectNames(distinctProjectIds, userId);
        List<ProjectDurationDto> projectList = projectDurations.entrySet().stream()
                .map(entry -> new ProjectDurationDto(
                        entry.getKey(),
                        projectNames.getOrDefault(entry.getKey(), "Unknown Project"),
                        entry.getValue()
                ))
                .sorted(Comparator.comparingLong(ProjectDurationDto::durationSeconds).reversed())
                .toList();

        return new TodayAnalyticsResponse(
                todayDate.toString(),
                totalWorkingSeconds,
                sessionCount,
                distinctProjectIds.size(),
                activeSessionId,
                activeSessionTodayWorkingSeconds,
                projectList
        );
    }

    @Transactional(readOnly = true)
    public WeeklyAnalyticsResponse getWeeklyAnalytics(UUID userId, String timezone) {
        return getWeeklyAnalytics(userId, timezone, null);
    }

    @Transactional(readOnly = true)
    public WeeklyAnalyticsResponse getWeeklyAnalytics(UUID userId, String timezone, String weekStartStr) {
        ZoneId zone = resolveZone(timezone);
        Instant now = Instant.now();
        LocalDate todayDate = LocalDate.now(zone);

        LocalDate currentWeekMonday = todayDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate mondayDate;

        if (weekStartStr != null && !weekStartStr.isBlank()) {
            try {
                LocalDate requestedDate = LocalDate.parse(weekStartStr.trim());
                LocalDate requestedMonday = requestedDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                // Guard: Do not allow navigation into future weeks
                if (requestedMonday.isAfter(currentWeekMonday)) {
                    mondayDate = currentWeekMonday;
                } else {
                    mondayDate = requestedMonday;
                }
            } catch (Exception e) {
                mondayDate = currentWeekMonday;
            }
        } else {
            mondayDate = currentWeekMonday;
        }

        LocalDate sundayDate = mondayDate.plusDays(6);

        Instant weekStart = mondayDate.atStartOfDay(zone).toInstant();
        Instant weekEnd = sundayDate.plusDays(1).atStartOfDay(zone).toInstant();

        // 1. Fetch candidate sessions intersecting the week
        List<WorkSession> sessions = workSessionRepository.findSessionsIntersectingWindow(userId, weekStart, weekEnd);

        // 2. Fetch pause intervals in single query
        List<UUID> sessionIds = sessions.stream().map(WorkSession::getId).toList();
        List<SessionPauseInterval> allPauses = sessionIds.isEmpty()
                ? List.of()
                : pauseIntervalRepository.findBySessionIdInOrderByPausedAtAsc(sessionIds);
        Map<UUID, List<SessionPauseInterval>> pausesBySession = allPauses.stream()
                .collect(Collectors.groupingBy(SessionPauseInterval::getSessionId));

        // 3. Resolve project names for all projects touched in the week
        Set<UUID> allWeekProjectIds = sessions.stream()
                .map(WorkSession::getProjectId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> projectNames = resolveProjectNames(allWeekProjectIds, userId);

        // 4. Calculate 7 daily buckets (Monday through Sunday)
        List<DailyActivityDto> dailyList = new ArrayList<>(7);
        long totalWeeklySeconds = 0L;
        int activeDays = 0;
        String mostActiveDay = null;
        long maxDaySeconds = 0L;
        Set<UUID> activeProjectIdsInWeek = new HashSet<>();

        for (int i = 0; i < 7; i++) {
            LocalDate currentDay = mondayDate.plusDays(i);
            Instant dayStart = currentDay.atStartOfDay(zone).toInstant();
            Instant dayEnd = currentDay.plusDays(1).atStartOfDay(zone).toInstant();
            String dayName = currentDay.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

            long dayWorkingSeconds = 0L;
            Map<UUID, Long> dayProjectDurations = new HashMap<>();

            for (WorkSession session : sessions) {
                List<SessionPauseInterval> pauses = pausesBySession.getOrDefault(session.getId(), List.of());
                long workingInDay = calculateWorkingSecondsInWindow(
                        session.getStartedAt(),
                        session.getEndedAt(),
                        pauses,
                        dayStart,
                        dayEnd,
                        now
                );

                if (workingInDay > 0) {
                    dayWorkingSeconds += workingInDay;
                    if (session.getProjectId() != null) {
                        dayProjectDurations.merge(session.getProjectId(), workingInDay, Long::sum);
                        activeProjectIdsInWeek.add(session.getProjectId());
                    }
                }
            }

            List<ProjectDurationDto> dayProjectList = dayProjectDurations.entrySet().stream()
                    .map(entry -> new ProjectDurationDto(
                            entry.getKey(),
                            projectNames.getOrDefault(entry.getKey(), "Unknown Project"),
                            entry.getValue()
                    ))
                    .sorted(Comparator.comparingLong(ProjectDurationDto::durationSeconds).reversed())
                    .toList();

            dailyList.add(new DailyActivityDto(currentDay.toString(), dayName, dayWorkingSeconds, dayProjectList));
            totalWeeklySeconds += dayWorkingSeconds;

            if (dayWorkingSeconds > 0) {
                activeDays++;
                if (dayWorkingSeconds > maxDaySeconds) {
                    maxDaySeconds = dayWorkingSeconds;
                    mostActiveDay = dayName;
                }
            }
        }

        // Active session tracking across the week (only if viewing current week)
        UUID activeSessionId = null;
        long activeSessionWeeklyWorkingSeconds = 0L;
        boolean isCurrentWeek = mondayDate.equals(currentWeekMonday);

        if (isCurrentWeek) {
            for (WorkSession session : sessions) {
                if (session.getStatus() == WorkSessionStatus.ACTIVE && session.getEndedAt() == null) {
                    activeSessionId = session.getId();
                    List<SessionPauseInterval> pauses = pausesBySession.getOrDefault(session.getId(), List.of());
                    activeSessionWeeklyWorkingSeconds = calculateWorkingSecondsInWindow(
                            session.getStartedAt(),
                            null,
                            pauses,
                            weekStart,
                            weekEnd,
                            now
                    );
                    break;
                }
            }
        }

        return new WeeklyAnalyticsResponse(
                mondayDate.toString(),
                sundayDate.toString(),
                totalWeeklySeconds,
                activeDays,
                mostActiveDay,
                activeProjectIdsInWeek.size(),
                activeSessionId,
                activeSessionWeeklyWorkingSeconds,
                dailyList
        );
    }

    /**
     * Slices the working duration of a session within the given [windowStart, windowEnd] boundary.
     * Accurately handles midnight crossing, multi-day spans, open/closed pause intervals,
     * and excludes all paused duration falling within the slice window.
     */
    public static long calculateWorkingSecondsInWindow(
            Instant sessionStartedAt,
            Instant sessionEndedAt,
            List<SessionPauseInterval> pauseIntervals,
            Instant windowStart,
            Instant windowEnd,
            Instant asOfNow
    ) {
        if (sessionStartedAt == null || windowStart == null || windowEnd == null) {
            return 0L;
        }
        if (!windowStart.isBefore(windowEnd)) {
            return 0L;
        }

        Instant effectiveEnd = (sessionEndedAt != null) ? sessionEndedAt : asOfNow;
        if (effectiveEnd.isBefore(sessionStartedAt)) {
            effectiveEnd = sessionStartedAt;
        }

        Instant overlapStart = sessionStartedAt.isAfter(windowStart) ? sessionStartedAt : windowStart;
        Instant overlapEnd = effectiveEnd.isBefore(windowEnd) ? effectiveEnd : windowEnd;

        if (!overlapStart.isBefore(overlapEnd)) {
            return 0L;
        }

        long grossSeconds = Duration.between(overlapStart, overlapEnd).getSeconds();
        long pausedSecondsInWindow = 0L;

        if (pauseIntervals != null && !pauseIntervals.isEmpty()) {
            for (SessionPauseInterval pause : pauseIntervals) {
                Instant pauseStart = pause.getPausedAt();
                // If resumedAt is null, the pause interval is open up to effectiveEnd
                Instant pauseEnd = (pause.getResumedAt() != null) ? pause.getResumedAt() : effectiveEnd;

                if (pauseEnd.isBefore(pauseStart)) {
                    pauseEnd = pauseStart;
                }

                Instant pOverlapStart = pauseStart.isAfter(overlapStart) ? pauseStart : overlapStart;
                Instant pOverlapEnd = pauseEnd.isBefore(overlapEnd) ? pauseEnd : overlapEnd;

                if (pOverlapStart.isBefore(pOverlapEnd)) {
                    pausedSecondsInWindow += Duration.between(pOverlapStart, pOverlapEnd).getSeconds();
                }
            }
        }

        long workingSeconds = grossSeconds - pausedSecondsInWindow;
        return Math.max(0L, workingSeconds);
    }

    private ZoneId resolveZone(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return ZoneOffset.UTC;
        }
        try {
            return ZoneId.of(timezone.trim());
        } catch (Exception e) {
            return ZoneOffset.UTC;
        }
    }

    private Map<UUID, String> resolveProjectNames(Set<UUID> projectIds, UUID userId) {
        if (projectIds == null || projectIds.isEmpty()) {
            return Map.of();
        }
        return projectRepository.findAllById(projectIds).stream()
                .filter(p -> Objects.equals(p.getUserId(), userId))
                .collect(Collectors.toMap(Project::getId, Project::getName));
    }
}

