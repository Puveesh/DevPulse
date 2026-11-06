package com.devpulse.analytics;

import com.devpulse.auth.dto.AuthResponse;
import com.devpulse.auth.dto.RegisterRequest;
import com.devpulse.common.ApiResponse;
import com.devpulse.project.Project;
import com.devpulse.project.ProjectRepository;
import com.devpulse.project.ProjectStatus;
import com.devpulse.user.UserRepository;
import com.devpulse.worklog.SessionPauseInterval;
import com.devpulse.worklog.SessionPauseIntervalRepository;
import com.devpulse.worklog.WorkSession;
import com.devpulse.worklog.WorkSessionRepository;
import com.devpulse.worklog.WorkSessionStatus;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AnalyticsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private WorkSessionRepository workSessionRepository;

    @Autowired
    private SessionPauseIntervalRepository pauseIntervalRepository;

    @BeforeEach
    void setUp() {
        pauseIntervalRepository.deleteAll();
        workSessionRepository.deleteAll();
        projectRepository.deleteAll();
        userRepository.deleteAll();
    }

    private String registerAndGetToken(String email, String name) throws Exception {
        RegisterRequest request = new RegisterRequest(email, "StrongPass123!", name);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        ApiResponse<AuthResponse> response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                new TypeReference<>() {}
        );
        return response.data().accessToken();
    }

    @Test
    void testEmptyAnalyticsReturnsZeroValues() throws Exception {
        String token = registerAndGetToken("empty-analytics@devpulse.io", "Zero User");

        // Today with no sessions
        mockMvc.perform(get("/api/v1/analytics/dashboard/today?timezone=UTC")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalDurationSeconds", is(0)))
                .andExpect(jsonPath("$.data.sessionCount", is(0)))
                .andExpect(jsonPath("$.data.projectCount", is(0)))
                .andExpect(jsonPath("$.data.projects", hasSize(0)));

        // Weekly with no sessions
        mockMvc.perform(get("/api/v1/analytics/dashboard/weekly?timezone=UTC")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalDurationSeconds", is(0)))
                .andExpect(jsonPath("$.data.activeDays", is(0)))
                .andExpect(jsonPath("$.data.dailyActivity", hasSize(7)));
    }

    @Test
    void testTodayAnalyticsWithCompletedAndActiveSessions() throws Exception {
        String token = registerAndGetToken("user-today@devpulse.io", "Today User");
        UUID userId = userRepository.findByEmail("user-today@devpulse.io").orElseThrow().getId();

        Project projA = projectRepository.save(new Project(userId, "Project A", "Desc", null, "Java", ProjectStatus.ACTIVE));
        Project projB = projectRepository.save(new Project(userId, "Project B", "Desc", null, "React", ProjectStatus.ACTIVE));

        Instant now = Instant.now();

        // Session 1 on Project A: 1 hour completed (3600 seconds)
        WorkSession s1 = new WorkSession(userId, projA.getId(), null, "Sprint 1", "Notes", now.minusSeconds(7200));
        s1.setEndedAt(now.minusSeconds(3600));
        s1.setStatus(WorkSessionStatus.COMPLETED);
        s1.setTotalDurationSeconds(3600L);
        workSessionRepository.save(s1);

        // Session 2 on Project B: 30 minutes completed (1800 seconds)
        WorkSession s2 = new WorkSession(userId, projB.getId(), null, "Sprint 2", "Notes", now.minusSeconds(3000));
        s2.setEndedAt(now.minusSeconds(1200));
        s2.setStatus(WorkSessionStatus.COMPLETED);
        s2.setTotalDurationSeconds(1800L);
        workSessionRepository.save(s2);

        mockMvc.perform(get("/api/v1/analytics/dashboard/today?timezone=UTC")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalDurationSeconds", is(5400))) // 3600 + 1800 = 5400
                .andExpect(jsonPath("$.data.sessionCount", is(2)))
                .andExpect(jsonPath("$.data.projectCount", is(2)))
                .andExpect(jsonPath("$.data.projects", hasSize(2)))
                .andExpect(jsonPath("$.data.projects[0].projectName", is("Project A")))
                .andExpect(jsonPath("$.data.projects[0].durationSeconds", is(3600)))
                .andExpect(jsonPath("$.data.projects[1].projectName", is("Project B")))
                .andExpect(jsonPath("$.data.projects[1].durationSeconds", is(1800)));
    }

    @Test
    void testSessionCrossingMidnightIsAllocatedCorrectly() throws Exception {
        String token = registerAndGetToken("midnight@devpulse.io", "Midnight User");
        UUID userId = userRepository.findByEmail("midnight@devpulse.io").orElseThrow().getId();

        Project proj = projectRepository.save(new Project(userId, "Midnight Project", "Desc", null, "Java", ProjectStatus.ACTIVE));

        ZoneId utc = ZoneOffset.UTC;
        LocalDate todayUtc = LocalDate.now(utc);
        Instant todayMidnight = todayUtc.atStartOfDay(utc).toInstant();

        // Session started 1 hour before today's midnight (yesterday 23:00) and ended 1 hour after midnight (today 01:00)
        // Total duration = 2 hours (7200s).
        // Yesterday must get 3600s, Today must get 3600s!
        Instant startedAt = todayMidnight.minusSeconds(3600);
        Instant endedAt = todayMidnight.plusSeconds(3600);

        WorkSession session = new WorkSession(userId, proj.getId(), null, "Midnight Crosser", null, startedAt);
        session.setEndedAt(endedAt);
        session.setStatus(WorkSessionStatus.COMPLETED);
        session.setTotalDurationSeconds(7200L);
        workSessionRepository.save(session);

        // Query Today's analytics: should allocate exactly 3600 seconds to today (not 7200)!
        mockMvc.perform(get("/api/v1/analytics/dashboard/today?timezone=UTC")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalDurationSeconds", is(3600)))
                .andExpect(jsonPath("$.data.sessionCount", is(1)))
                .andExpect(jsonPath("$.data.projects[0].durationSeconds", is(3600)));
    }

    @Test
    void testWeeklyAnalyticsAllocatesAcrossSevenDaysAndFindsMostActiveDay() throws Exception {
        String token = registerAndGetToken("weekly@devpulse.io", "Weekly User");
        UUID userId = userRepository.findByEmail("weekly@devpulse.io").orElseThrow().getId();

        Project proj = projectRepository.save(new Project(userId, "Weekly Proj", "Desc", null, "Java", ProjectStatus.ACTIVE));

        ZoneId utc = ZoneOffset.UTC;
        LocalDate todayUtc = LocalDate.now(utc);
        LocalDate monday = todayUtc.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        // Create a 2-hour session on Monday
        Instant monStart = monday.atStartOfDay(utc).plusHours(10).toInstant();
        WorkSession monSession = new WorkSession(userId, proj.getId(), null, "Monday Sprint", null, monStart);
        monSession.setEndedAt(monStart.plusSeconds(7200));
        monSession.setStatus(WorkSessionStatus.COMPLETED);
        monSession.setTotalDurationSeconds(7200L);
        workSessionRepository.save(monSession);

        // Create a 4-hour session on Tuesday
        Instant tueStart = monday.plusDays(1).atStartOfDay(utc).plusHours(10).toInstant();
        WorkSession tueSession = new WorkSession(userId, proj.getId(), null, "Tuesday Sprint", null, tueStart);
        tueSession.setEndedAt(tueStart.plusSeconds(14400));
        tueSession.setStatus(WorkSessionStatus.COMPLETED);
        tueSession.setTotalDurationSeconds(14400L);
        workSessionRepository.save(tueSession);

        mockMvc.perform(get("/api/v1/analytics/dashboard/weekly?timezone=UTC")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalDurationSeconds", is(21600))) // 7200 + 14400 = 21600 (6 hours)
                .andExpect(jsonPath("$.data.activeDays", is(2)))
                .andExpect(jsonPath("$.data.mostActiveDay", is("Tuesday")))
                .andExpect(jsonPath("$.data.dailyActivity", hasSize(7)))
                .andExpect(jsonPath("$.data.dailyActivity[0].day", is("Monday")))
                .andExpect(jsonPath("$.data.dailyActivity[0].durationSeconds", is(7200)))
                .andExpect(jsonPath("$.data.dailyActivity[1].day", is("Tuesday")))
                .andExpect(jsonPath("$.data.dailyActivity[1].durationSeconds", is(14400)))
                .andExpect(jsonPath("$.data.dailyActivity[2].day", is("Wednesday")))
                .andExpect(jsonPath("$.data.dailyActivity[2].durationSeconds", is(0)));
    }

    @Test
    void testUserIsolationForAnalytics() throws Exception {
        String tokenUser1 = registerAndGetToken("user-a@devpulse.io", "User A");
        String tokenUser2 = registerAndGetToken("user-b@devpulse.io", "User B");

        UUID user1Id = userRepository.findByEmail("user-a@devpulse.io").orElseThrow().getId();
        Project projA = projectRepository.save(new Project(user1Id, "User A Proj", "Desc", null, "Java", ProjectStatus.ACTIVE));

        Instant now = Instant.now();
        WorkSession s1 = new WorkSession(user1Id, projA.getId(), null, "User A work", null, now.minusSeconds(3600));
        s1.setEndedAt(now);
        s1.setStatus(WorkSessionStatus.COMPLETED);
        s1.setTotalDurationSeconds(3600L);
        workSessionRepository.save(s1);

        // User 1 sees 3600s
        mockMvc.perform(get("/api/v1/analytics/dashboard/today?timezone=UTC")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalDurationSeconds", is(3600)));

        // User 2 sees 0s (no data leak)
        mockMvc.perform(get("/api/v1/analytics/dashboard/today?timezone=UTC")
                        .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalDurationSeconds", is(0)))
                .andExpect(jsonPath("$.data.sessionCount", is(0)));
    }
}
