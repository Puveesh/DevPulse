package com.devpulse.auth;

import com.devpulse.auth.dto.AuthResponse;
import com.devpulse.auth.dto.LoginRequest;
import com.devpulse.auth.dto.RegisterRequest;
import com.devpulse.auth.dto.UserResponse;
import com.devpulse.auth.oauth.UserAuthIdentity;
import com.devpulse.auth.oauth.UserAuthIdentityRepository;
import com.devpulse.common.BadRequestException;
import com.devpulse.common.ConflictException;
import com.devpulse.common.ResourceNotFoundException;
import com.devpulse.config.JwtProperties;
import com.devpulse.security.CookieUtils;
import com.devpulse.security.JwtTokenProvider;
import com.devpulse.security.UserPrincipal;
import com.devpulse.user.User;
import com.devpulse.user.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserAuthIdentityRepository identityRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;
    private final CookieUtils cookieUtils;

    public AuthService(UserRepository userRepository,
                       UserAuthIdentityRepository identityRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       JwtProperties jwtProperties,
                       CookieUtils cookieUtils) {
        this.userRepository = userRepository;
        this.identityRepository = identityRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.jwtProperties = jwtProperties;
        this.cookieUtils = cookieUtils;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletResponse response) {
        String normalizedEmail = request.email().trim().toLowerCase();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ConflictException("Email is already registered: " + normalizedEmail);
        }

        User user = new User(
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                request.displayName().trim()
        );

        User savedUser = userRepository.save(user);

        String token = tokenProvider.generateTokenFromUserId(savedUser.getId(), savedUser.getEmail());
        if (response != null) {
            cookieUtils.addAuthCookie(response, token);
        }

        UserResponse userResponse = toUserResponse(savedUser);
        return AuthResponse.of(token, jwtProperties.getExpirationMs(), userResponse);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request, HttpServletResponse response) {
        String normalizedEmail = request.email().trim().toLowerCase();

        User existingUser = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (existingUser != null && !existingUser.hasPassword()) {
            throw new BadRequestException("This account was created via Google and has no password configured. Please use 'Continue with Google' to sign in, or set a password in Settings.");
        }

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.password())
        );

        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();
        String token = tokenProvider.generateToken(authentication);

        if (response != null) {
            cookieUtils.addAuthCookie(response, token);
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + principal.getId()));

        UserResponse userResponse = toUserResponse(user);
        return AuthResponse.of(token, jwtProperties.getExpirationMs(), userResponse);
    }

    public void logout(HttpServletResponse response) {
        if (response != null) {
            cookieUtils.clearAuthCookie(response);
        }
    }

    @Transactional
    public UserResponse getCurrentUser(UserPrincipal principal) {
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + principal.getId()));
        user.setLastSeenAt(java.time.Instant.now());
        userRepository.save(user);
        return toUserResponse(user);
    }

    @Transactional
    public void recordHeartbeat(UserPrincipal principal) {
        if (principal != null && principal.getId() != null) {
            userRepository.findById(principal.getId()).ifPresent(user -> {
                user.setLastSeenAt(java.time.Instant.now());
                userRepository.save(user);
            });
        }
    }

    private UserResponse toUserResponse(User user) {
        Optional<UserAuthIdentity> identity = identityRepository.findByUserIdAndProvider(user.getId(), "google");
        return UserResponse.fromUser(
                user,
                identity.isPresent(),
                identity.map(UserAuthIdentity::getProviderEmail).orElse(null)
        );
    }
}

