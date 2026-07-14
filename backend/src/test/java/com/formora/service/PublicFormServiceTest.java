package com.formora.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.formora.common.ApiException;
import com.formora.model.Form;
import com.formora.model.FormAccessMode;
import com.formora.model.FormDefinition;
import com.formora.model.FormField;
import com.formora.model.FormSubmission;
import com.formora.repository.FormRepository;
import com.formora.repository.FormSubmissionRepository;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class PublicFormServiceTest {

    @Mock
    private FormRepository formRepository;

    @Mock
    private FormSubmissionRepository submissionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private GuestAccessTokenService tokenService;

    @Mock
    private SubmissionRateLimiter rateLimiter;

    private PublicFormService service;
    private Form form;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new PublicFormService(
                formRepository, submissionRepository, passwordEncoder, tokenService, rateLimiter
        );
        form = new Form("workspace-id", "owner-id", "Feedback", "feedback", Instant.now());
        ReflectionTestUtils.setField(form, "id", "507f1f77bcf86cd799439013");
        form.updateDraftDefinition(new FormDefinition(1, List.of(
                new FormField("email", "email", "Email", true, "you@example.com", List.of()),
                new FormField("country", "select", "Country", false, "", List.of("Pakistan", "Canada")),
                new FormField("consent", "checkbox", "Consent", true, "", List.of())
        )), Instant.now());
        form.publish(Instant.now());
        when(formRepository.findBySlug("feedback")).thenReturn(Optional.of(form));
        when(submissionRepository.save(any(FormSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void linkFormReturnsItsPublishedDefinition() {
        PublicFormService.PublicFormView view = service.getPublishedForm("feedback");

        assertThat(view.requiresPassword()).isFalse();
        assertThat(view.definition().getFields()).hasSize(3);
    }

    @Test
    void protectedFormHidesDefinitionUntilPasswordIsVerified() {
        form.configureAccess(FormAccessMode.PASSWORD, "password-hash", Instant.now());
        when(passwordEncoder.matches("client-secret", "password-hash")).thenReturn(true);
        when(tokenService.issue(form.getId())).thenReturn(new GuestAccessTokenService.IssuedToken(
                "access-token", Instant.now().plusSeconds(900)
        ));

        assertThat(service.getPublishedForm("feedback").definition()).isNull();
        PublicFormService.AccessGrant grant = service.unlock("feedback", "client-secret");

        assertThat(grant.accessToken()).isEqualTo("access-token");
        assertThat(grant.form().definition()).isNotNull();
    }

    @Test
    void validAnswersAreStoredAgainstThePublicationVersion() {
        FormSubmission submission = service.submit("feedback", null, Map.of(
                "email", "guest@example.com",
                "country", "Pakistan",
                "consent", true
        ), "127.0.0.1");

        assertThat(submission.getPublicationVersion()).isEqualTo(1);
        assertThat(submission.getAnswers()).containsEntry("country", "Pakistan");
        verify(rateLimiter).check(form.getId(), "127.0.0.1");
    }

    @Test
    void requiredAnswersAreEnforced() {
        assertThatThrownBy(() -> service.submit(
                "feedback", null, Map.of("consent", true), "127.0.0.1"
        )).isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("SUBMISSION_INVALID");
    }

    @Test
    void protectedSubmissionRequiresTheIssuedAccessToken() {
        form.configureAccess(FormAccessMode.PASSWORD, "password-hash", Instant.now());

        service.submit("feedback", "access-token", Map.of(
                "email", "guest@example.com", "consent", true
        ), "127.0.0.1");

        verify(tokenService).requireValid(form.getId(), "access-token");
    }
}
