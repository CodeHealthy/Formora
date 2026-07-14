package com.formora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class PublicFormDtos {

    private PublicFormDtos() {
    }

    public record AccessRequest(@NotBlank @Size(max = 128) String password) {
    }

    public record SubmissionRequest(@NotNull @Size(max = 100) Map<String, Object> answers) {
    }

    public record FormFieldDto(
            String id, String type, String label, boolean required, String placeholder, List<String> options
    ) {
    }

    public record FormDefinitionDto(int schemaVersion, List<FormFieldDto> fields) {
    }

    public record PublicFormDto(
            String slug,
            String title,
            boolean requiresPassword,
            int publicationVersion,
            FormDefinitionDto definition
    ) {
    }

    public record PublicFormData(PublicFormDto form) {
    }

    public record PublicFormResponse(PublicFormData data, Map<String, String> meta) {
    }

    public record AccessData(PublicFormDto form, String accessToken, Instant expiresAt) {
    }

    public record AccessResponse(AccessData data, Map<String, String> meta) {
    }

    public record SubmissionData(String submissionId, Instant submittedAt) {
    }

    public record SubmissionResponse(SubmissionData data, Map<String, String> meta) {
    }
}
