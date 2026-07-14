package com.formora.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class FormBuilderDtos {

    private FormBuilderDtos() {
    }

    public record DraftRequest(
            @Min(1) @Max(1) int schemaVersion,
            @NotNull @Size(max = 100) List<@Valid FormFieldRequest> fields
    ) {
    }

    public record FormFieldRequest(
            @NotBlank @Size(max = 64) String id,
            @NotBlank @Size(max = 20) String type,
            @NotBlank @Size(max = 120) String label,
            boolean required,
            @Size(max = 200) String placeholder,
            @NotNull @Size(max = 50) List<@NotNull @Size(max = 120) String> options
    ) {
    }

    public record FormFieldDto(
            String id, String type, String label, boolean required, String placeholder, List<String> options
    ) {
    }

    public record DraftDto(int schemaVersion, List<FormFieldDto> fields, Instant updatedAt) {
    }

    public record DraftData(DraftDto draft) {
    }

    public record DraftResponse(DraftData data, Map<String, String> meta) {
    }
}
