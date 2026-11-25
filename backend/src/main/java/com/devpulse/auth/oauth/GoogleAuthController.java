package com.devpulse.auth.oauth;

import com.devpulse.auth.oauth.dto.GoogleAuthStartRequest;
import com.devpulse.auth.oauth.dto.GoogleAuthStartResponse;
import com.devpulse.common.ApiResponse;
import com.devpulse.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth/google")
@Tag(name = "Google OAuth 2.0", description = "Endpoints for initiating and completing Google OAuth 2.0 authentication")
public class GoogleAuthController {

    private final GoogleOAuthService googleOAuthService;

    public GoogleAuthController(GoogleOAuthService googleOAuthService) {
        this.googleOAuthService = googleOAuthService;
    }

    @PostMapping("/start")
    @Operation(summary = "Initiate Google OAuth flow", description = "Creates a secure OAuth session and returns the Google authorization URL")
    public ResponseEntity<ApiResponse<GoogleAuthStartResponse>> startAuth(
            @Valid @RequestBody GoogleAuthStartRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        UUID authenticatedUserId = principal != null ? principal.getId() : null;
        GoogleAuthStartResponse response = googleOAuthService.startAuth(request, authenticatedUserId);
        return ResponseEntity.ok(ApiResponse.success("Google authorization URL generated", response));
    }

    @GetMapping("/callback")
    @Operation(summary = "Google OAuth callback endpoint", description = "Receives authorization code from Google, processes identity, establishes session, and redirects to frontend")
    public void handleCallback(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "error", required = false) String error,
            @RequestParam(value = "error_description", required = false) String errorDescription,
            HttpServletResponse response) throws IOException {
        String targetUrl = googleOAuthService.handleCallback(code, state, error, errorDescription, response);
        response.sendRedirect(targetUrl);
    }
}
