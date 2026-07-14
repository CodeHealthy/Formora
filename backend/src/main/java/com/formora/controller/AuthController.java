package com.formora.controller;

import com.formora.common.ApiResponse;
import com.formora.model.User;
import com.formora.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest body,
            HttpServletRequest request
    ) {
        AuthService.AuthResult result = authService.register(body.displayName(), body.email(), body.password());
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, result.cookie().toString())
                .body(response(result.user(), request));
    }

    @PostMapping("/login")
    ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest body,
            HttpServletRequest request
    ) {
        AuthService.AuthResult result = authService.login(body.email(), body.password());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, result.cookie().toString())
                .body(response(result.user(), request));
    }

    @PostMapping("/logout")
    ResponseEntity<LogoutResponse> logout(HttpServletRequest request) {
        authService.logout(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authService.clearSessionCookie().toString())
                .body(new LogoutResponse(new LogoutData(true), ApiResponse.meta(request)));
    }

    @GetMapping("/session")
    AuthResponse session(HttpServletRequest request) {
        return response(authService.requireUser(request), request);
    }

    private AuthResponse response(User user, HttpServletRequest request) {
        return new AuthResponse(
                new AuthData(new AuthUser(user.getId(), user.getDisplayName(), user.getEmail(), user.getCreatedAt())),
                ApiResponse.meta(request)
        );
    }

    public record RegisterRequest(
            @NotBlank @Size(min = 2, max = 80) String displayName,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(min = 8, max = 128) String password
    ) {
    }

    public record LoginRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 128) String password
    ) {
    }

    public record AuthUser(String id, String displayName, String email, Instant createdAt) {
    }

    public record AuthData(AuthUser user) {
    }

    public record AuthResponse(AuthData data, Map<String, String> meta) {
    }

    public record LogoutData(boolean success) {
    }

    public record LogoutResponse(LogoutData data, Map<String, String> meta) {
    }
}
