package com.devpulse.user;

import com.devpulse.auth.dto.UserResponse;
import com.devpulse.common.ApiResponse;
import com.devpulse.security.UserPrincipal;
import com.devpulse.user.dto.AvatarUploadRequest;
import com.devpulse.user.dto.UpdatePreferencesRequest;
import com.devpulse.user.dto.UpdateProfileRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Developer Profile", description = "Endpoints for managing developer profile, preferences, and avatar")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    @Operation(summary = "Get developer profile", description = "Returns full profile details for the authenticated developer")
    public ResponseEntity<ApiResponse<UserResponse>> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        UserResponse response = userService.getProfile(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Developer profile retrieved successfully", response));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update developer profile", description = "Updates editable personal and developer profile fields")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse response = userService.updateProfile(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Developer profile updated successfully", response));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Update workspace preferences", description = "Updates developer workspace preferences")
    public ResponseEntity<ApiResponse<UserResponse>> updatePreferences(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdatePreferencesRequest request) {
        UserResponse response = userService.updatePreferences(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Workspace preferences updated successfully", response));
    }

    @PostMapping(value = "/profile/avatar", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(summary = "Upload avatar as Base64 data URL", description = "Uploads and sets developer avatar picture via Base64 data URL")
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatarDataUrl(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AvatarUploadRequest request) {
        UserResponse response = userService.updateAvatarDataUrl(principal.getId(), request.avatarDataUrl());
        return ResponseEntity.ok(ApiResponse.success("Profile avatar updated successfully", response));
    }

    @PostMapping(value = "/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload avatar file", description = "Uploads and sets developer avatar picture via multipart file")
    public ResponseEntity<ApiResponse<UserResponse>> uploadAvatarMultipart(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("file") MultipartFile file) {
        UserResponse response = userService.updateAvatarMultipart(principal.getId(), file);
        return ResponseEntity.ok(ApiResponse.success("Profile avatar uploaded successfully", response));
    }

    @DeleteMapping("/profile/avatar")
    @Operation(summary = "Remove avatar", description = "Removes developer avatar picture and reverts to initials avatar")
    public ResponseEntity<ApiResponse<UserResponse>> removeAvatar(@AuthenticationPrincipal UserPrincipal principal) {
        UserResponse response = userService.removeAvatar(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Profile avatar removed successfully", response));
    }
}
