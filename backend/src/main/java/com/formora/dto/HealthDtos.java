package com.formora.dto;

import java.util.Map;

public final class HealthDtos {

    private HealthDtos() {
    }

    public record HealthData(String status) {
    }

    public record HealthResponse(HealthData data, Map<String, String> meta) {
    }
}
