package com.formora.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Creates BCrypt hashes while retaining login compatibility with the Node API's
 * existing scrypt hashes. A successful login can therefore survive the backend migration.
 */
public class FormoraPasswordEncoder implements PasswordEncoder {

    private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder();

    @Override
    public String encode(CharSequence rawPassword) {
        return bcrypt.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String encodedPassword) {
        if (!encodedPassword.startsWith("scrypt$")) {
            return bcrypt.matches(rawPassword, encodedPassword);
        }

        String[] parts = encodedPassword.split("\\$");
        if (parts.length != 6) {
            return false;
        }
        try {
            int cost = Integer.parseInt(parts[1]);
            int blockSize = Integer.parseInt(parts[2]);
            int parallelization = Integer.parseInt(parts[3]);
            byte[] salt = Base64.getUrlDecoder().decode(parts[4]);
            byte[] expected = Base64.getUrlDecoder().decode(parts[5]);
            byte[] actual = SCrypt.generate(
                    rawPassword.toString().getBytes(StandardCharsets.UTF_8),
                    salt,
                    cost,
                    blockSize,
                    parallelization,
                    expected.length
            );
            return MessageDigest.isEqual(expected, actual);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
