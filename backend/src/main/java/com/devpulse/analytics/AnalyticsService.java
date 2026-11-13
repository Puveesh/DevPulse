package com.devpulse.analytics;

import com.devpulse.analytics.dto.*;
import com.devpulse.project.Project;
import com.devpulse.project.ProjectRepository;
import com.devpulse.task.Task;
import com.devpulse.task.TaskRepository;
import com.devpulse.task.TaskStatus;
import com.devpulse.worklog.DailyNote;
import com.devpulse.worklog.DailyNoteRepository;
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
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final WorkSessionRepository workSessionRepository;
    private final SessionPauseIntervalRepository pauseIntervalRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final DailyNoteRepository dailyNoteRepository;

    public AnalyticsService(WorkSessionRepository workSessionRepository,
                            SessionPauseIntervalRepository pauseIntervalRepository,
                            ProjectRepository projectRepository,
                            TaskRepository taskRepository,
                            DailyNoteRepository dailyNoteRepository) {
        this.workSessionRepository = workSessionRepository;
        this.pauseIntervalRepository = pauseIntervalRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.dailyNoteRepository = dailyNoteRepository;
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
        List<TodaySessionDto> todaySessions = new ArrayList<>();

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

                todaySessions.add(new TodaySessionDto(
                        session.getId(),
                        session.getProjectId(),
                        null,
                        session.getTitle(),
                        session.getStatus(),
                        session.getStartedAt(),
                        session.getEndedAt(),
                        workingInToday,
                        session.getTotalDurationSeconds(),
                        session.getInitialNotes(),
                        session.getSessionNotes()
                ));
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

        // 5. Populate project names in sessions list, sorted with newest first
        List<TodaySessionDto> populatedSessions = todaySessions.stream()
                .map(s -> new TodaySessionDto(
                        s.id(),
                        s.projectId(),
                        projectNames.getOrDefault(s.projectId(), "General Development"),
                        s.title(),
                        s.status(),
                        s.startedAt(),
                        s.endedAt(),
                        s.todayWorkingSeconds(),
                        s.totalDurationSeconds(),
                        s.initialNotes(),
                        s.sessionNotes()
                ))
                .sorted(Comparator.comparing(TodaySessionDto::startedAt).reversed())
                .toList();

        return new TodayAnalyticsResponse(
                todayDate.toString(),
                totalWorkingSeconds,
                sessionCount,
                distinctProjectIds.size(),
                activeSessionId,
                activeSessionTodayWorkingSeconds,
                projectList,
                populatedSessions
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
     * Comprehensive Developer Analytics Report
     * Provides aggregated productivity metrics, time-series, project distribution,
     * task completion, consistency, streaks, data-driven insights, and recent activity.
     */
    @Transactional(readOnly = true)
    public AnalyticsReportResponse getComprehensiveReport(
            UUID userId,
            String timezone,
            String preset,
            String customStartStr,
            String customEndStr
    ) {
        ZoneId zone = resolveZone(timezone);
        Instant now = Instant.now();
        LocalDate today = LocalDate.now(zone);

        // 1. Resolve date range
        String normalizedPreset = (preset != null && !preset.isBlank()) ? preset.trim().toUpperCase() : "LAST_30_DAYS";
        LocalDate startDate;
        LocalDate endDate = today;

        switch (normalizedPreset) {
            case "LAST_7_DAYS" -> startDate = today.minusDays(6);
            case "LAST_90_DAYS" -> startDate = today.minusDays(89);
            case "THIS_WEEK" -> {
                startDate = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                endDate = today;
            }
            case "THIS_MONTH" -> {
                startDate = today.withDayOfMonth(1);
                endDate = today;
            }
            case "THIS_YEAR" -> {
                startDate = today.withDayOfYear(1);
                endDate = today;
            }
            case "ALL_TIME" -> {
                Optional<Instant> earliestActivity = workSessionRepository.findByUserIdOrderByStartedAtDesc(userId, org.springframework.data.domain.PageRequest.of(0, 100))
                        .getContent().stream()
                        .map(WorkSession::getStartedAt)
                        .min(Comparator.naturalOrder());
                startDate = earliestActivity
                        .map(instant -> LocalDate.ofInstant(instant, zone))
                        .orElse(today.minusYears(1));
                endDate = today;
            }
            case "CUSTOM" -> {
                try {
                    LocalDate parsedStart = LocalDate.parse(customStartStr.trim());
                    LocalDate parsedEnd = LocalDate.parse(customEndStr.trim());
                    if (parsedStart.isAfter(parsedEnd)) {
                        startDate = parsedEnd;
                        endDate = parsedStart;
                    } else {
                        startDate = parsedStart;
                        endDate = parsedEnd;
                    }
                } catch (Exception e) {
                    normalizedPreset = "LAST_30_DAYS";
                    startDate = today.minusDays(29);
                    endDate = today;
                }
            }
            case "LAST_30_DAYS" -> startDate = today.minusDays(29);
            default -> {
                normalizedPreset = "LAST_30_DAYS";
                startDate = today.minusDays(29);
                endDate = today;
            }
        }

        long totalDays = Math.max(1, ChronoUnit.DAYS.between(startDate, endDate) + 1);
        DateRangeDto dateRangeDto = new DateRangeDto(normalizedPreset, startDate.toString(), endDate.toString(), totalDays);

        Instant windowStart = startDate.atStartOfDay(zone).toInstant();
        Instant windowEnd = endDate.plusDays(1).atStartOfDay(zone).toInstant();

        // 2. Fetch candidate sessions intersecting this window
        List<WorkSession> windowSessions = workSessionRepository.findSessionsIntersectingWindow(userId, windowStart, windowEnd);

        // Fetch pause intervals in single batch
        List<UUID> sessionIds = windowSessions.stream().map(WorkSession::getId).toList();
        List<SessionPauseInterval> allPauses = sessionIds.isEmpty()
                ? List.of()
                : pauseIntervalRepository.findBySessionIdInOrderByPausedAtAsc(sessionIds);
        Map<UUID, List<SessionPauseInterval>> pausesBySession = allPauses.stream()
                .collect(Collectors.groupingBy(SessionPauseInterval::getSessionId));

        // Fetch user projects & tasks
        List<Project> userProjects = projectRepository.findByUserIdOrderByUpdatedAtDesc(userId);
        Map<UUID, Project> projectsById = userProjects.stream()
                .collect(Collectors.toMap(Project::getId, p -> p, (a, b) -> a));

        List<Task> userTasks = taskRepository.findByUserId(userId);
        Map<UUID, List<Task>> tasksByProject = userTasks.stream()
                .filter(t -> t.getProjectId() != null)
                .collect(Collectors.groupingBy(Task::getProjectId));

        List<DailyNote> userNotes = dailyNoteRepository.findByUserIdOrderByNoteDateDesc(userId);

        // 3. Process Daily Timeline & Day Slicing
        List<DailyActivityDto> dailyTimeline = new ArrayList<>((int) totalDays);
        long totalWorkingSeconds = 0L;
        int activeDays = 0;
        Map<UUID, Long> projectTotalDurations = new HashMap<>();
        Map<UUID, Integer> projectSessionCounts = new HashMap<>();
        Map<UUID, Set<LocalDate>> projectActiveDates = new HashMap<>();
        Set<UUID> touchedSessionsInPeriod = new HashSet<>();

        long morningSeconds = 0L;   // 06:00 - 12:00
        long afternoonSeconds = 0L; // 12:00 - 18:00
        long eveningSeconds = 0L;   // 18:00 - 24:00
        long nightSeconds = 0L;     // 00:00 - 06:00

        Map<DayOfWeek, Long> weekdayTotals = new EnumMap<>(DayOfWeek.class);
        long mostActiveDaySeconds = 0L;
        long leastActiveDaySeconds = Long.MAX_VALUE;

        for (int i = 0; i < totalDays; i++) {
            LocalDate currentDay = startDate.plusDays(i);
            Instant dayStart = currentDay.atStartOfDay(zone).toInstant();
            Instant dayEnd = currentDay.plusDays(1).atStartOfDay(zone).toInstant();
            String dayName = currentDay.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

            long dayWorkingSeconds = 0L;
            Map<UUID, Long> dayProjectDurations = new HashMap<>();

            for (WorkSession session : windowSessions) {
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
                    touchedSessionsInPeriod.add(session.getId());

                    if (session.getProjectId() != null) {
                        dayProjectDurations.merge(session.getProjectId(), workingInDay, Long::sum);
                        projectTotalDurations.merge(session.getProjectId(), workingInDay, Long::sum);
                        projectActiveDates.computeIfAbsent(session.getProjectId(), k -> new HashSet<>()).add(currentDay);
                    }
                }
            }

            // Slicing 4 Time-of-Day sub-windows
            Instant nightEnd = currentDay.atTime(6, 0).atZone(zone).toInstant();
            Instant morningEnd = currentDay.atTime(12, 0).atZone(zone).toInstant();
            Instant afternoonEnd = currentDay.atTime(18, 0).atZone(zone).toInstant();

            for (WorkSession session : windowSessions) {
                List<SessionPauseInterval> pauses = pausesBySession.getOrDefault(session.getId(), List.of());
                nightSeconds += calculateWorkingSecondsInWindow(session.getStartedAt(), session.getEndedAt(), pauses, dayStart, nightEnd, now);
                morningSeconds += calculateWorkingSecondsInWindow(session.getStartedAt(), session.getEndedAt(), pauses, nightEnd, morningEnd, now);
                afternoonSeconds += calculateWorkingSecondsInWindow(session.getStartedAt(), session.getEndedAt(), pauses, morningEnd, afternoonEnd, now);
                eveningSeconds += calculateWorkingSecondsInWindow(session.getStartedAt(), session.getEndedAt(), pauses, afternoonEnd, dayEnd, now);
            }

            List<ProjectDurationDto> dayProjectList = dayProjectDurations.entrySet().stream()
                    .map(entry -> new ProjectDurationDto(
                            entry.getKey(),
                            projectsById.containsKey(entry.getKey()) ? projectsById.get(entry.getKey()).getName() : "Unknown Project",
                            entry.getValue()
                    ))
                    .sorted(Comparator.comparingLong(ProjectDurationDto::durationSeconds).reversed())
                    .toList();

            dailyTimeline.add(new DailyActivityDto(currentDay.toString(), dayName, dayWorkingSeconds, dayProjectList));
            totalWorkingSeconds += dayWorkingSeconds;

            if (dayWorkingSeconds > 0) {
                activeDays++;
                weekdayTotals.merge(currentDay.getDayOfWeek(), dayWorkingSeconds, Long::sum);
                if (dayWorkingSeconds > mostActiveDaySeconds) {
                    mostActiveDaySeconds = dayWorkingSeconds;
                }
                if (dayWorkingSeconds < leastActiveDaySeconds) {
                    leastActiveDaySeconds = dayWorkingSeconds;
                }
            }
        }

        if (leastActiveDaySeconds == Long.MAX_VALUE) {
            leastActiveDaySeconds = 0L;
        }

        // Count sessions belonging to each project
        for (WorkSession session : windowSessions) {
            if (touchedSessionsInPeriod.contains(session.getId()) && session.getProjectId() != null) {
                projectSessionCounts.merge(session.getProjectId(), 1, Integer::sum);
            }
        }

        // 4. Productivity Overview KPI calculations
        long averageDailyWorkingSeconds = totalDays > 0 ? totalWorkingSeconds / totalDays : 0L;
        long averageActiveDayWorkingSeconds = activeDays > 0 ? totalWorkingSeconds / activeDays : 0L;
        int totalSessions = touchedSessionsInPeriod.size();
        int activeProjectCount = projectTotalDurations.size();

        // Tasks completed during this window
        int tasksCompletedInPeriod = (int) userTasks.stream()
                .filter(t -> t.getStatus() == TaskStatus.COMPLETED)
                .filter(t -> t.getUpdatedAt() != null && !t.getUpdatedAt().isBefore(windowStart) && !t.getUpdatedAt().isAfter(windowEnd))
                .count();

        // If no tasks were updated in window but overall has completed, and preset is ALL_TIME
        if (tasksCompletedInPeriod == 0 && "ALL_TIME".equals(normalizedPreset)) {
            tasksCompletedInPeriod = (int) userTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
        }

        long activeSessionElapsedInPeriod = 0L;
        for (WorkSession session : windowSessions) {
            if (session.getStatus() == WorkSessionStatus.ACTIVE && session.getEndedAt() == null) {
                List<SessionPauseInterval> pauses = pausesBySession.getOrDefault(session.getId(), List.of());
                activeSessionElapsedInPeriod = calculateWorkingSecondsInWindow(
                        session.getStartedAt(),
                        null,
                        pauses,
                        windowStart,
                        windowEnd,
                        now
                );
                break;
            }
        }

        ProductivityOverviewDto overviewDto = new ProductivityOverviewDto(
                totalWorkingSeconds,
                averageDailyWorkingSeconds,
                averageActiveDayWorkingSeconds,
                totalSessions,
                activeDays,
                activeProjectCount,
                tasksCompletedInPeriod,
                activeSessionElapsedInPeriod
        );

        // 5. Project Breakdown & Task Progress per project
        final long finalTotalWorking = totalWorkingSeconds;
        List<ProjectAnalyticsDto> projectAnalyticsList = new ArrayList<>();

        for (Project project : userProjects) {
            long pDuration = projectTotalDurations.getOrDefault(project.getId(), 0L);
            double pctOfTotal = (finalTotalWorking > 0)
                    ? Math.round((pDuration * 100.0 / finalTotalWorking) * 10.0) / 10.0
                    : 0.0;
            int pSessions = projectSessionCounts.getOrDefault(project.getId(), 0);
            int pActiveDays = projectActiveDates.getOrDefault(project.getId(), Collections.emptySet()).size();

            List<Task> pTasks = tasksByProject.getOrDefault(project.getId(), Collections.emptyList());
            int totalPTasks = pTasks.size();
            int completedPTasks = (int) pTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
            int inProgressPTasks = (int) pTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
            int todoPTasks = (int) pTasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
            int cancelledPTasks = (int) pTasks.stream().filter(t -> t.getStatus() == TaskStatus.CANCELLED).count();
            int eligiblePTasks = totalPTasks - cancelledPTasks;
            double completionPct = eligiblePTasks > 0
                    ? Math.round((completedPTasks * 100.0 / eligiblePTasks) * 10.0) / 10.0
                    : 0.0;

            projectAnalyticsList.add(new ProjectAnalyticsDto(
                    project.getId(),
                    project.getName(),
                    project.getTechStack(),
                    project.getStatus() != null ? project.getStatus().name() : "ACTIVE",
                    pDuration,
                    pctOfTotal,
                    pSessions,
                    pActiveDays,
                    totalPTasks,
                    completedPTasks,
                    inProgressPTasks,
                    todoPTasks,
                    cancelledPTasks,
                    completionPct
            ));
        }

        projectAnalyticsList.sort(Comparator.comparingLong(ProjectAnalyticsDto::totalWorkingSeconds).reversed()
                .thenComparing(ProjectAnalyticsDto::projectName));

        // 6. Overall Task Metrics
        int overallTotalTasks = userTasks.size();
        int overallCompleted = (int) userTasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
        int overallInProgress = (int) userTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count();
        int overallTodo = (int) userTasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count();
        int overallCancelled = (int) userTasks.stream().filter(t -> t.getStatus() == TaskStatus.CANCELLED).count();
        int overallEligible = overallTotalTasks - overallCancelled;
        double overallCompletionPct = overallEligible > 0
                ? Math.round((overallCompleted * 100.0 / overallEligible) * 10.0) / 10.0
                : 0.0;

        TaskOverviewDto taskOverviewDto = new TaskOverviewDto(
                overallTotalTasks,
                overallCompleted,
                overallInProgress,
                overallTodo,
                overallCancelled,
                overallCompletionPct
        );

        // 7. Consistency & Streaks calculation across all history
        Set<LocalDate> allActiveDates = computeAllActiveDates(userId, zone, now);
        int currentStreak = computeCurrentStreak(allActiveDates, today);
        int longestStreak = computeLongestStreak(allActiveDates);
        double activeDaysRatio = totalDays > 0
                ? Math.round((activeDays * 100.0 / totalDays) * 10.0) / 10.0
                : 0.0;

        String mostActiveWeekday = weekdayTotals.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> e.getKey().getDisplayName(TextStyle.FULL, Locale.ENGLISH))
                .orElse("None");

        String mostProductiveTimeSlot = resolveMostProductiveSlot(morningSeconds, afternoonSeconds, eveningSeconds, nightSeconds);

        ConsistencyDto consistencyDto = new ConsistencyDto(
                currentStreak,
                longestStreak,
                activeDays,
                totalDays,
                activeDaysRatio,
                mostActiveWeekday,
                mostActiveDaySeconds,
                leastActiveDaySeconds,
                averageActiveDayWorkingSeconds,
                morningSeconds,
                afternoonSeconds,
                eveningSeconds,
                nightSeconds,
                mostProductiveTimeSlot
        );

        // 8. Deterministic Data-Driven Insights
        List<AnalyticsInsightDto> insights = generateInsights(
                totalWorkingSeconds,
                activeDays,
                totalDays,
                totalSessions,
                projectAnalyticsList,
                overallTotalTasks,
                overallCompleted,
                overallInProgress,
                overallTodo,
                currentStreak,
                weekdayTotals,
                mostProductiveTimeSlot
        );

        // 9. Recent Development Activities
        List<RecentActivityItemDto> recentActivities = buildRecentActivities(
                windowSessions,
                userTasks,
                userNotes,
                projectsById,
                windowStart,
                windowEnd
        );

        return new AnalyticsReportResponse(
                dateRangeDto,
                overviewDto,
                dailyTimeline,
                projectAnalyticsList,
                taskOverviewDto,
                consistencyDto,
                insights,
                recentActivities
        );
    }

    private Set<LocalDate> computeAllActiveDates(UUID userId, ZoneId zone, Instant now) {
        Instant pastYear = now.minus(365, ChronoUnit.DAYS);
        List<WorkSession> sessions = workSessionRepository.findSessionsIntersectingWindow(userId, pastYear, now);
        if (sessions.isEmpty()) {
            return Collections.emptySet();
        }

        List<UUID> sessionIds = sessions.stream().map(WorkSession::getId).toList();
        List<SessionPauseInterval> pauses = pauseIntervalRepository.findBySessionIdInOrderByPausedAtAsc(sessionIds);
        Map<UUID, List<SessionPauseInterval>> pausesBySession = pauses.stream()
                .collect(Collectors.groupingBy(SessionPauseInterval::getSessionId));

        Set<LocalDate> activeDates = new HashSet<>();
        for (WorkSession s : sessions) {
            LocalDate start = LocalDate.ofInstant(s.getStartedAt(), zone);
            LocalDate end = s.getEndedAt() != null ? LocalDate.ofInstant(s.getEndedAt(), zone) : LocalDate.ofInstant(now, zone);
            for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
                Instant dStart = d.atStartOfDay(zone).toInstant();
                Instant dEnd = d.plusDays(1).atStartOfDay(zone).toInstant();
                long sec = calculateWorkingSecondsInWindow(s.getStartedAt(), s.getEndedAt(), pausesBySession.getOrDefault(s.getId(), List.of()), dStart, dEnd, now);
                if (sec > 0) {
                    activeDates.add(d);
                }
            }
        }
        return activeDates;
    }

    private int computeCurrentStreak(Set<LocalDate> activeDates, LocalDate today) {
        if (activeDates.isEmpty()) return 0;
        int streak = 0;
        LocalDate cursor = today;
        if (activeDates.contains(today)) {
            while (activeDates.contains(cursor)) {
                streak++;
                cursor = cursor.minusDays(1);
            }
        } else if (activeDates.contains(today.minusDays(1))) {
            cursor = today.minusDays(1);
            while (activeDates.contains(cursor)) {
                streak++;
                cursor = cursor.minusDays(1);
            }
        }
        return streak;
    }

    private int computeLongestStreak(Set<LocalDate> activeDates) {
        if (activeDates.isEmpty()) return 0;
        List<LocalDate> sorted = activeDates.stream().sorted().toList();
        int max = 1;
        int current = 1;
        for (int i = 1; i < sorted.size(); i++) {
            if (sorted.get(i).equals(sorted.get(i - 1).plusDays(1))) {
                current++;
                if (current > max) {
                    max = current;
                }
            } else if (!sorted.get(i).equals(sorted.get(i - 1))) {
                current = 1;
            }
        }
        return max;
    }

    private String resolveMostProductiveSlot(long morning, long afternoon, long evening, long night) {
        long max = Math.max(morning, Math.max(afternoon, Math.max(evening, night)));
        if (max == 0) return "No Activity Recorded";
        if (max == morning) return "Morning (06:00 - 12:00)";
        if (max == afternoon) return "Afternoon (12:00 - 18:00)";
        if (max == evening) return "Evening (18:00 - 00:00)";
        return "Night (00:00 - 06:00)";
    }

    private List<AnalyticsInsightDto> generateInsights(
            long totalWorkingSeconds,
            int activeDays,
            long totalDays,
            int totalSessions,
            List<ProjectAnalyticsDto> projects,
            int totalTasks,
            int completedTasks,
            int inProgressTasks,
            int todoTasks,
            int currentStreak,
            Map<DayOfWeek, Long> weekdayTotals,
            String mostProductiveTimeSlot
    ) {
        List<AnalyticsInsightDto> list = new ArrayList<>();

        if (totalWorkingSeconds == 0) {
            list.add(new AnalyticsInsightDto(
                    "EMPTY",
                    "No Activity in Selected Period",
                    "There are no recorded development sessions within this date window. Start a timer from the Dashboard to record focused coding time.",
                    "WORK_PATTERN",
                    "INFO"
            ));
            return list;
        }

        // 1. Working pattern insight
        long weekdaySec = weekdayTotals.entrySet().stream()
                .filter(e -> e.getKey() != DayOfWeek.SATURDAY && e.getKey() != DayOfWeek.SUNDAY)
                .mapToLong(Map.Entry::getValue).sum();
        long weekendSec = weekdayTotals.entrySet().stream()
                .filter(e -> e.getKey() == DayOfWeek.SATURDAY || e.getKey() == DayOfWeek.SUNDAY)
                .mapToLong(Map.Entry::getValue).sum();
        double weekdayPct = totalWorkingSeconds > 0 ? (weekdaySec * 100.0 / totalWorkingSeconds) : 0.0;

        if (weekdayPct >= 70.0) {
            list.add(new AnalyticsInsightDto(
                    "WORK_PATTERN",
                    "Weekday Focused Workflow",
                    String.format("%.0f%% of your development time took place during regular weekdays. Your most productive slot is %s.", weekdayPct, mostProductiveTimeSlot),
                    "WORK_PATTERN",
                    "SUCCESS"
            ));
        } else if (weekendSec > weekdaySec) {
            list.add(new AnalyticsInsightDto(
                    "WORK_PATTERN",
                    "Weekend Momentum",
                    String.format("Over half of your development work (%.0f%%) took place over the weekend. Primary time slot: %s.", (weekendSec * 100.0 / totalWorkingSeconds), mostProductiveTimeSlot),
                    "WORK_PATTERN",
                    "INFO"
            ));
        }

        // 2. Project focus insight
        if (!projects.isEmpty()) {
            ProjectAnalyticsDto top = projects.get(0);
            if (top.percentageOfTotalTime() >= 50.0) {
                list.add(new AnalyticsInsightDto(
                        "PROJECT_FOCUS",
                        "High Project Concentration",
                        String.format("'%s' is your dominant focus, accounting for %.1f%% of all tracked development time (%s).",
                                top.projectName(), top.percentageOfTotalTime(), formatDurationHoursMinutes(top.totalWorkingSeconds())),
                        "PROJECT_FOCUS",
                        "INFO"
                ));
            } else if (projects.size() >= 2) {
                list.add(new AnalyticsInsightDto(
                        "PROJECT_FOCUS",
                        "Balanced Multi-Project Cadence",
                        String.format("Your coding hours are spread across %d active projects, led by '%s' (%.1f%%).",
                                projects.size(), top.projectName(), top.percentageOfTotalTime()),
                        "PROJECT_FOCUS",
                        "SUCCESS"
                ));
            }
        }

        // 3. Task velocity & remaining workload
        int pending = inProgressTasks + todoTasks;
        if (completedTasks > 0) {
            list.add(new AnalyticsInsightDto(
                    "TASK_VELOCITY",
                    "Feature Delivery Progress",
                    String.format("You have delivered %d completed tasks with %d pending (%d in progress, %d to-do).",
                            completedTasks, pending, inProgressTasks, todoTasks),
                    "TASK_VELOCITY",
                    "SUCCESS"
            ));
        } else if (pending > 0) {
            list.add(new AnalyticsInsightDto(
                    "TASK_VELOCITY",
                    "Backlog Waiting for Execution",
                    String.format("You have %d pending tasks across your projects waiting to be completed.", pending),
                    "TASK_VELOCITY",
                    "WARNING"
            ));
        }

        // 4. Consistency & streaks
        if (currentStreak >= 3) {
            list.add(new AnalyticsInsightDto(
                    "CONSISTENCY",
                    "Active Coding Streak",
                    String.format("You are on a %d-day continuous development streak. You coded on %d of %d days in this period.",
                            currentStreak, activeDays, totalDays),
                    "CONSISTENCY",
                    "SUCCESS"
            ));
        } else {
            double ratio = totalDays > 0 ? (activeDays * 100.0 / totalDays) : 0;
            list.add(new AnalyticsInsightDto(
                    "CONSISTENCY",
                    "Consistency Rhythm",
                    String.format("You were active on %d of %d calendar days (%.0f%% consistency).",
                            activeDays, totalDays, ratio),
                    "CONSISTENCY",
                    "INFO"
            ));
        }

        // 5. Work session pattern
        if (totalSessions > 0) {
            long avgSessionSec = totalWorkingSeconds / totalSessions;
            list.add(new AnalyticsInsightDto(
                    "SESSION_PATTERN",
                    "Session Duration Pattern",
                    String.format("Across %d sessions, your average focused development block lasted %s.",
                            totalSessions, formatDurationHoursMinutes(avgSessionSec)),
                    "RECOMMENDATION",
                    "INFO"
            ));
        }

        // 6. Actionable recommendations
        for (ProjectAnalyticsDto p : projects) {
            if (p.totalTasks() >= 3 && p.totalWorkingSeconds() == 0) {
                list.add(new AnalyticsInsightDto(
                        "ATTENTION",
                        "Project Attention Needed",
                        String.format("Project '%s' has %d pending tasks but no tracked sessions recorded in this period.",
                                p.projectName(), p.todoTasks() + p.inProgressTasks()),
                        "RECOMMENDATION",
                        "WARNING"
                ));
                break;
            }
        }

        return list;
    }

    private List<RecentActivityItemDto> buildRecentActivities(
            List<WorkSession> sessions,
            List<Task> tasks,
            List<DailyNote> notes,
            Map<UUID, Project> projects,
            Instant windowStart,
            Instant windowEnd
    ) {
        List<RecentActivityItemDto> items = new ArrayList<>();

        // Add sessions
        for (WorkSession s : sessions) {
            if (s.getStatus() == WorkSessionStatus.COMPLETED && s.getEndedAt() != null) {
                if (!s.getEndedAt().isBefore(windowStart) && !s.getEndedAt().isAfter(windowEnd)) {
                    String pName = (s.getProjectId() != null && projects.containsKey(s.getProjectId()))
                            ? projects.get(s.getProjectId()).getName()
                            : "General";
                    items.add(new RecentActivityItemDto(
                            "session-" + s.getId(),
                            "SESSION_COMPLETED",
                            "Completed Session: " + s.getTitle(),
                            s.getSessionNotes() != null ? s.getSessionNotes() : "Logged focused development time",
                            s.getProjectId(),
                            pName,
                            s.getEndedAt(),
                            s.getTotalDurationSeconds(),
                            "COMPLETED"
                    ));
                }
            } else if (s.getStatus() == WorkSessionStatus.ACTIVE) {
                String pName = (s.getProjectId() != null && projects.containsKey(s.getProjectId()))
                        ? projects.get(s.getProjectId()).getName()
                        : "General";
                items.add(new RecentActivityItemDto(
                        "session-" + s.getId(),
                        "SESSION_ACTIVE",
                        "Active Session: " + s.getTitle(),
                        "Development session currently in progress",
                        s.getProjectId(),
                        pName,
                        s.getStartedAt(),
                        null,
                        "ACTIVE"
                    ));
            }
        }

        // Add tasks
        for (Task t : tasks) {
            if (t.getUpdatedAt() != null && !t.getUpdatedAt().isBefore(windowStart) && !t.getUpdatedAt().isAfter(windowEnd)) {
                String pName = (t.getProjectId() != null && projects.containsKey(t.getProjectId()))
                        ? projects.get(t.getProjectId()).getName()
                        : "General";
                if (t.getStatus() == TaskStatus.COMPLETED) {
                    items.add(new RecentActivityItemDto(
                            "task-" + t.getId(),
                            "TASK_COMPLETED",
                            "Completed Task: " + t.getTitle(),
                            t.getDescription() != null ? t.getDescription() : "Task marked as completed",
                            t.getProjectId(),
                            pName,
                            t.getUpdatedAt(),
                            null,
                            "COMPLETED"
                    ));
                } else if (t.getCreatedAt() != null && !t.getCreatedAt().isBefore(windowStart)) {
                    items.add(new RecentActivityItemDto(
                            "task-" + t.getId(),
                            "TASK_CREATED",
                            "Created Task: " + t.getTitle(),
                            t.getDescription() != null ? t.getDescription() : "New task item added",
                            t.getProjectId(),
                            pName,
                            t.getCreatedAt(),
                            null,
                            t.getStatus().name()
                    ));
                }
            }
        }

        // Add daily notes
        for (DailyNote n : notes) {
            if (n.getUpdatedAt() != null && !n.getUpdatedAt().isBefore(windowStart) && !n.getUpdatedAt().isAfter(windowEnd)) {
                String pName = (n.getProjectId() != null && projects.containsKey(n.getProjectId()))
                        ? projects.get(n.getProjectId()).getName()
                        : "Project Journal";
                items.add(new RecentActivityItemDto(
                        "note-" + n.getId(),
                        "NOTE_SAVED",
                        "Saved Daily Journal: " + n.getNoteDate(),
                        "Development notes and references recorded",
                        n.getProjectId(),
                        pName,
                        n.getUpdatedAt(),
                        null,
                        "SAVED"
                ));
            }
        }

        items.sort(Comparator.comparing(RecentActivityItemDto::timestamp).reversed());
        return items.stream().limit(15).toList();
    }

    private static String formatDurationHoursMinutes(long seconds) {
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        if (hours == 0) {
            return minutes + "m";
        }
        return String.format("%dh %02dm", hours, minutes);
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
