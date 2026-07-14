package com.formora.service;

import com.formora.common.ApiException;
import com.formora.model.Form;
import com.formora.model.FormDefinition;
import com.formora.model.FormField;
import com.formora.model.User;
import com.formora.repository.FormRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class FormBuilderService {

    private static final int MAXIMUM_FIELDS = 100;
    private static final Pattern FIELD_ID = Pattern.compile("[A-Za-z0-9_-]{1,64}");
    private static final Set<String> SUPPORTED_TYPES = Set.of(
            "text", "textarea", "email", "number", "select", "checkbox"
    );

    private final FormRepository formRepository;
    private final WorkspaceService workspaceService;

    public FormBuilderService(FormRepository formRepository, WorkspaceService workspaceService) {
        this.formRepository = formRepository;
        this.workspaceService = workspaceService;
    }

    public Form getDraft(User user, String formId) {
        Form form = find(formId);
        workspaceService.requirePermission(
                user, form.getWorkspaceId(), WorkspaceService.Permission.FORMS_READ
        );
        return form;
    }

    public Form saveDraft(User user, String formId, FormDefinition definition) {
        Form form = find(formId);
        workspaceService.requirePermission(
                user, form.getWorkspaceId(), WorkspaceService.Permission.FORMS_UPDATE
        );
        if ("archived".equals(form.getStatus())) {
            throw new ApiException(
                    "FORM_ALREADY_ARCHIVED", "Archived forms cannot be edited.", HttpStatus.CONFLICT
            );
        }

        FormDefinition normalized = validateAndNormalize(definition);
        form.updateDraftDefinition(normalized, Instant.now());
        return formRepository.save(form);
    }

    private FormDefinition validateAndNormalize(FormDefinition definition) {
        if (definition == null || definition.getSchemaVersion() != 1) {
            throw invalid("The form definition schema version is not supported.");
        }
        if (definition.getFields().size() > MAXIMUM_FIELDS) {
            throw invalid("A form can contain at most 100 fields.");
        }

        Set<String> fieldIds = new HashSet<>();
        List<FormField> normalizedFields = new ArrayList<>();
        for (FormField field : definition.getFields()) {
            if (field == null || field.getId() == null || !FIELD_ID.matcher(field.getId()).matches()) {
                throw invalid("Every field must have a valid identifier.");
            }
            if (!fieldIds.add(field.getId())) {
                throw invalid("Field identifiers must be unique.");
            }
            String type = field.getType() == null ? "" : field.getType().trim().toLowerCase(Locale.ROOT);
            if (!SUPPORTED_TYPES.contains(type)) {
                throw invalid("The form contains an unsupported field type.");
            }
            String label = field.getLabel() == null ? "" : field.getLabel().trim();
            if (label.isEmpty() || label.length() > 120) {
                throw invalid("Every field label must contain between 1 and 120 characters.");
            }
            String placeholder = field.getPlaceholder() == null ? "" : field.getPlaceholder().trim();
            if (placeholder.length() > 200) {
                throw invalid("Field placeholders cannot exceed 200 characters.");
            }
            List<String> options = normalizeOptions(field, type);
            normalizedFields.add(new FormField(
                    field.getId(), type, label, field.isRequired(), placeholder, options
            ));
        }
        return new FormDefinition(1, normalizedFields);
    }

    private List<String> normalizeOptions(FormField field, String type) {
        List<String> options = field.getOptions();
        if (!"select".equals(type)) {
            if (!options.isEmpty()) {
                throw invalid("Only select fields can contain options.");
            }
            return List.of();
        }
        if (options.size() < 2 || options.size() > 50) {
            throw invalid("Select fields must contain between 2 and 50 options.");
        }
        List<String> normalized = options.stream().map(String::trim).toList();
        if (normalized.stream().anyMatch(option -> option.isEmpty() || option.length() > 120)
                || new HashSet<>(normalized).size() != normalized.size()) {
            throw invalid("Select options must be unique and contain between 1 and 120 characters.");
        }
        return normalized;
    }

    private Form find(String formId) {
        return formRepository.findById(formId).orElseThrow(() -> new ApiException(
                "FORM_NOT_FOUND", "The requested form was not found.", HttpStatus.NOT_FOUND
        ));
    }

    private ApiException invalid(String message) {
        return new ApiException("FORM_DEFINITION_INVALID", message, HttpStatus.BAD_REQUEST);
    }
}
