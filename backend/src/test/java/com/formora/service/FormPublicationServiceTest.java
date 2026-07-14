package com.formora.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;

import com.formora.common.ApiException;
import com.formora.model.Form;
import com.formora.model.FormDefinition;
import com.formora.model.FormField;
import com.formora.model.User;
import com.formora.repository.FormRepository;
import com.formora.repository.FormPublicationRepository;
import com.formora.model.FormPublication;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

class FormPublicationServiceTest {

    @Mock
    private FormRepository formRepository;

    @Mock
    private WorkspaceService workspaceService;

    @Mock
    private GuestAccessTokenService tokenService;

    @Mock
    private FormPublicationRepository publicationRepository;

    private FormPublicationService service;
    private Form form;
    private User user;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new FormPublicationService(
                formRepository, workspaceService, tokenService, publicationRepository
        );
        form = new Form("workspace-id", "owner-id", "Feedback", "feedback", Instant.now());
        user = new User("Ada", "ada@example.com", "hash", Instant.now());
        when(formRepository.findById("form-id")).thenReturn(Optional.of(form));
        when(formRepository.save(form)).thenReturn(form);
    }

    @Test
    void publishesAnImmutableVersionedSnapshot() {
        form.updateDraftDefinition(definition("name", "Name"), Instant.now());

        service.publish(user, "form-id");
        form.updateDraftDefinition(definition("email", "Email"), Instant.now());

        assertThat(form.getStatus()).isEqualTo("published");
        assertThat(form.getPublicationVersion()).isEqualTo(1);
        assertThat(form.getPublishedDefinition().getFields())
                .extracting(FormField::getId)
                .containsExactly("name");
        verify(publicationRepository).save(any(FormPublication.class));
    }

    @Test
    void republishingCreatesANewSnapshotVersion() {
        form.updateDraftDefinition(definition("name", "Name"), Instant.now());
        service.publish(user, "form-id");
        form.updateDraftDefinition(definition("email", "Email"), Instant.now());

        service.publish(user, "form-id");

        assertThat(form.getPublicationVersion()).isEqualTo(2);
        assertThat(form.getPublishedDefinition().getFields().get(0).getId()).isEqualTo("email");
    }

    @Test
    void emptyFormsCannotBePublished() {
        assertThatThrownBy(() -> service.publish(user, "form-id"))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("FORM_DEFINITION_EMPTY");
    }

    @Test
    void publishedFormsCanBeUnpublished() {
        form.updateDraftDefinition(definition("name", "Name"), Instant.now());
        service.publish(user, "form-id");

        service.unpublish(user, "form-id");

        assertThat(form.getStatus()).isEqualTo("draft");
    }

    private FormDefinition definition(String id, String label) {
        return new FormDefinition(1, List.of(
                new FormField(id, "text", label, true, "", List.of())
        ));
    }
}
