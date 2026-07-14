package com.formora.service;

import com.formora.common.ApiException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class SubmissionRateLimiter {

    private static final int MAXIMUM_SUBMISSIONS_PER_MINUTE = 10;
    private static final Duration WINDOW = Duration.ofMinutes(1);
    private final ConcurrentHashMap<String, Deque<Instant>> attempts = new ConcurrentHashMap<>();

    public void check(String formId, String clientAddress) {
        String key = formId + ":" + clientAddress;
        Instant now = Instant.now();
        Deque<Instant> clientAttempts = attempts.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (clientAttempts) {
            Instant cutoff = now.minus(WINDOW);
            while (!clientAttempts.isEmpty() && !clientAttempts.peekFirst().isAfter(cutoff)) {
                clientAttempts.removeFirst();
            }
            if (clientAttempts.size() >= MAXIMUM_SUBMISSIONS_PER_MINUTE) {
                throw new ApiException(
                        "SUBMISSION_RATE_LIMITED",
                        "Too many submissions were received. Please try again shortly.",
                        HttpStatus.TOO_MANY_REQUESTS
                );
            }
            clientAttempts.addLast(now);
        }
    }
}
