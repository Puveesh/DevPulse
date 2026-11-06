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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    @BeforeEach
    void setUp() {
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
    void testStartAndEndWorkSessionLifecycle() throws Exception {
        String token = registerAndGetToken("developer@devpulse.io", "Lead Dev");

        // 1. Create a Project first
        UUID userId = userRepository.findByEmail("developer@devpulse.io").orElseThrow().getId();
        Project project = projectRepository.save(new Project(
                userId, "DevPulse Core", "Desktop conversion", null, "Electron, React, Spring Boot", ProjectStatus.ACTIVE
        ));

        // 2. Start session
        StartWorkSessionRequest startReq = new StartWorkSessionRequest(
                project.getId(),
                null,
                "Refactor and wire session timer",
                "Working on timer integration"
        );

        MvcResult startResult = mockMvc.perform(post("/api/v1/work-sessions/start")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(startReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Refactor and wire session timer")))
                .andExpect(jsonPath("$.data.projectName", is("DevPulse Core")))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andReturn();

        ApiResponse<WorkSessionResponse> startResp = objectMapper.readValue(
                startResult.getResponse().getContentAsString(),
                new TypeReference<>() {}
        );
        UUID sessionId = startResp.data().id();

        // 3. Query Active Session
        mockMvc.perform(get("/api/v1/work-sessions/active")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", is(sessionId.toString())))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));

        // 4. End Session with notes
        EndWorkSessionRequest endReq = new EndWorkSessionRequest(
                "Completed worklog endpoints and tests.",
                Instant.now().plusSeconds(180)
        );

        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/end")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(endReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("COMPLETED")))
                .andExpect(jsonPath("$.data.durationSeconds", notNullValue()));

        // 5. Query active session again - should be null
        mockMvc.perform(get("/api/v1/work-sessions/active")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());

        // 6. Query recent sessions
        mockMvc.perform(get("/api/v1/work-sessions/recent")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].status", is("COMPLETED")));

        // 7. Query today duration
        mockMvc.perform(get("/api/v1/work-sessions/today-duration")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", notNullValue()));
    }

    @Test
    void testCancelWorkSession() throws Exception {
        String token = registerAndGetToken("canceller@devpulse.io", "Timer User");

        StartWorkSessionRequest startReq = new StartWorkSessionRequest(
                null, null, "Accidental session", null
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

        mockMvc.perform(post("/api/v1/work-sessions/" + sessionId + "/cancel")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("CANCELLED")));
    }
}
