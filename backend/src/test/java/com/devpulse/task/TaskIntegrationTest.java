package com.devpulse.task;

import com.devpulse.auth.dto.AuthResponse;
import com.devpulse.auth.dto.RegisterRequest;
import com.devpulse.common.ApiResponse;
import com.devpulse.project.Project;
import com.devpulse.project.ProjectRepository;
import com.devpulse.project.ProjectStatus;
import com.devpulse.task.dto.CreateTaskRequest;
import com.devpulse.task.dto.UpdateTaskStatusRequest;
import com.devpulse.user.User;
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

import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
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
    void testCreateTask_SuccessAndRetrieval() throws Exception {
        String token = registerAndGetToken("alice@devpulse.com", "Alice Tester");
        User user = userRepository.findByEmail("alice@devpulse.com").orElseThrow();

        Project project = projectRepository.save(new Project(
                user.getId(), "DevPulse Desktop", "Core client app", "https://github.com", "React", ProjectStatus.ACTIVE
        ));

        CreateTaskRequest createReq = new CreateTaskRequest(
                "Implement task board UI",
                "Add task creation and tracking",
                TaskStatus.TODO,
                TaskPriority.HIGH,
                Instant.parse("2026-11-20T18:00:00Z")
        );

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.title", is("Implement task board UI")))
                .andExpect(jsonPath("$.data.status", is("TODO")))
                .andExpect(jsonPath("$.data.priority", is("HIGH")));

        // Retrieve tasks for project
        mockMvc.perform(get("/api/v1/projects/" + project.getId() + "/tasks")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].title", is("Implement task board UI")));
    }

    @Test
    void testCreateTask_BlankTitle_ReturnsBadRequest() throws Exception {
        String token = registerAndGetToken("bob@devpulse.com", "Bob Tester");
        User user = userRepository.findByEmail("bob@devpulse.com").orElseThrow();

        Project project = projectRepository.save(new Project(
                user.getId(), "Project B", null, null, null, ProjectStatus.ACTIVE
        ));

        CreateTaskRequest blankReq = new CreateTaskRequest(
                "   ",
                "Empty title",
                TaskStatus.TODO,
                TaskPriority.LOW,
                null
        );

        mockMvc.perform(post("/api/v1/projects/" + project.getId() + "/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void testCreateTask_OtherUserProject_ReturnsNotFound() throws Exception {
        String tokenAlice = registerAndGetToken("alice2@devpulse.com", "Alice Two");
        String tokenEve = registerAndGetToken("eve@devpulse.com", "Eve Hacker");
        User userAlice = userRepository.findByEmail("alice2@devpulse.com").orElseThrow();

        Project projectAlice = projectRepository.save(new Project(
                userAlice.getId(), "Alice Project", null, null, null, ProjectStatus.ACTIVE
        ));

        CreateTaskRequest req = new CreateTaskRequest("Unauthorized Task", null, null, null, null);

        // Eve tries to create a task in Alice's project
        mockMvc.perform(post("/api/v1/projects/" + projectAlice.getId() + "/tasks")
                        .header("Authorization", "Bearer " + tokenEve)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    void testUpdateTaskStatus() throws Exception {
        String token = registerAndGetToken("carol@devpulse.com", "Carol Tester");
        User user = userRepository.findByEmail("carol@devpulse.com").orElseThrow();

        Project project = projectRepository.save(new Project(
                user.getId(), "Carol Project", null, null, null, ProjectStatus.ACTIVE
        ));

        Task task = taskRepository.save(new Task(
                user.getId(), project.getId(), "Testing Task", null, TaskStatus.TODO, TaskPriority.MEDIUM, null
        ));

        UpdateTaskStatusRequest updateReq = new UpdateTaskStatusRequest(TaskStatus.IN_PROGRESS);

        mockMvc.perform(patch("/api/v1/projects/" + project.getId() + "/tasks/" + task.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("IN_PROGRESS")));

        // Change to COMPLETED
        UpdateTaskStatusRequest completedReq = new UpdateTaskStatusRequest(TaskStatus.COMPLETED);
        mockMvc.perform(patch("/api/v1/projects/" + project.getId() + "/tasks/" + task.getId() + "/status")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(completedReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("COMPLETED")));
    }

    @Test
    void testProjectTaskSummary_ExcludesCompletedAndCountsPending() throws Exception {
        String token = registerAndGetToken("dave@devpulse.com", "Dave Summary");
        User user = userRepository.findByEmail("dave@devpulse.com").orElseThrow();

        Project project1 = projectRepository.save(new Project(
                user.getId(), "EduTrust", "School system", null, null, ProjectStatus.ACTIVE
        ));
        Project project2 = projectRepository.save(new Project(
                user.getId(), "Weather App", "Forecast API", null, null, ProjectStatus.ACTIVE
        ));

        // In EduTrust: 2 TODO, 1 IN_PROGRESS, 1 COMPLETED -> total 3 pending
        taskRepository.save(new Task(user.getId(), project1.getId(), "Task 1", null, TaskStatus.TODO, TaskPriority.HIGH, null));
        taskRepository.save(new Task(user.getId(), project1.getId(), "Task 2", null, TaskStatus.TODO, TaskPriority.LOW, null));
        taskRepository.save(new Task(user.getId(), project1.getId(), "Task 3", null, TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, null));
        taskRepository.save(new Task(user.getId(), project1.getId(), "Task 4", null, TaskStatus.COMPLETED, TaskPriority.MEDIUM, null));

        // In Weather App: 0 tasks -> 0 pending

        mockMvc.perform(get("/api/v1/dashboard/project-task-summary")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.projects", hasSize(2)))
                .andExpect(jsonPath("$.data.projects[?(@.projectName == 'EduTrust')].pendingTaskCount").value(3))
                .andExpect(jsonPath("$.data.projects[?(@.projectName == 'Weather App')].pendingTaskCount").value(0));
    }
}

