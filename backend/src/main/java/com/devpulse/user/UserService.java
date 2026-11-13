package com.devpulse.user;

import com.devpulse.auth.dto.UserResponse;
import com.devpulse.common.BadRequestException;
import com.devpulse.common.ResourceNotFoundException;
import com.devpulse.user.dto.UpdatePreferencesRequest;
import com.devpulse.user.dto.UpdateProfileRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Set;
import java.util.UUID;

@Service
public class UserService {

    private static final long MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    );

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(UUID userId) {
        User user = findUserById(userId);
        return UserResponse.fromUser(user);
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = findUserById(userId);

        if (request.displayName() != null && !request.displayName().trim().isEmpty()) {
            user.setDisplayName(request.displayName().trim());
        }

        user.setBio(request.bio());
        user.setProfessionalTitle(request.professionalTitle());
        user.setExperienceLevel(request.experienceLevel());
        user.setProgrammingLanguages(request.programmingLanguages());
        user.setTechnologies(request.technologies());
        user.setGithubUrl(request.githubUrl());
        user.setPortfolioUrl(request.portfolioUrl());
        user.setCurrentFocus(request.currentFocus());

        User saved = userRepository.save(user);
        return UserResponse.fromUser(saved);
    }

    @Transactional
    public UserResponse updatePreferences(UUID userId, UpdatePreferencesRequest request) {
        User user = findUserById(userId);

        if (request.timezone() != null && !request.timezone().trim().isEmpty()) {
            user.setTimezone(request.timezone().trim());
        }
        if (request.dateFormat() != null && !request.dateFormat().trim().isEmpty()) {
            user.setDateFormat(request.dateFormat().trim());
        }
        if (request.timeFormat() != null && !request.timeFormat().trim().isEmpty()) {
            user.setTimeFormat(request.timeFormat().trim());
        }
        if (request.weekStartDay() != null && !request.weekStartDay().trim().isEmpty()) {
            user.setWeekStartDay(request.weekStartDay().trim());
        }
        if (request.theme() != null && !request.theme().trim().isEmpty()) {
            user.setTheme(request.theme().trim());
        }

        User saved = userRepository.save(user);
        return UserResponse.fromUser(saved);
    }

    @Transactional
    public UserResponse updateAvatarDataUrl(UUID userId, String avatarDataUrl) {
        if (avatarDataUrl == null || avatarDataUrl.trim().isEmpty()) {
            throw new BadRequestException("Avatar image data cannot be empty");
        }

        String trimmed = avatarDataUrl.trim();
        if (!trimmed.startsWith("data:image/")) {
            throw new BadRequestException("Invalid image format. Expected Base64 data URL starting with 'data:image/'");
        }

        // Limit data URL length to ~3.5MB (approx 2MB binary)
        if (trimmed.length() > 3_500_000) {
            throw new BadRequestException("Avatar image file size exceeds the 2MB limit");
        }

        User user = findUserById(userId);
        user.setProfileImage(trimmed);
        User saved = userRepository.save(user);
        return UserResponse.fromUser(saved);
    }

    @Transactional
    public UserResponse updateAvatarMultipart(UUID userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new BadRequestException("Avatar image file size exceeds the 2MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Invalid file type: " + contentType + ". Allowed types: PNG, JPEG, WEBP, GIF");
        }

        try {
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            String dataUrl = "data:" + contentType + ";base64," + base64;

            User user = findUserById(userId);
            user.setProfileImage(dataUrl);
            User saved = userRepository.save(user);
            return UserResponse.fromUser(saved);
        } catch (IOException e) {
            throw new BadRequestException("Failed to process uploaded image file: " + e.getMessage());
        }
    }

    @Transactional
    public UserResponse removeAvatar(UUID userId) {
        User user = findUserById(userId);
        user.setProfileImage(null);
        User saved = userRepository.save(user);
        return UserResponse.fromUser(saved);
    }

    private User findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }
}

