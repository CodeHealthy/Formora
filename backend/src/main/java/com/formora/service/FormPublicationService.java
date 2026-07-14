package com.formora.service;

import com.formora.common.ApiException;
import com.formora.model.Form;
import com.formora.model.FormAccessMode;
import com.formora.model.FormPublication;
import com.formora.model.User;
import com.formora.repository.FormRepository;
import com.formora.repository.FormPublicationRepository;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class FormPublicationService {

    private final FormRepository formRepository;
    private final WorkspaceService workspaceService;
    private final GuestAccessTokenService tokenService;
    private final FormPublicationRepository publicationRepository;

    public FormPublicationService(
            FormRepository formRepository,
            WorkspaceService workspaceService,
            GuestAccessTokenService tokenService,
            FormPublicationRepository publicationRepository
    ) {
        this.formRepository = formRepository;
        this.workspaceService = workspaceService;
        this.tokenService = tokenService;
        this.publicationRepository = publicationRepository;
    }

    public Form publish(User user, String formId) {
        Form form = find(formId);
        workspaceService.requirePermission(
                user, form.getWorkspaceId(), WorkspaceService.Permission.FORMS_UPDATE
        );
        if ("archived".equals(form.getStatus())) {
            throw conflict("FORM_ALREADY_ARCHIVED", "Archived forms cannot be published.");
        }
        if (form.getDraftDefinition().getFields().isEmpty()) {
            throw new ApiException(
                    "FORM_DEFINITION_EMPTY", "Add at least one field before publishing.", HttpStatus.BAD_REQUEST
            );
        }
        if (form.getAccessMode() == FormAccessMode.PASSWORD && form.getSubmissionPasswordHash() == null) {
            throw new ApiException(
                    "FORM_ACCESS_PASSWORD_REQUIRED",
                    "Configure a guest password before publishing this form.",
                    HttpStatus.BAD_REQUEST
            );
        }
        form.publish(Instant.now());
        Form saved = formRepository.save(form);
        publicationRepository.save(new FormPublication(
                saved.getId(), saved.getPublicationVersion(), saved.getPublishedTitle(),
                saved.getPublishedDefinition(), saved.getPublishedAt()
        ));
        tokenService.revokeFormTokens(form.getId());
        return saved;
    }

    public Form unpublish(User user, String formId) {
        Form form = find(formId);
        workspaceService.requirePermission(
                user, form.getWorkspaceId(), WorkspaceService.Permission.FORMS_UPDATE
        );
        if (!"published".equals(form.getStatus())) {
            throw conflict("FORM_NOT_PUBLISHED", "Only published forms can be unpublished.");
        }
        form.unpublish(Instant.now());
        Form saved = formRepository.save(form);
        tokenService.revokeFormTokens(form.getId());
        return saved;
    }

    private Form find(String formId) {
        return formRepository.findById(formId).orElseThrow(() -> new ApiException(
                "FORM_NOT_FOUND", "The requested form was not found.", HttpStatus.NOT_FOUND
        ));
    }

    private ApiException conflict(String code, String message) {
        return new ApiException(code, message, HttpStatus.CONFLICT);
    }
}
