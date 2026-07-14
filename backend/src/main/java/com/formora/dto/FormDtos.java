package com.formora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class FormDtos {

    private FormDtos() {
    }

    public record FormTitleRequest(@NotBlank @Size(max = 120) String title) {
    }

    public record FormDto(
            String id,
            String workspaceId,
            String ownerId,
            String title,
            String slug,
            String status,
            Instant createdAt,
            Instant updatedAt,
            Instant archivedAt
    ) {
    }

    public record FormData(FormDto form) {
    }

    public record FormResponse(FormData data, Map<String, String> meta) {
    }

    public record FormListData(List<FormDto> forms) {
    }

    public record FormListResponse(FormListData data, Map<String, Object> meta) {
    }
}
