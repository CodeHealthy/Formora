package com.formora.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.formora.common.ApiException;
import com.formora.model.Form;
import com.formora.model.FormDefinition;
import com.formora.model.FormField;
import com.formora.model.User;
import com.formora.repository.FormRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class FormBuilderServiceTest {

    @Mock
    private FormRepository formRepository;

    @Mock
    private WorkspaceService workspaceService;

    private FormBuilderService formBuilderService;
    private User user;
    private Form form;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        formBuilderService = new FormBuilderService(formRepository, workspaceService);
        user = new User("Ada", "ada@example.com", "hash", Instant.now());
        form = new Form("workspace-id", "owner-id", "Feedback", "feedback", Instant.now());
        when(formRepository.findById("form-id")).thenReturn(Optional.of(form));
        when(formRepository.save(form)).thenReturn(form);
    }

    @Test
    void savesFieldsInTheOrderProvidedByTheClient() {
        FormDefinition definition = new FormDefinition(1, List.of(
                field("email", "email", "Email address", List.of()),
                field("name", "text", "Full name", List.of())
        ));

        Form saved = formBuilderService.saveDraft(user, "form-id", definition);

        assertThat(saved.getDraftDefinition().getFields())
                .extracting(FormField::getId)
                .containsExactly("email", "name");
        verify(workspaceService).requirePermission(
                user, "workspace-id", WorkspaceService.Permission.FORMS_UPDATE
        );
    }

    @Test
    void rejectsSelectFieldsWithoutEnoughOptions() {
        FormDefinition definition = new FormDefinition(1, List.of(
                field("country", "select", "Country", List.of("Pakistan"))
        ));

        assertThatThrownBy(() -> formBuilderService.saveDraft(user, "form-id", definition))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("FORM_DEFINITION_INVALID");
    }

    @Test
    void rejectsDuplicateFieldIdentifiers() {
        FormDefinition definition = new FormDefinition(1, List.of(
                field("name", "text", "First name", List.of()),
                field("name", "text", "Last name", List.of())
        ));

        assertThatThrownBy(() -> formBuilderService.saveDraft(user, "form-id", definition))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("FORM_DEFINITION_INVALID");
    }

    @Test
    void archivedFormsCannotBeModified() {
        form.archive(Instant.now());

        assertThatThrownBy(() -> formBuilderService.saveDraft(
                user, "form-id", new FormDefinition(1, List.of())
        ))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("FORM_ALREADY_ARCHIVED");
    }

    @Test
    void readingADraftRequiresReadPermission() {
        formBuilderService.getDraft(user, "form-id");

        verify(workspaceService).requirePermission(
                user, "workspace-id", WorkspaceService.Permission.FORMS_READ
        );
    }

    private FormField field(String id, String type, String label, List<String> options) {
        return new FormField(id, type, label, false, "", options);
    }
}
