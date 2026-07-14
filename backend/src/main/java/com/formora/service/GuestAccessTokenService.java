package com.formora.service;

import com.formora.common.ApiException;
import com.formora.config.FormoraProperties;
import com.formora.model.GuestAccessToken;
import com.formora.repository.GuestAccessTokenRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class GuestAccessTokenService {

    private final GuestAccessTokenRepository tokenRepository;
    private final FormoraProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();

    public GuestAccessTokenService(GuestAccessTokenRepository tokenRepository, FormoraProperties properties) {
        this.tokenRepository = tokenRepository;
        this.properties = properties;
    }

    public IssuedToken issue(String formId) {
        byte[] tokenBytes = new byte[32];
        secureRandom.nextBytes(tokenBytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
        Instant now = Instant.now();
        Instant expiresAt = now.plus(Duration.ofMinutes(properties.guestAccessTtlMinutes()));
        tokenRepository.save(new GuestAccessToken(formId, hash(rawToken), now, expiresAt));
        return new IssuedToken(rawToken, expiresAt);
    }

    public void requireValid(String formId, String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw accessRequired();
        }
        GuestAccessToken token = tokenRepository.findByTokenHash(hash(rawToken)).orElseThrow(this::accessRequired);
        if (!formId.equals(token.getFormId()) || !token.getExpiresAt().isAfter(Instant.now())) {
            throw accessRequired();
        }
    }

    public void revokeFormTokens(String formId) {
        tokenRepository.deleteByFormId(formId);
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available.", exception);
        }
    }

    private ApiException accessRequired() {
        return new ApiException(
                "FORM_ACCESS_REQUIRED", "A valid form access token is required.", HttpStatus.UNAUTHORIZED
        );
    }

    public record IssuedToken(String value, Instant expiresAt) {
    }
}
