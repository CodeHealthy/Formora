package com.formora.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "formora")
public record FormoraProperties(
        String corsOrigin,
        long sessionTtlHours,
        boolean secureCookies
) {
}
