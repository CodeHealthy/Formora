package com.formora.service;

import com.formora.common.ApiException;
import com.formora.model.Form;
import com.formora.model.FormAccessMode;
import com.formora.model.User;
import com.formora.repository.FormRepository;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class FormAccessService {

    private final FormRepository formRepository;
    private final WorkspaceService workspaceService;
    private final PasswordEncoder passwordEncoder;
    private final GuestAccessTokenService tokenService;

    public FormAccessService(
            FormRepository formRepository,
            WorkspaceService workspaceService,
            PasswordEncoder passwordEncoder,
            GuestAccessTokenService tokenService
    ) {
        this.formRepository = formRepository;
        this.workspaceService = workspaceService;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    public Form getSettings(User user, String formId) {
        Form form = find(formId);
        workspaceService.requirePermission(
                user, form.getWorkspaceId(), WorkspaceService.Permission.FORMS_READ
        );
        return form;
    }

    public Form updateSettings(User user, String formId, FormAccessMode accessMode, String password) {
        Form form = find(formId);
        workspaceService.requirePermission(
                user, form.getWorkspaceId(), WorkspaceService.Permission.FORMS_UPDATE
        );
        if ("archived".equals(form.getStatus())) {
            throw new ApiException(
                    "FORM_ALREADY_ARCHIVED", "Archived forms cannot be edited.", HttpStatus.CONFLICT
            );
        }

        String passwordHash = null;
        if (accessMode == FormAccessMode.PASSWORD) {
            if (password == null || password.length() < 8 || password.length() > 128) {
                throw new ApiException(
                        "FORM_ACCESS_PASSWORD_INVALID",
                        "A form access password must contain between 8 and 128 characters.",
                        HttpStatus.BAD_REQUEST
                );
            }
            passwordHash = passwordEncoder.encode(password);
        }

        form.configureAccess(accessMode, passwordHash, Instant.now());
        Form saved = formRepository.save(form);
        tokenService.revokeFormTokens(form.getId());
        return saved;
    }

    private Form find(String formId) {
        return formRepository.findById(formId).orElseThrow(() -> new ApiException(
                "FORM_NOT_FOUND", "The requested form was not found.", HttpStatus.NOT_FOUND
        ));
    }
}
