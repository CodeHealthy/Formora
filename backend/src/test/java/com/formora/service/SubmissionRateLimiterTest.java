package com.formora.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.formora.common.ApiException;
import org.junit.jupiter.api.Test;

class SubmissionRateLimiterTest {

    @Test
    void limitsRepeatedSubmissionsFromTheSameClient() {
        SubmissionRateLimiter limiter = new SubmissionRateLimiter();
        for (int attempt = 0; attempt < 10; attempt += 1) {
            limiter.check("form-id", "127.0.0.1");
        }

        assertThatThrownBy(() -> limiter.check("form-id", "127.0.0.1"))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("SUBMISSION_RATE_LIMITED");
    }
}
