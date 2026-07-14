package com.formora.controller;

import com.formora.common.ApiResponse;
import com.formora.dto.FormBuilderDtos.DraftData;
import com.formora.dto.FormBuilderDtos.DraftDto;
import com.formora.dto.FormBuilderDtos.DraftRequest;
import com.formora.dto.FormBuilderDtos.DraftResponse;
import com.formora.dto.FormBuilderDtos.FormFieldDto;
import com.formora.dto.FormBuilderDtos.FormFieldRequest;
import com.formora.model.Form;
import com.formora.model.FormDefinition;
import com.formora.model.FormField;
import com.formora.service.AuthService;
import com.formora.service.FormBuilderService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/forms/{formId}/draft")
public class FormBuilderController {

    private final AuthService authService;
    private final FormBuilderService formBuilderService;

    public FormBuilderController(AuthService authService, FormBuilderService formBuilderService) {
        this.authService = authService;
        this.formBuilderService = formBuilderService;
    }

    @GetMapping
    DraftResponse get(@PathVariable String formId, HttpServletRequest request) {
        Form form = formBuilderService.getDraft(authService.requireUser(request), formId);
        return response(form, request);
    }

    @PutMapping
    DraftResponse save(
            @PathVariable String formId,
            @Valid @RequestBody DraftRequest body,
            HttpServletRequest request
    ) {
        FormDefinition definition = new FormDefinition(
                body.schemaVersion(),
                body.fields().stream().map(this::toModel).toList()
        );
        Form form = formBuilderService.saveDraft(authService.requireUser(request), formId, definition);
        return response(form, request);
    }

    private DraftResponse response(Form form, HttpServletRequest request) {
        FormDefinition definition = form.getDraftDefinition();
        List<FormFieldDto> fields = definition.getFields().stream().map(this::dto).toList();
        DraftDto draft = new DraftDto(definition.getSchemaVersion(), fields, form.getUpdatedAt());
        return new DraftResponse(new DraftData(draft), ApiResponse.meta(request));
    }

    private FormField toModel(FormFieldRequest field) {
        return new FormField(
                field.id(), field.type(), field.label(), field.required(), field.placeholder(), field.options()
        );
    }

    private FormFieldDto dto(FormField field) {
        return new FormFieldDto(
                field.getId(), field.getType(), field.getLabel(), field.isRequired(),
                field.getPlaceholder(), field.getOptions()
        );
    }
}
