package com.formora.service;

import com.formora.common.ApiException;
import com.formora.config.FormoraProperties;
import com.formora.model.Session;
import com.formora.model.User;
import com.formora.repository.SessionRepository;
import com.formora.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Locale;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    public static final String COOKIE_NAME = "formora_session";

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final FormoraProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            UserRepository userRepository,
            SessionRepository sessionRepository,
            PasswordEncoder passwordEncoder,
            FormoraProperties properties
    ) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
    }

    public AuthResult register(String displayName, String email, String password) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailNormalized(normalizedEmail)) {
            throw emailAlreadyRegistered();
        }

        Instant now = Instant.now();
        User user;
        try {
            user = userRepository.save(new User(
                    displayName.trim(), normalizedEmail, passwordEncoder.encode(password), now
            ));
        } catch (DuplicateKeyException exception) {
            throw emailAlreadyRegistered();
        }
        return issueSession(user, now);
    }

    public AuthResult login(String email, String password) {
        User user = userRepository.findByEmailNormalized(email.trim().toLowerCase(Locale.ROOT))
                .orElseThrow(this::invalidCredentials);
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw invalidCredentials();
        }
        return issueSession(user, Instant.now());
    }

    public User requireUser(HttpServletRequest request) {
        String rawToken = readCookie(request);
        if (rawToken == null) {
            throw authenticationRequired();
        }

        Session session = sessionRepository.findByTokenHash(hashToken(rawToken))
                .orElseThrow(this::authenticationRequired);
        if (!session.getExpiresAt().isAfter(Instant.now())) {
            sessionRepository.deleteByTokenHash(session.getTokenHash());
            throw authenticationRequired();
        }
        return userRepository.findById(session.getUserId())
                .orElseThrow(this::authenticationRequired);
    }

    public void logout(HttpServletRequest request) {
        String rawToken = readCookie(request);
        if (rawToken != null) {
            sessionRepository.deleteByTokenHash(hashToken(rawToken));
        }
    }

    public ResponseCookie clearSessionCookie() {
        return baseCookie("").maxAge(Duration.ZERO).build();
    }

    private AuthResult issueSession(User user, Instant now) {
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        Duration lifetime = Duration.ofHours(properties.sessionTtlHours());
        sessionRepository.save(new Session(hashToken(rawToken), user.getId(), now, now.plus(lifetime)));
        return new AuthResult(user, baseCookie(rawToken).maxAge(lifetime).build());
    }

    private ResponseCookie.ResponseCookieBuilder baseCookie(String value) {
        return ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(properties.secureCookies())
                .sameSite("Lax")
                .path("/");
    }

    private String readCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    private ApiException emailAlreadyRegistered() {
        return new ApiException(
                "EMAIL_ALREADY_REGISTERED", "This email address is already registered.", HttpStatus.CONFLICT
        );
    }

    private ApiException invalidCredentials() {
        return new ApiException("INVALID_CREDENTIALS", "The email or password is incorrect.", HttpStatus.UNAUTHORIZED);
    }

    private ApiException authenticationRequired() {
        return new ApiException("AUTHENTICATION_REQUIRED", "Authentication is required.", HttpStatus.UNAUTHORIZED);
    }

    public record AuthResult(User user, ResponseCookie cookie) {
    }
}
