package com.devpulse.user;

import com.devpulse.auth.dto.AuthResponse;
import com.devpulse.auth.dto.RegisterRequest;
import com.devpulse.common.ApiResponse;
import com.devpulse.user.dto.AvatarUploadRequest;
import com.devpulse.user.dto.UpdatePreferencesRequest;
import com.devpulse.user.dto.UpdateProfileRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    private String registerAndGetToken(String email, String name) throws Exception {
        RegisterRequest request = new RegisterRequest(email, "StrongPass123!", name);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        ApiResponse<AuthResponse> apiResponse = objectMapper.readValue(
                responseBody,
                new TypeReference<>() {}
        );
        return apiResponse.data().accessToken();
    }

    @Test
    void testGetProfileSuccess() throws Exception {
        String token = registerAndGetToken("dev@devpulse.io", "Dev User");

        mockMvc.perform(get("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("dev@devpulse.io")))
                .andExpect(jsonPath("$.data.displayName", is("Dev User")))
                .andExpect(jsonPath("$.data.accountStatus", is("ACTIVE")))
                .andExpect(jsonPath("$.data.theme", is("dark")));
    }

    @Test
    void testUpdateProfileSuccess() throws Exception {
        String token = registerAndGetToken("octo@devpulse.io", "Octo Cat");

        UpdateProfileRequest updateReq = new UpdateProfileRequest(
                "Octo Senior",
                "Full-stack engineer passionate about desktop apps and distributed systems.",
                "Senior Software Architect",
                "Professional",
                "Java, TypeScript, Go",
                "React, Spring Boot, Docker, Electron",
                "https://github.com/octocat",
                "https://octo.dev",
                "Building high-performance telemetry desktop applications."
        );

        mockMvc.perform(put("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.displayName", is("Octo Senior")))
                .andExpect(jsonPath("$.data.bio", is("Full-stack engineer passionate about desktop apps and distributed systems.")))
                .andExpect(jsonPath("$.data.professionalTitle", is("Senior Software Architect")))
                .andExpect(jsonPath("$.data.experienceLevel", is("Professional")))
                .andExpect(jsonPath("$.data.programmingLanguages", is("Java, TypeScript, Go")))
                .andExpect(jsonPath("$.data.technologies", is("React, Spring Boot, Docker, Electron")))
                .andExpect(jsonPath("$.data.githubUrl", is("https://github.com/octocat")))
                .andExpect(jsonPath("$.data.portfolioUrl", is("https://octo.dev")))
                .andExpect(jsonPath("$.data.currentFocus", is("Building high-performance telemetry desktop applications.")));
    }

    @Test
    void testUpdatePreferencesSuccess() throws Exception {
        String token = registerAndGetToken("pref@devpulse.io", "Pref User");

        UpdatePreferencesRequest prefReq = new UpdatePreferencesRequest(
                "Asia/Kolkata",
                "DD/MM/YYYY",
                "12-hour",
                "Sunday",
                "dark"
        );

        mockMvc.perform(put("/api/v1/users/preferences")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(prefReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.timezone", is("Asia/Kolkata")))
                .andExpect(jsonPath("$.data.dateFormat", is("DD/MM/YYYY")))
                .andExpect(jsonPath("$.data.timeFormat", is("12-hour")))
                .andExpect(jsonPath("$.data.weekStartDay", is("Sunday")));
    }

    @Test
    void testUploadAvatarDataUrlAndRemove() throws Exception {
        String token = registerAndGetToken("avatar@devpulse.io", "Avatar User");

        String fakeDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
        AvatarUploadRequest uploadReq = new AvatarUploadRequest(fakeDataUrl);

        mockMvc.perform(post("/api/v1/users/profile/avatar")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(uploadReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.profileImage", is(fakeDataUrl)));

        // Remove avatar
        mockMvc.perform(delete("/api/v1/users/profile/avatar")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.profileImage", nullValue()));
    }

    @Test
    void testUploadAvatarMultipartSuccess() throws Exception {
        String token = registerAndGetToken("multipart@devpulse.io", "Multipart User");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                new byte[]{1, 2, 3, 4, 5}
        );

        mockMvc.perform(multipart("/api/v1/users/profile/avatar")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.profileImage", org.hamcrest.Matchers.startsWith("data:image/png;base64,")));
    }

    @Test
    void testUpdateProfileValidationFailureOnInvalidUrl() throws Exception {
        String token = registerAndGetToken("invalid@devpulse.io", "Invalid User");

        UpdateProfileRequest invalidReq = new UpdateProfileRequest(
                "Valid Name",
                "Valid bio",
                "Title",
                "Beginner",
                "Java",
                "React",
                "not-a-valid-url",
                "neither-is-this",
                "Focus"
        );

        mockMvc.perform(put("/api/v1/users/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }
}
