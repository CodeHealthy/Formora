package com.formora.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.formora.common.ApiException;
import com.formora.model.Form;
import com.formora.model.FormAccessMode;
import com.formora.model.User;
import com.formora.repository.FormRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;

class FormAccessServiceTest {

    @Mock
    private FormRepository formRepository;

    @Mock
    private WorkspaceService workspaceService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private GuestAccessTokenService tokenService;

    private FormAccessService formAccessService;
    private Form form;
    private User user;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        formAccessService = new FormAccessService(formRepository, workspaceService, passwordEncoder, tokenService);
        form = new Form("workspace-id", "owner-id", "Feedback", "feedback", Instant.now());
        user = new User("Ada", "ada@example.com", "hash", Instant.now());
        when(formRepository.findById("form-id")).thenReturn(Optional.of(form));
        when(formRepository.save(form)).thenReturn(form);
    }

    @Test
    void hashesPasswordProtectedFormCredentials() {
        when(passwordEncoder.encode("client-secret")).thenReturn("secure-hash");

        Form updated = formAccessService.updateSettings(
                user, "form-id", FormAccessMode.PASSWORD, "client-secret"
        );

        assertThat(updated.getAccessMode()).isEqualTo(FormAccessMode.PASSWORD);
        assertThat(updated.getSubmissionPasswordHash()).isEqualTo("secure-hash");
        verify(passwordEncoder).encode("client-secret");
    }

    @Test
    void linkAccessRemovesAnExistingPassword() {
        form.configureAccess(FormAccessMode.PASSWORD, "old-hash", Instant.now());

        Form updated = formAccessService.updateSettings(user, "form-id", FormAccessMode.LINK, null);

        assertThat(updated.getAccessMode()).isEqualTo(FormAccessMode.LINK);
        assertThat(updated.getSubmissionPasswordHash()).isNull();
        verify(passwordEncoder, never()).encode(org.mockito.ArgumentMatchers.any());
    }

    @Test
    void passwordAccessRequiresAStrongEnoughPassword() {
        assertThatThrownBy(() -> formAccessService.updateSettings(
                user, "form-id", FormAccessMode.PASSWORD, "short"
        )).isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("FORM_ACCESS_PASSWORD_INVALID");
    }

    @Test
    void archivedFormAccessCannotBeChanged() {
        form.archive(Instant.now());

        assertThatThrownBy(() -> formAccessService.updateSettings(
                user, "form-id", FormAccessMode.LINK, null
        )).isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("FORM_ALREADY_ARCHIVED");
    }
}
