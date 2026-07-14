package com.formora.common;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;

public final class ApiResponse {

    private ApiResponse() {
    }

    public static Map<String, String> meta(HttpServletRequest request) {
        return Map.of("requestId", requestId(request));
    }

    public static String requestId(HttpServletRequest request) {
        Object value = request.getAttribute(RequestIdFilter.ATTRIBUTE);
        return value == null ? "unknown" : value.toString();
    }
}
