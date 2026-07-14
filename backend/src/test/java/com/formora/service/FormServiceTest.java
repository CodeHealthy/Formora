package com.formora.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.formora.common.ApiException;
import com.formora.model.Form;
import com.formora.model.User;
import com.formora.repository.FormRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.dao.DuplicateKeyException;

class FormServiceTest {

    @Mock
    private FormRepository formRepository;

    @Mock
    private WorkspaceService workspaceService;

    private FormService formService;
    private User user;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        formService = new FormService(formRepository, workspaceService);
        user = new User("Ada", "ada@example.com", "hash", Instant.now());
    }

    @Test
    void retriesWithASuffixedSlugWhenTheFirstSlugAlreadyExists() {
        when(formRepository.save(any(Form.class)))
                .thenThrow(new DuplicateKeyException("duplicate slug"))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Form created = formService.create(user, "workspace-id", "Customer Feedback");

        assertThat(created.getSlug()).isEqualTo("customer-feedback-2");
        verify(workspaceService).requirePermission(
                user.getId(), "workspace-id", WorkspaceService.Permission.FORMS_CREATE
        );
    }

    @Test
    void renamingAFormKeepsItsSlug() {
        Form form = new Form("workspace-id", "owner-id", "Feedback", "feedback", Instant.now());
        when(formRepository.findById("form-id")).thenReturn(Optional.of(form));
        when(formRepository.save(form)).thenReturn(form);

        Form renamed = formService.rename(user, "form-id", "Customer Feedback");

        assertThat(renamed.getTitle()).isEqualTo("Customer Feedback");
        assertThat(renamed.getSlug()).isEqualTo("feedback");
    }

    @Test
    void archivedFormsCannotBeRenamed() {
        Form form = new Form("workspace-id", "owner-id", "Feedback", "feedback", Instant.now());
        form.archive(Instant.now());
        when(formRepository.findById("form-id")).thenReturn(Optional.of(form));

        assertThatThrownBy(() -> formService.rename(user, "form-id", "New title"))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("FORM_ALREADY_ARCHIVED");
    }
}
