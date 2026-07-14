package com.formora.controller;

import com.formora.common.ApiResponse;
import com.formora.model.User;
import com.formora.model.Workspace;
import com.formora.service.AuthService;
import com.formora.service.WorkspaceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspaces")
public class WorkspaceController {

    private final AuthService authService;
    private final WorkspaceService workspaceService;

    public WorkspaceController(AuthService authService, WorkspaceService workspaceService) {
        this.authService = authService;
        this.workspaceService = workspaceService;
    }

    @PostMapping
    ResponseEntity<WorkspaceResponse> create(
            @Valid @RequestBody CreateWorkspaceRequest body,
            HttpServletRequest request
    ) {
        User user = authService.requireUser(request);
        WorkspaceService.WorkspaceView created = workspaceService.create(user, body.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(response(created, request));
    }

    @GetMapping
    WorkspaceListResponse list(HttpServletRequest request) {
        User user = authService.requireUser(request);
        List<WorkspaceDto> workspaces = workspaceService.list(user).stream().map(this::dto).toList();
        return new WorkspaceListResponse(new WorkspaceListData(workspaces), ApiResponse.meta(request));
    }

    @GetMapping("/{workspaceId}")
    WorkspaceResponse get(@PathVariable String workspaceId, HttpServletRequest request) {
        User user = authService.requireUser(request);
        return response(workspaceService.get(user, workspaceId), request);
    }

    private WorkspaceResponse response(WorkspaceService.WorkspaceView view, HttpServletRequest request) {
        return new WorkspaceResponse(new WorkspaceData(dto(view)), ApiResponse.meta(request));
    }

    private WorkspaceDto dto(WorkspaceService.WorkspaceView view) {
        Workspace workspace = view.workspace();
        return new WorkspaceDto(
                workspace.getId(), workspace.getName(), view.role(), workspace.getCreatedAt(), workspace.getUpdatedAt()
        );
    }

    public record CreateWorkspaceRequest(@NotBlank @Size(min = 2, max = 80) String name) {
    }

    public record WorkspaceDto(
            String id,
            String name,
            String role,
            Instant createdAt,
            Instant updatedAt
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
