package com.devpulse.worklog;

import com.devpulse.auth.dto.AuthResponse;
import com.devpulse.auth.dto.RegisterRequest;
import com.devpulse.common.ApiResponse;
import com.devpulse.project.Project;
import com.devpulse.project.ProjectRepository;
import com.devpulse.project.ProjectStatus;
import com.devpulse.user.UserRepository;
import com.devpulse.worklog.dto.EndWorkSessionRequest;
import com.devpulse.worklog.dto.StartWorkSessionRequest;
import com.devpulse.worklog.dto.UpdateSessionNotesRequest;
import com.devpulse.worklog.dto.WorkSessionResponse;
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

import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class WorkSessionIntegrationTest {

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
    void testCompleteWorkSessionLifecycleWithPauseAndResume() throws Exception {
        String token = registerAndGetToken("timer-dev@devpulse.io", "Timer Dev");
        UUID userId = userRepository.findByEmail("timer-dev@devpulse.io").orElseThrow().getId();

        Project project = projectRepository.save(new Project(
                userId, "DevPulse Core", "Desktop conversion", null, "Electron, React, Spring Boot", ProjectStatus.ACTIVE
        ));

        // 1. Start Session
        StartWorkSessionRequest startReq = new StartWorkSessionRequest(
                project.getId(),
                null,
                "Implement pause-resume timer engine",
                "Testing phase 1 session lifecycle"
        );

        MvcResult startResult = mockMvc.perform(post("/api/v1/work-sessions/start")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Implement pause-resume timer engine")))
                .andExpect(jsonPath("$.data.projectName", is("DevPulse Core")))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.initialNotes", is("Testing phase 1 session lifecycle")))
                .andReturn();

        ApiResponse<WorkSessionResponse> startResp = objectMapper.readValue(
                startResult.getResponse().getContentAsString(),
                new TypeReference<>() {}
        );
        UUID sessionId = startResp.data().id();

        // 2. Prevent simultaneous multiple active sessions (409 Conflict)
        StartWorkSessionRequest secondReq = new StartWorkSessionRequest(
                project.getId(), null, "Second session attempt", null
        );
        mockMvc.perform(post("/api/v1/work-sessions/start")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondReq)))
                .andExpect(status().isConflict());

        // 3. Pause Session
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/pause")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("PAUSED")))
                .andExpect(jsonPath("$.data.pauseIntervals", hasSize(1)));

        // 4. Query Active Session (should return the PAUSED session)
        mockMvc.perform(get("/api/v1/work-sessions/active")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(sessionId.toString())))
                .andExpect(jsonPath("$.data.status", is("PAUSED")));

        // 5. Resume Session
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/resume")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.pauseIntervals[0].resumedAt", notNullValue()));

        // 6. End Session with wrap-up notes
        EndWorkSessionRequest endReq = new EndWorkSessionRequest(
                "Successfully implemented pause intervals and tested MySQL persistence.",
                Instant.now().plusSeconds(60)
        );

        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/end")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(endReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.sessionNotes", is("Successfully implemented pause intervals and tested MySQL persistence.")))
                .andExpect(jsonPath("$.data.totalDurationSeconds", notNullValue()));

        // 7. Edit session notes
        UpdateSessionNotesRequest editReq = new UpdateSessionNotesRequest(
                "Updated remarks: Tested on MySQL and validated pause time exclusion."
        );
        mockMvc.perform(patch("/api/v1/work-sessions/" + sessionId + "/notes")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(editReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sessionNotes", is("Updated remarks: Tested on MySQL and validated pause time exclusion.")));

        // 8. Query by ID
        mockMvc.perform(get("/api/v1/work-sessions/" + sessionId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(sessionId.toString())))
                .andExpect(jsonPath("$.data.status", is("COMPLETED")));

        // 9. Query sessions list
        mockMvc.perform(get("/api/v1/work-sessions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)));
    }

    @Test
    void testProjectSelectionIsMandatory() throws Exception {
        String token = registerAndGetToken("validation-user@devpulse.io", "Validator");

        // Missing project ID
        StartWorkSessionRequest invalidReq = new StartWorkSessionRequest(
                null, null, "Focus without project", "Should fail"
        );

        mockMvc.perform(post("/api/v1/work-sessions/start")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testDeniesAccessToOtherUsersSession() throws Exception {
        String tokenUser1 = registerAndGetToken("user1@devpulse.io", "User One");
        String tokenUser2 = registerAndGetToken("user2@devpulse.io", "User Two");

        UUID user1Id = userRepository.findByEmail("user1@devpulse.io").orElseThrow().getId();
        Project project = projectRepository.save(new Project(
                user1Id, "User 1 Project", "Description", null, "Stack", ProjectStatus.ACTIVE
        ));

        StartWorkSessionRequest startReq = new StartWorkSessionRequest(
                project.getId(), null, "User 1 private session", null
        );

        MvcResult result = mockMvc.perform(post("/api/v1/work-sessions/start")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isCreated())
                .andReturn();

        ApiResponse<WorkSessionResponse> resp = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                new TypeReference<>() {}
        );
        UUID sessionId = resp.data().id();

        // User 2 attempts to pause User 1's session -> 404 (ownership check)
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/pause")
                        .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isNotFound());
    }

    @Test
    void testIdempotentEndSessionReturnsCompletedStateInsteadOfError() throws Exception {
        String token = registerAndGetToken("idempotent@devpulse.io", "Idempotent Tester");
        UUID userId = userRepository.findByEmail("idempotent@devpulse.io").orElseThrow().getId();

        Project project = projectRepository.save(new Project(
                userId, "Idempotent Project", "Test idempotent calls", null, "Java", ProjectStatus.ACTIVE
        ));

        StartWorkSessionRequest startReq = new StartWorkSessionRequest(
                project.getId(), null, "Test Idempotent End", null
        );

        MvcResult startResult = mockMvc.perform(post("/api/v1/work-sessions/start")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isCreated())
                .andReturn();

        ApiResponse<WorkSessionResponse> startResp = objectMapper.readValue(
                startResult.getResponse().getContentAsString(),
                new TypeReference<>() {}
        );
        UUID sessionId = startResp.data().id();

        EndWorkSessionRequest endReq = new EndWorkSessionRequest(
                "Wrap up notes 1", Instant.now().plusSeconds(30)
        );

        // 1. First End call -> 200 OK
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/end")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(endReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.sessionNotes", is("Wrap up notes 1")));

        // 2. Second End call (retry or double-click) -> must also return 200 OK (idempotent, NOT 400 error!)
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/end")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(endReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.sessionNotes", is("Wrap up notes 1")));

        // 3. Pause completed session -> 400 Bad Request
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/pause")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        // 4. Resume completed session -> 400 Bad Request
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/resume")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testIdempotentPauseAndResume() throws Exception {
        String token = registerAndGetToken("toggle@devpulse.io", "Toggle Tester");
        UUID userId = userRepository.findByEmail("toggle@devpulse.io").orElseThrow().getId();

        Project project = projectRepository.save(new Project(
                userId, "Toggle Project", "Testing pause resume", null, "Java", ProjectStatus.ACTIVE
        ));

        StartWorkSessionRequest startReq = new StartWorkSessionRequest(
                project.getId(), null, "Test Toggle Session", null
        );

        MvcResult startResult = mockMvc.perform(post("/api/v1/work-sessions/start")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isCreated())
                .andReturn();

        ApiResponse<WorkSessionResponse> startResp = objectMapper.readValue(
                startResult.getResponse().getContentAsString(),
                new TypeReference<>() {}
        );
        UUID sessionId = startResp.data().id();

        // 1. Pause
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/pause")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PAUSED")));

        // 2. Pause again (double-click) -> 200 OK with PAUSED
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/pause")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("PAUSED")));

        // 3. Resume
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/resume")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));

        // 4. Resume again (double-click) -> 200 OK with ACTIVE
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/resume")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));
    }

    @Test
    void testProjectSpecificWorkSessionFilteringAndSecurityIsolation() throws Exception {
        String tokenUser1 = registerAndGetToken("user1-filter@devpulse.io", "User 1");
        String tokenUser2 = registerAndGetToken("user2-filter@devpulse.io", "User 2");
        UUID user1Id = userRepository.findByEmail("user1-filter@devpulse.io").orElseThrow().getId();

        Project projA = projectRepository.save(new Project(user1Id, "Project Alpha", null, null, "Java", ProjectStatus.ACTIVE));
        Project projB = projectRepository.save(new Project(user1Id, "Project Beta", null, null, "Go", ProjectStatus.ACTIVE));

        // Create 2 sessions on Project A and 1 session on Project B
        StartWorkSessionRequest reqA1 = new StartWorkSessionRequest(projA.getId(), null, "Alpha Task 1", null);
        MvcResult resA1 = mockMvc.perform(post("/api/v1/work-sessions/start")
                .header("Authorization", "Bearer " + tokenUser1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqA1))).andExpect(status().isCreated()).andReturn();
        UUID sessA1Id = objectMapper.readValue(resA1.getResponse().getContentAsString(), new TypeReference<ApiResponse<WorkSessionResponse>>() {}).data().id();
        mockMvc.perform(post("/api/v1/work-sessions/" + sessA1Id + "/end").header("Authorization", "Bearer " + tokenUser1)).andExpect(status().isOk());

        StartWorkSessionRequest reqB1 = new StartWorkSessionRequest(projB.getId(), null, "Beta Task 1", null);
        MvcResult resB1 = mockMvc.perform(post("/api/v1/work-sessions/start")
                .header("Authorization", "Bearer " + tokenUser1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqB1))).andExpect(status().isCreated()).andReturn();
        UUID sessB1Id = objectMapper.readValue(resB1.getResponse().getContentAsString(), new TypeReference<ApiResponse<WorkSessionResponse>>() {}).data().id();
        mockMvc.perform(post("/api/v1/work-sessions/" + sessB1Id + "/end").header("Authorization", "Bearer " + tokenUser1)).andExpect(status().isOk());

        StartWorkSessionRequest reqA2 = new StartWorkSessionRequest(projA.getId(), null, "Alpha Task 2", null);
        MvcResult resA2 = mockMvc.perform(post("/api/v1/work-sessions/start")
                .header("Authorization", "Bearer " + tokenUser1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(reqA2))).andExpect(status().isCreated()).andReturn();
        UUID sessA2Id = objectMapper.readValue(resA2.getResponse().getContentAsString(), new TypeReference<ApiResponse<WorkSessionResponse>>() {}).data().id();
        mockMvc.perform(post("/api/v1/work-sessions/" + sessA2Id + "/end").header("Authorization", "Bearer " + tokenUser1)).andExpect(status().isOk());

        // 1. Filter by Project A -> exactly 2 sessions
        mockMvc.perform(get("/api/v1/work-sessions?projectId=" + projA.getId())
                .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.content[0].projectName", is("Project Alpha")))
                .andExpect(jsonPath("$.data.content[1].projectName", is("Project Alpha")));

        // 2. Filter by Project B -> exactly 1 session
        mockMvc.perform(get("/api/v1/work-sessions?projectId=" + projB.getId())
                .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].projectName", is("Project Beta")));

        // 3. Standalone query without projectId -> returns all 3 sessions
        mockMvc.perform(get("/api/v1/work-sessions")
                .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(3)));

        // 4. Security isolation: User 2 tries to filter sessions by User 1's Project A -> 404 Not Found
        mockMvc.perform(get("/api/v1/work-sessions?projectId=" + projA.getId())
                .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    void testProjectLastActivityLifecycle() throws Exception {
        String token = registerAndGetToken("activity-check@devpulse.io", "Activity User");
        UUID userId = userRepository.findByEmail("activity-check@devpulse.io").orElseThrow().getId();

        Project projDev = projectRepository.save(new Project(userId, "DevPulse", null, null, "Java", ProjectStatus.ACTIVE));
        Project projOther = projectRepository.save(new Project(userId, "Weather Monitor", null, null, "Python", ProjectStatus.ACTIVE));

        // 1. Initially with zero sessions: lastActivity is null
        mockMvc.perform(get("/api/v1/projects/" + projDev.getId())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("DevPulse")))
                .andExpect(jsonPath("$.data.lastActivity").doesNotExist());

        // 2. Start session on DevPulse -> lastActivity reflects startedAt
        StartWorkSessionRequest startReq = new StartWorkSessionRequest(projDev.getId(), null, "Session 1", null);
        MvcResult startRes = mockMvc.perform(post("/api/v1/work-sessions/start")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isCreated())
                .andReturn();
        ApiResponse<WorkSessionResponse> startData = objectMapper.readValue(startRes.getResponse().getContentAsString(), new TypeReference<>() {});
        UUID sessionId = startData.data().id();

        mockMvc.perform(get("/api/v1/projects/" + projDev.getId())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lastActivity", notNullValue()));

        // 3. End session with specific endedAt -> lastActivity updates to endedAt
        Instant endInstant = Instant.now().plusSeconds(60);
        EndWorkSessionRequest endReq = new EndWorkSessionRequest("Completed session 1", endInstant);
        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/end")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(endReq)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/projects/" + projDev.getId())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lastActivity", notNullValue()));

        // 4. Weather Monitor still has zero sessions -> lastActivity remains null!
        mockMvc.perform(get("/api/v1/projects/" + projOther.getId())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name", is("Weather Monitor")))
                .andExpect(jsonPath("$.data.lastActivity").doesNotExist());
    }
}
