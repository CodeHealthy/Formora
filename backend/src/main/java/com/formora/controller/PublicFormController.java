package com.formora.controller;

import com.formora.common.ApiResponse;
import com.formora.dto.PublicFormDtos.AccessData;
import com.formora.dto.PublicFormDtos.AccessRequest;
import com.formora.dto.PublicFormDtos.AccessResponse;
import com.formora.dto.PublicFormDtos.FormDefinitionDto;
import com.formora.dto.PublicFormDtos.FormFieldDto;
import com.formora.dto.PublicFormDtos.PublicFormData;
import com.formora.dto.PublicFormDtos.PublicFormDto;
import com.formora.dto.PublicFormDtos.PublicFormResponse;
import com.formora.dto.PublicFormDtos.SubmissionData;
import com.formora.dto.PublicFormDtos.SubmissionRequest;
import com.formora.dto.PublicFormDtos.SubmissionResponse;
import com.formora.model.FormDefinition;
import com.formora.model.FormField;
import com.formora.model.FormSubmission;
import com.formora.service.PublicFormService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/forms/{slug}")
public class PublicFormController {

    private final PublicFormService publicFormService;

    public PublicFormController(PublicFormService publicFormService) {
        this.publicFormService = publicFormService;
    }

    @GetMapping
    PublicFormResponse get(@PathVariable String slug, HttpServletRequest request) {
        return response(publicFormService.getPublishedForm(slug), request);
    }

    @PostMapping("/access")
    AccessResponse unlock(
            @PathVariable String slug,
            @Valid @RequestBody AccessRequest body,
            HttpServletRequest request
    ) {
        PublicFormService.AccessGrant grant = publicFormService.unlock(slug, body.password());
        return new AccessResponse(
                new AccessData(dto(grant.form()), grant.accessToken(), grant.expiresAt()),
                ApiResponse.meta(request)
        );
    }

    @PostMapping("/submissions")
    ResponseEntity<SubmissionResponse> submit(
            @PathVariable String slug,
            @RequestHeader(name = "X-Form-Access-Token", required = false) String accessToken,
            @Valid @RequestBody SubmissionRequest body,
            HttpServletRequest request
    ) {
        FormSubmission submission = publicFormService.submit(
                slug, accessToken, body.answers(), request.getRemoteAddr()
        );
        SubmissionResponse response = new SubmissionResponse(
                new SubmissionData(submission.getId(), submission.getCreatedAt()),
                ApiResponse.meta(request)
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private PublicFormResponse response(PublicFormService.PublicFormView form, HttpServletRequest request) {
        return new PublicFormResponse(new PublicFormData(dto(form)), ApiResponse.meta(request));
    }

    private PublicFormDto dto(PublicFormService.PublicFormView form) {
        return new PublicFormDto(
                form.slug(), form.title(), form.requiresPassword(), form.publicationVersion(),
                definitionDto(form.definition())
        );
    }

    private FormDefinitionDto definitionDto(FormDefinition definition) {
        if (definition == null) {
            return null;
        }
        return new FormDefinitionDto(
                definition.getSchemaVersion(), definition.getFields().stream().map(this::fieldDto).toList()
        );
    }

    private FormFieldDto fieldDto(FormField field) {
        return new FormFieldDto(
                field.getId(), field.getType(), field.getLabel(), field.isRequired(),
                field.getPlaceholder(), field.getOptions()
        );
    }
}
