package com.formora.controller;

import com.formora.common.ApiResponse;
import com.formora.model.Form;
import com.formora.model.User;
import com.formora.service.AuthService;
import com.formora.service.FormService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1")
public class FormController {

    private final AuthService authService;
    private final FormService formService;

    public FormController(AuthService authService, FormService formService) {
        this.authService = authService;
        this.formService = formService;
    }

    @PostMapping("/workspaces/{workspaceId}/forms")
    ResponseEntity<FormResponse> create(
            @PathVariable String workspaceId,
            @Valid @RequestBody FormTitleRequest body,
            HttpServletRequest request
    ) {
        User user = authService.requireUser(request);
        Form form = formService.create(user, workspaceId, body.title());
        return ResponseEntity.status(HttpStatus.CREATED).body(response(form, request));
    }

    @GetMapping("/workspaces/{workspaceId}/forms")
    FormListResponse list(
            @PathVariable String workspaceId,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            @RequestParam(defaultValue = "false") boolean includeArchived,
            HttpServletRequest request
    ) {
        User user = authService.requireUser(request);
        Page<Form> result = formService.list(user, workspaceId, page, pageSize, includeArchived);
        List<FormDto> forms = result.getContent().stream().map(this::dto).toList();
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("page", page);
        meta.put("pageSize", pageSize);
        meta.put("totalItems", result.getTotalElements());
        meta.put("totalPages", result.getTotalPages());
        meta.put("requestId", ApiResponse.requestId(request));
        return new FormListResponse(new FormListData(forms), meta);
    }

    @GetMapping("/forms/{formId}")
    FormResponse get(@PathVariable String formId, HttpServletRequest request) {
        return response(formService.get(authService.requireUser(request), formId), request);
    }

    @PatchMapping("/forms/{formId}")
    FormResponse rename(
            @PathVariable String formId,
            @Valid @RequestBody FormTitleRequest body,
            HttpServletRequest request
    ) {
        return response(formService.rename(authService.requireUser(request), formId, body.title()), request);
    }

    @DeleteMapping("/forms/{formId}")
    FormResponse archive(@PathVariable String formId, HttpServletRequest request) {
        return response(formService.archive(authService.requireUser(request), formId), request);
    }

    private FormResponse response(Form form, HttpServletRequest request) {
        return new FormResponse(new FormData(dto(form)), ApiResponse.meta(request));
    }

    private FormDto dto(Form form) {
        return new FormDto(
                form.getId(), form.getWorkspaceId(), form.getOwnerId(), form.getTitle(), form.getSlug(),
                form.getStatus(), form.getCreatedAt(), form.getUpdatedAt(), form.getArchivedAt()
        );
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
