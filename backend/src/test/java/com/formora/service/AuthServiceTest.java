package com.formora.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.formora.config.FormoraProperties;
import com.formora.model.User;
import com.formora.model.UserRole;
import com.formora.repository.SessionRepository;
import com.formora.repository.UserRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(passwordEncoder.encode(any())).thenReturn("password-hash");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void publicRegistrationCreatesAUserRole() {
        AuthService service = service("admin@example.com");

        AuthService.AuthResult result = service.register("Ada", "ada@example.com", "password123");

        assertThat(result.user().getRole()).isEqualTo(UserRole.USER);
    }

    @Test
    void configuredAdministratorEmailCreatesAnAdministrator() {
        AuthService service = service("owner@example.com, admin@example.com");

        AuthService.AuthResult result = service.register("Admin", "ADMIN@example.com", "password123");

        assertThat(result.user().getRole()).isEqualTo(UserRole.ADMIN);
    }

    @Test
    void configuredExistingAccountIsPromotedAtLogin() {
        AuthService service = service("admin@example.com");
        User existingUser = new User("Admin", "admin@example.com", "password-hash", Instant.now());
        when(userRepository.findByEmailNormalized("admin@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("password123", "password-hash")).thenReturn(true);

        AuthService.AuthResult result = service.login("admin@example.com", "password123");

        assertThat(result.user().getRole()).isEqualTo(UserRole.ADMIN);
    }

    private AuthService service(String adminEmails) {
        FormoraProperties properties = new FormoraProperties(
                "http://localhost:5173", 168, false, adminEmails, 15
        );
        return new AuthService(userRepository, sessionRepository, passwordEncoder, properties);
    }
}
