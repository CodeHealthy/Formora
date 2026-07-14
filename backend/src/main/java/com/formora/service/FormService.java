package com.formora.service;

import com.formora.common.ApiException;
import com.formora.model.Form;
import com.formora.model.User;
import com.formora.repository.FormRepository;
import java.text.Normalizer;
import java.time.Instant;
import java.util.Locale;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class FormService {

    private static final int MAXIMUM_SLUG_ATTEMPTS = 10;
    private static final int MAXIMUM_SLUG_LENGTH = 60;

    private final FormRepository formRepository;
    private final WorkspaceService workspaceService;

    public FormService(FormRepository formRepository, WorkspaceService workspaceService) {
        this.formRepository = formRepository;
        this.workspaceService = workspaceService;
    }

    public Form create(User user, String workspaceId, String title) {
        workspaceService.requirePermission(user, workspaceId, WorkspaceService.Permission.FORMS_CREATE);
        String normalizedTitle = title.trim();
        Instant now = Instant.now();

        for (int attempt = 0; attempt < MAXIMUM_SLUG_ATTEMPTS; attempt += 1) {
            Form form = new Form(
                    workspaceId, user.getId(), normalizedTitle, slugCandidate(normalizedTitle, attempt), now
            );
            try {
                return formRepository.save(form);
            } catch (DuplicateKeyException exception) {
                // Another form owns this slug; the next deterministic suffix is attempted.
            }
        }
        throw new ApiException(
                "FORM_SLUG_UNAVAILABLE", "A unique form address could not be generated.", HttpStatus.CONFLICT
        );
    }

    public Page<Form> list(User user, String workspaceId, int page, int pageSize, boolean includeArchived) {
        workspaceService.requirePermission(user, workspaceId, WorkspaceService.Permission.FORMS_READ);
        PageRequest pageable = PageRequest.of(
                page - 1, pageSize, Sort.by(Sort.Direction.DESC, "updatedAt")
        );
        return includeArchived
                ? formRepository.findByWorkspaceId(workspaceId, pageable)
                : formRepository.findByWorkspaceIdAndStatusNot(workspaceId, "archived", pageable);
    }

    public Form get(User user, String formId) {
        Form form = find(formId);
        workspaceService.requirePermission(
                user, form.getWorkspaceId(), WorkspaceService.Permission.FORMS_READ
        );
        return form;
    }

    public Form rename(User user, String formId, String title) {
        Form form = find(formId);
        workspaceService.requirePermission(
                user, form.getWorkspaceId(), WorkspaceService.Permission.FORMS_UPDATE
        );
        ensureActive(form);
        form.rename(title.trim(), Instant.now());
        return formRepository.save(form);
    }

    public Form archive(User user, String formId) {
        Form form = find(formId);
        workspaceService.requirePermission(
                user, form.getWorkspaceId(), WorkspaceService.Permission.FORMS_DELETE
        );
        ensureActive(form);
        form.archive(Instant.now());
        return formRepository.save(form);
    }

    private Form find(String formId) {
        return formRepository.findById(formId).orElseThrow(() -> new ApiException(
                "FORM_NOT_FOUND", "The requested form was not found.", HttpStatus.NOT_FOUND
        ));
    }

    private void ensureActive(Form form) {
        if ("archived".equals(form.getStatus())) {
            throw new ApiException("FORM_ALREADY_ARCHIVED", "The form is already archived.", HttpStatus.CONFLICT);
        }
    }

    private String slugCandidate(String title, int attempt) {
        String base = Normalizer.normalize(title, Normalizer.Form.NFKD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (base.isBlank()) {
            base = "form";
        }
        String suffix = attempt == 0 ? "" : "-" + (attempt + 1);
        int baseLength = Math.min(base.length(), MAXIMUM_SLUG_LENGTH - suffix.length());
        String truncated = base.substring(0, baseLength).replaceAll("-+$", "");
        return truncated + suffix;
    }
}
