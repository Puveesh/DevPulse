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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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

    private UUID createProject(String token, String name, String description, ProjectStatus status) throws Exception {
        CreateProjectRequest createRequest = new CreateProjectRequest(
                name,
                description,
                null,
                "Java",
                status != null ? status : ProjectStatus.ACTIVE
        );

        MvcResult result = mockMvc.perform(post("/api/v1/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        ApiResponse<com.devpulse.project.dto.ProjectResponse> created = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                new TypeReference<>() {}
        );
        return created.data().id();
    }

    @Test
    void testListProjectsNoSearchTerm() throws Exception {
        String token = registerAndGetToken("nosearch@devpulse.io", "No Search User");

        createProject(token, "Project Alpha", "Description Alpha", ProjectStatus.ACTIVE);
        createProject(token, "Project Beta", "Description Beta", ProjectStatus.COMPLETED);
        createProject(token, "Project Gamma", "Description Gamma", ProjectStatus.ARCHIVED);

        mockMvc.perform(get("/api/v1/projects")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(3)))
                .andExpect(jsonPath("$.data.page.totalElements", is(3)));
    }

    @Test
    void testListProjectsSearchByName() throws Exception {
        String token = registerAndGetToken("searchname@devpulse.io", "Search Name User");

        createProject(token, "Quantum Compiler", "High performance compiler", ProjectStatus.ACTIVE);
        createProject(token, "Neural Sandbox", "Machine learning experiments", ProjectStatus.ACTIVE);
        createProject(token, "DevPulse Web", "Developer worklog app", ProjectStatus.ACTIVE);

        // Lowercase query matching "Quantum"
        mockMvc.perform(get("/api/v1/projects?search=quantum")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Quantum Compiler")));

        // Uppercase query matching "Neural" (case-insensitivity test)
        mockMvc.perform(get("/api/v1/projects?search=NEURAL")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Neural Sandbox")));

        // Non-existent search term
        mockMvc.perform(get("/api/v1/projects?search=nonexistentterm")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(0)));
    }

    @Test
    void testListProjectsSearchByDescription() throws Exception {
        String token = registerAndGetToken("searchdesc@devpulse.io", "Search Desc User");

        createProject(token, "Engine Alpha", "Distributed streaming engine with Kafka", ProjectStatus.ACTIVE);
        createProject(token, "Service Beta", "GraphQL gateway and schema stitcher", ProjectStatus.ACTIVE);

        // Substring match on description
        mockMvc.perform(get("/api/v1/projects?search=streaming engine")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Engine Alpha")));

        mockMvc.perform(get("/api/v1/projects?search=GRAPHQL")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Service Beta")));
    }

    @Test
    void testListProjectsStatusFilter() throws Exception {
        String token = registerAndGetToken("filterstatus@devpulse.io", "Filter Status User");

        createProject(token, "Project One", "Desc 1", ProjectStatus.ACTIVE);
        createProject(token, "Project Two", "Desc 2", ProjectStatus.ACTIVE);
        createProject(token, "Project Three", "Desc 3", ProjectStatus.ARCHIVED);

        // Filter by ACTIVE
        mockMvc.perform(get("/api/v1/projects?status=ACTIVE")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.content[0].status", is("ACTIVE")))
                .andExpect(jsonPath("$.data.content[1].status", is("ACTIVE")));

        // Filter by ARCHIVED
        mockMvc.perform(get("/api/v1/projects?status=ARCHIVED")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Project Three")))
                .andExpect(jsonPath("$.data.content[0].status", is("ARCHIVED")));

        // Filter by COMPLETED (none exist)
        mockMvc.perform(get("/api/v1/projects?status=COMPLETED")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(0)));

        // Combined status filter and search term
        mockMvc.perform(get("/api/v1/projects?status=ACTIVE&search=One")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Project One")));
    }

    @Test
    void testListProjectsPagination() throws Exception {
        String token = registerAndGetToken("pagination@devpulse.io", "Pagination User");

        for (int i = 1; i <= 5; i++) {
            createProject(token, "Pagination Project " + i, "Description " + i, ProjectStatus.ACTIVE);
        }

        // Page 0, size 2
        mockMvc.perform(get("/api/v1/projects?page=0&size=2")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.page.totalElements", is(5)))
                .andExpect(jsonPath("$.data.page.totalPages", is(3)))
                .andExpect(jsonPath("$.data.page.number", is(0)));

        // Page 1, size 2
        mockMvc.perform(get("/api/v1/projects?page=1&size=2")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)))
                .andExpect(jsonPath("$.data.page.number", is(1)));

        // Page 2, size 2 (last page, 1 item)
        mockMvc.perform(get("/api/v1/projects?page=2&size=2")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.page.number", is(2)));
    }

    @Test
    void testListProjectsNullAndEmptySearchParameters() throws Exception {
        String token = registerAndGetToken("emptysearch@devpulse.io", "Empty Search User");
        UUID userId = userRepository.findByEmail("emptysearch@devpulse.io").orElseThrow().getId();

        createProject(token, "Empty Search Project", "Testing null search", ProjectStatus.ACTIVE);

        // Empty query parameter ?search=
        mockMvc.perform(get("/api/v1/projects?search=")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Empty Search Project")));

        // Whitespace-only query parameter ?search=   
        mockMvc.perform(get("/api/v1/projects?search=   ")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Empty Search Project")));

        // Direct repository invocation with null status and null search
        Page<Project> resultNullBoth = projectRepository.findByUserIdWithFilters(
                userId, null, null, PageRequest.of(0, 10)
        );
        assertNotNull(resultNullBoth);
        assertEquals(1, resultNullBoth.getTotalElements());

        // Direct repository invocation with null search and active status
        Page<Project> resultNullSearch = projectRepository.findByUserIdWithFilters(
                userId, ProjectStatus.ACTIVE, null, PageRequest.of(0, 10)
        );
        assertNotNull(resultNullSearch);
        assertEquals(1, resultNullSearch.getTotalElements());

        // Direct repository invocation with empty string search
        Page<Project> resultEmptySearch = projectRepository.findByUserIdWithFilters(
                userId, null, "", PageRequest.of(0, 10)
        );
        assertNotNull(resultEmptySearch);
        assertEquals(1, resultEmptySearch.getTotalElements());

        // Direct repository invocation with matching search
        Page<Project> resultMatch = projectRepository.findByUserIdWithFilters(
                userId, ProjectStatus.ACTIVE, "%Empty Search%", PageRequest.of(0, 10)
        );
        assertNotNull(resultMatch);
        assertEquals(1, resultMatch.getTotalElements());
    }
}

