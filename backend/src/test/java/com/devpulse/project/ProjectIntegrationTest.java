package com.devpulse.project;

import com.devpulse.auth.dto.AuthResponse;
import com.devpulse.auth.dto.RegisterRequest;
import com.devpulse.common.ApiResponse;
import com.devpulse.project.dto.CreateProjectRequest;
import com.devpulse.project.dto.UpdateProjectRequest;
import com.devpulse.user.UserRepository;
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

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ProjectIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @BeforeEach
    void setUp() {
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
    void testCreateAndGetProjectSuccess() throws Exception {
        String token = registerAndGetToken("user1@devpulse.io", "User One");

        CreateProjectRequest createRequest = new CreateProjectRequest(
                "DevPulse Core",
                "Full-stack productivity workspace",
                "https://github.com/devpulse/core",
                "React, TypeScript, Spring Boot",
                ProjectStatus.ACTIVE
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("DevPulse Core")))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")))
                .andReturn();

        ApiResponse<com.devpulse.project.dto.ProjectResponse> created = objectMapper.readValue(
                createResult.getResponse().getContentAsString(),
                new TypeReference<>() {}
        );
        UUID projectId = created.data().id();

        // Get single project
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(projectId.toString())))
                .andExpect(jsonPath("$.data.name", is("DevPulse Core")));

        // List projects
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("DevPulse Core")));
    }

    @Test
    void testCrossUserDataIsolation() throws Exception {
        String tokenUser1 = registerAndGetToken("user1@devpulse.io", "User One");
        String tokenUser2 = registerAndGetToken("user2@devpulse.io", "User Two");

        // User 1 creates a project
        CreateProjectRequest createRequest = new CreateProjectRequest(
                "User 1 Confidential Project",
                "Sensitive dev roadmap",
                null,
                "Go, Rust",
                ProjectStatus.ACTIVE
        );

        MvcResult createResult = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + tokenUser1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        ApiResponse<com.devpulse.project.dto.ProjectResponse> created = objectMapper.readValue(
                createResult.getResponse().getContentAsString(),
                new TypeReference<>() {}
        );
        UUID user1ProjectId = created.data().id();

        // User 2 attempts to get User 1's project -> Must return 404 (not found / isolated)
        mockMvc.perform(get("/api/v1/projects/" + user1ProjectId)
                        .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));

        // User 2 attempts to update User 1's project -> Must return 404
        UpdateProjectRequest updateRequest = new UpdateProjectRequest(
                "Hacked Title", null, null, null, ProjectStatus.COMPLETED
        );
        mockMvc.perform(patch("/api/v1/projects/" + user1ProjectId)
                        .header("Authorization", "Bearer " + tokenUser2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));

        // User 2 attempts to delete User 1's project -> Must return 404
        mockMvc.perform(delete("/api/v1/projects/" + user1ProjectId)
                        .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isNotFound());

        // User 2 project list should be empty
        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(0)));
    }

    @Test
    void testProjectValidationErrors() throws Exception {
        String token = registerAndGetToken("tester@devpulse.io", "Tester");

        // Missing project name
        CreateProjectRequest invalid = new CreateProjectRequest("", "Desc", null, null, null);

        mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.validationErrors[0].field", is("name")));
    }
}

