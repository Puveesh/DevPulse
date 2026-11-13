package com.devpulse.worklog;

import com.devpulse.common.ResourceNotFoundException;
import com.devpulse.project.ProjectRepository;
import com.devpulse.worklog.dto.DailyNoteResponse;
import com.devpulse.worklog.dto.DailyNoteSummaryResponse;
import com.devpulse.worklog.dto.SaveDailyNoteRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DailyNoteService {

    private final DailyNoteRepository dailyNoteRepository;
    private final ProjectRepository projectRepository;

    public DailyNoteService(DailyNoteRepository dailyNoteRepository, ProjectRepository projectRepository) {
        this.dailyNoteRepository = dailyNoteRepository;
        this.projectRepository = projectRepository;
    }

    private void validateProjectAccess(UUID projectId, UUID userId) {
        projectRepository.findByIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
    }

    @Transactional(readOnly = true)
    public Optional<DailyNoteResponse> getNoteByProjectAndDate(UUID userId, UUID projectId, LocalDate noteDate) {
        validateProjectAccess(projectId, userId);
        return dailyNoteRepository.findByProjectIdAndUserIdAndNoteDate(projectId, userId, noteDate)
                .map(DailyNoteResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<DailyNoteSummaryResponse> getNotesHistoryForProject(UUID userId, UUID projectId) {
        validateProjectAccess(projectId, userId);
        return dailyNoteRepository.findByProjectIdAndUserIdOrderByNoteDateDesc(projectId, userId)
                .stream()
                .map(DailyNoteSummaryResponse::fromEntity)
                .toList();
    }

    @Transactional
    public DailyNoteResponse saveNote(UUID userId, UUID projectId, LocalDate noteDate, SaveDailyNoteRequest request) {
        validateProjectAccess(projectId, userId);

        LocalDate targetDate = request.noteDate() != null ? request.noteDate() : noteDate;
        String content = request.content() != null ? request.content() : "";

        DailyNote note = dailyNoteRepository.findByProjectIdAndUserIdAndNoteDate(projectId, userId, targetDate)
                .map(existing -> {
                    existing.setContent(content);
                    return existing;
                })
                .orElseGet(() -> new DailyNote(userId, projectId, targetDate, content));

        DailyNote saved = dailyNoteRepository.save(note);
        return DailyNoteResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteNote(UUID userId, UUID projectId, LocalDate noteDate) {
        validateProjectAccess(projectId, userId);
        dailyNoteRepository.findByProjectIdAndUserIdAndNoteDate(projectId, userId, noteDate)
                .ifPresent(dailyNoteRepository::delete);
    }
}

