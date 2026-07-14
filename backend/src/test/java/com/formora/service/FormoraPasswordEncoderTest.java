package com.formora.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class FormoraPasswordEncoderTest {

    private final FormoraPasswordEncoder encoder = new FormoraPasswordEncoder();

    @Test
    void verifiesLegacyNodeScryptHashes() {
        String hash = "scrypt$16384$8$1$ABEiM0RVZneImaq7zN3u_w$"
                + "ewUs74j6kPBTjgUJf_Yxg7ttYB2iVDhoVF1-idKJT8MNi6Q8v1mGp1ando--WqO0TVpJa7n5BoxzCKE0ZfLKCA";

        assertThat(encoder.matches("password123", hash)).isTrue();
        assertThat(encoder.matches("wrong-password", hash)).isFalse();
    }

    @Test
    void createsAndVerifiesBcryptHashesForNewAccounts() {
        String hash = encoder.encode("password123");

        assertThat(hash).startsWith("$2");
        assertThat(encoder.matches("password123", hash)).isTrue();
    }
}
