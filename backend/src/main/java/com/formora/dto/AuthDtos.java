package com.formora.dto;

import com.formora.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Map;

public final class AuthDtos {

    private AuthDtos() {
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

    public record AuthUser(
            String id, String displayName, String email, UserRole role, Instant createdAt
    ) {
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
