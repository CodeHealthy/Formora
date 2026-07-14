package com.formora.controller;

import com.formora.common.ApiResponse;
import com.formora.dto.FormAccessDtos.FormAccessData;
import com.formora.dto.FormAccessDtos.FormAccessRequest;
import com.formora.dto.FormAccessDtos.FormAccessResponse;
import com.formora.dto.FormAccessDtos.FormAccessSettings;
import com.formora.model.Form;
import com.formora.service.AuthService;
import com.formora.service.FormAccessService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/forms/{formId}/access-settings")
public class FormAccessController {

    private final AuthService authService;
    private final FormAccessService formAccessService;

    public FormAccessController(AuthService authService, FormAccessService formAccessService) {
        this.authService = authService;
        this.formAccessService = formAccessService;
    }

    @GetMapping
    FormAccessResponse get(@PathVariable String formId, HttpServletRequest request) {
        return response(formAccessService.getSettings(authService.requireUser(request), formId), request);
    }

    @PutMapping
    FormAccessResponse update(
            @PathVariable String formId,
            @Valid @RequestBody FormAccessRequest body,
            HttpServletRequest request
    ) {
        Form form = formAccessService.updateSettings(
                authService.requireUser(request), formId, body.accessMode(), body.password()
        );
        return response(form, request);
    }

    private FormAccessResponse response(Form form, HttpServletRequest request) {
        FormAccessSettings settings = new FormAccessSettings(
                form.getAccessMode(), form.getSubmissionPasswordHash() != null
        );
        return new FormAccessResponse(new FormAccessData(settings), ApiResponse.meta(request));
    }

}
