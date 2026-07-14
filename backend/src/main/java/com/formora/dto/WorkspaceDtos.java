package com.formora.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class WorkspaceDtos {

    private WorkspaceDtos() {
    }

    public record CreateWorkspaceRequest(@NotBlank @Size(min = 2, max = 80) String name) {
    }

    public record WorkspaceDto(
            String id, String name, String role, Instant createdAt, Instant updatedAt
    ) {
    }

    public record WorkspaceData(WorkspaceDto workspace) {
    }

    public record WorkspaceResponse(WorkspaceData data, Map<String, String> meta) {
    }

    public record WorkspaceListData(List<WorkspaceDto> workspaces) {
    }

    public record WorkspaceListResponse(WorkspaceListData data, Map<String, String> meta) {
    }
}
