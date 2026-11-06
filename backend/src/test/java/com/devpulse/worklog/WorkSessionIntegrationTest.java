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
}
