package com.devpulse.auth.oauth;

import com.devpulse.auth.oauth.dto.ChangePasswordRequest;
import com.devpulse.auth.oauth.dto.GoogleAuthStartRequest;
import com.devpulse.auth.oauth.dto.GoogleAuthStartResponse;
import com.devpulse.auth.oauth.dto.GoogleLinkStatusResponse;
import com.devpulse.auth.oauth.dto.SetPasswordRequest;
import com.devpulse.common.ApiResponse;
import com.devpulse.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account")
@Tag(name = "Account Management", description = "Endpoints for connected accounts, linking Google identities, and password management")
public class AccountController {

    private final GoogleOAuthService googleOAuthService;

    public AccountController(GoogleOAuthService googleOAuthService) {
        this.googleOAuthService = googleOAuthService;
    }

    @GetMapping("/google/link/status")
    @Operation(summary = "Get Google account link status", description = "Checks whether current user has a connected Google identity")
    public ResponseEntity<ApiResponse<GoogleLinkStatusResponse>> getGoogleLinkStatus(
            @AuthenticationPrincipal UserPrincipal principal) {
        GoogleLinkStatusResponse status = googleOAuthService.getLinkStatus(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Google account link status retrieved", status));
    }

    @PostMapping("/google/link/start")
    @Operation(summary = "Initiate Google account linking", description = "Starts OAuth flow to link a Google identity to the authenticated user")
    public ResponseEntity<ApiResponse<GoogleAuthStartResponse>> startLinkGoogle(
            @Valid @RequestBody GoogleAuthStartRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        // Enforce LINK action and authenticated user id
        GoogleAuthStartRequest linkRequest = new GoogleAuthStartRequest("LINK", request.clientType(), request.codeChallenge());
        GoogleAuthStartResponse response = googleOAuthService.startAuth(linkRequest, principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Google account linking initiated", response));
    }

    @DeleteMapping("/google/link")
    @Operation(summary = "Disconnect Google account", description = "Unlinks Google identity from user account if another login method exists")
    public ResponseEntity<ApiResponse<Void>> unlinkGoogle(
            @AuthenticationPrincipal UserPrincipal principal) {
        googleOAuthService.unlinkGoogle(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Google account disconnected successfully", null));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change account password", description = "Updates password for email/password authenticated users")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        googleOAuthService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PostMapping("/set-password")
    @Operation(summary = "Set account password", description = "Allows Google-only accounts to configure an email/password login method")
    public ResponseEntity<ApiResponse<Void>> setPassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SetPasswordRequest request) {
        googleOAuthService.setPassword(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password set successfully. You can now sign in with your email and password.", null));
    }
}
