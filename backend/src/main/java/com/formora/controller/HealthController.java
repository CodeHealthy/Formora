package com.formora.controller;

import com.formora.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
public class HealthController {

    private final MongoTemplate mongoTemplate;

    public HealthController(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @GetMapping("/live")
    HealthResponse live(HttpServletRequest request) {
        return response("ok", request);
    }

    @GetMapping("/ready")
    ResponseEntity<HealthResponse> ready(HttpServletRequest request) {
        try {
            mongoTemplate.getDb().runCommand(new Document("ping", 1));
            return ResponseEntity.ok(response("ok", request));
        } catch (RuntimeException exception) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(response("unavailable", request));
        }
    }

    private HealthResponse response(String status, HttpServletRequest request) {
        return new HealthResponse(new HealthData(status), ApiResponse.meta(request));
    }

    public record HealthData(String status) {
    }

    public record HealthResponse(HealthData data, Map<String, String> meta) {
    }
}
