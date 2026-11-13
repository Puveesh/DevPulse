package com.devpulse.worklog;

import com.devpulse.auth.dto.AuthResponse;
import com.devpulse.auth.dto.RegisterRequest;
import com.devpulse.common.ApiResponse;
import com.devpulse.project.Project;
import com.devpulse.project.ProjectRepository;
import com.devpulse.project.ProjectStatus;
import com.devpulse.user.UserRepository;
import com.devpulse.worklog.dto.DailyNoteResponse;
import com.devpulse.worklog.dto.DailyNoteSummaryResponse;
import com.devpulse.worklog.dto.SaveDailyNoteRequest;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DailyNoteIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private DailyNoteRepository dailyNoteRepository;

    @BeforeEach
    void setUp() {
        dailyNoteRepository.deleteAll();
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
    void testCreateGetAndUpdateDailyNote() throws Exception {
        String token = registerAndGetToken("notes-dev@devpulse.io", "Notes Dev");
        UUID userId = userRepository.findByEmail("notes-dev@devpulse.io").orElseThrow().getId();

        Project project = projectRepository.save(new Project(
                userId, "DevPulse Core", "Desktop conversion", null, "React, Spring Boot", ProjectStatus.ACTIVE
        ));

        LocalDate testDate = LocalDate.of(2026, 11, 13);
        String initialContent = "<h1>Sprint Planning</h1><p>Worked on @Database Integration today.</p>";

        // 1. Save new note
        SaveDailyNoteRequest saveRequest = new SaveDailyNoteRequest(testDate, initialContent);
        MvcResult saveResult = mockMvc.perform(put("/api/v1/projects/" + project.getId() + "/daily-notes/" + testDate)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", is(initialContent)))
                .andExpect(jsonPath("$.data.noteDate", is("2026-11-13")))
                .andReturn();

        ApiResponse<DailyNoteResponse> createdResp = objectMapper.readValue(
                saveResult.getResponse().getContentAsString(),
                new TypeReference<>() {}
        );
        UUID noteId = createdResp.data().id();

        // 2. Fetch note by date
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/daily-notes/" + testDate)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(noteId.toString())))
                .andExpect(jsonPath("$.data.content", is(initialContent)));

        // 3. Update note for the same date -> must update in-place, NOT create duplicate
        String updatedContent = "<h1>Sprint Planning</h1><p>Updated plan with @Work Session 1 references.</p>";
        SaveDailyNoteRequest updateRequest = new SaveDailyNoteRequest(testDate, updatedContent);

        mockMvc.perform(put("/api/v1/projects/" + project.getId() + "/daily-notes/" + testDate)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id", is(noteId.toString())))
                .andExpect(jsonPath("$.data.content", is(updatedContent)));

        // Verify total row count is still 1
        assertEquals(1, dailyNoteRepository.count());
    }

    @Test
    void testProjectIsolationAndHistory() throws Exception {
        String tokenUser1 = registerAndGetToken("user1@devpulse.io", "User 1");
        String tokenUser2 = registerAndGetToken("user2@devpulse.io", "User 2");
        UUID user1Id = userRepository.findByEmail("user1@devpulse.io").orElseThrow().getId();

        Project projA = projectRepository.save(new Project(user1Id, "Project A", null, null, null, ProjectStatus.ACTIVE));
        Project projB = projectRepository.save(new Project(user1Id, "Project B", null, null, null, ProjectStatus.ACTIVE));

        // Save 2 notes on Project A
        SaveDailyNoteRequest noteA1 = new SaveDailyNoteRequest(LocalDate.of(2026, 11, 12), "Project A day 1");
        mockMvc.perform(put("/api/v1/projects/" + projA.getId() + "/daily-notes/2026-11-12")
                .header("Authorization", "Bearer " + tokenUser1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(noteA1))).andExpect(status().isOk());

        SaveDailyNoteRequest noteA2 = new SaveDailyNoteRequest(LocalDate.of(2026, 11, 13), "Project A day 2");
        mockMvc.perform(put("/api/v1/projects/" + projA.getId() + "/daily-notes/2026-11-13")
                .header("Authorization", "Bearer " + tokenUser1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(noteA2))).andExpect(status().isOk());

        // Save 1 note on Project B
        SaveDailyNoteRequest noteB1 = new SaveDailyNoteRequest(LocalDate.of(2026, 11, 13), "Project B day 1");
        mockMvc.perform(put("/api/v1/projects/" + projB.getId() + "/daily-notes/2026-11-13")
                .header("Authorization", "Bearer " + tokenUser1)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(noteB1))).andExpect(status().isOk());

        // 1. Project A history -> exactly 2 notes
        mockMvc.perform(get("/api/v1/projects/" + projA.getId() + "/daily-notes")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].noteDate", is("2026-11-13")))
                .andExpect(jsonPath("$.data[1].noteDate", is("2026-11-12")));

        // 2. Project B history -> exactly 1 note
        mockMvc.perform(get("/api/v1/projects/" + projB.getId() + "/daily-notes")
                        .header("Authorization", "Bearer " + tokenUser1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].noteDate", is("2026-11-13")));

        // 3. User 2 unauthorized access -> 404 (isolation enforced)
        mockMvc.perform(get("/api/v1/projects/" + projA.getId() + "/daily-notes")
                        .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));

        mockMvc.perform(get("/api/v1/projects/" + projA.getId() + "/daily-notes/2026-11-13")
                        .header("Authorization", "Bearer " + tokenUser2))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }
}

