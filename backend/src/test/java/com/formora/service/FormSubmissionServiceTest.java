package com.formora.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.formora.common.ApiException;
import com.formora.model.Form;
import com.formora.model.FormDefinition;
import com.formora.model.FormField;
import com.formora.model.FormPublication;
import com.formora.model.FormSubmission;
import com.formora.model.User;
import com.formora.repository.FormPublicationRepository;
import com.formora.repository.FormRepository;
import com.formora.repository.FormSubmissionQueryRepository;
import com.formora.repository.FormSubmissionRepository;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.util.ReflectionTestUtils;

class FormSubmissionServiceTest {

    @Mock
    private FormRepository formRepository;

    @Mock
    private FormSubmissionRepository submissionRepository;

    @Mock
    private FormSubmissionQueryRepository submissionQueryRepository;

    @Mock
    private FormPublicationRepository publicationRepository;

    @Mock
    private WorkspaceService workspaceService;

    private FormSubmissionService service;
    private User user;
    private Form form;
    private FormPublication publication;
    private FormSubmission submission;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        service = new FormSubmissionService(
                formRepository, submissionRepository, submissionQueryRepository,
                publicationRepository, workspaceService
        );
        user = new User("Ada", "ada@example.com", "hash", Instant.now());
        form = new Form("workspace-id", "owner-id", "Feedback", "feedback", Instant.now());
        ReflectionTestUtils.setField(form, "id", "form-id");
        FormDefinition definition = new FormDefinition(1, List.of(
                new FormField("name", "text", "Original name", true, "", List.of()),
                new FormField("score", "number", "Score", false, "", List.of())
        ));
        publication = new FormPublication("form-id", 2, "Feedback v2", definition, Instant.now());
        submission = new FormSubmission(
                "form-id", 2, Map.of("name", "Ada", "score", 9), Instant.parse("2026-07-14T12:00:00Z")
        );
        ReflectionTestUtils.setField(submission, "id", "submission-id");
        when(formRepository.findById("form-id")).thenReturn(Optional.of(form));
        when(publicationRepository.findByFormIdAndVersion("form-id", 2)).thenReturn(Optional.of(publication));
    }

    @Test
    void listsSubmissionsWithAvailablePublicationVersions() {
        when(submissionQueryRepository.findPage("form-id", null, null, null, 1, 20))
                .thenReturn(new PageImpl<>(List.of(submission)));
        when(publicationRepository.findByFormIdOrderByVersionDesc("form-id"))
                .thenReturn(List.of(publication));

        FormSubmissionService.SubmissionPage result = service.list(
                user, "form-id", null, null, null, 1, 20
        );

        assertThat(result.submissions().getContent()).containsExactly(submission);
        assertThat(result.availableVersions()).containsExactly(2);
        verify(workspaceService).requirePermission(
                user, "workspace-id", WorkspaceService.Permission.FORMS_READ
        );
    }

    @Test
    void resolvesAnswerLabelsFromTheHistoricalPublication() {
        when(submissionRepository.findById("submission-id")).thenReturn(Optional.of(submission));

        FormSubmissionService.SubmissionView view = service.get(user, "form-id", "submission-id");

        assertThat(view.answers())
                .extracting(FormSubmissionService.AnswerView::label)
                .containsExactly("Original name", "Score");
    }

    @Test
    void rejectsSubmissionsThatBelongToAnotherForm() {
        FormSubmission otherSubmission = new FormSubmission(
                "other-form", 2, Map.of("name", "Ada"), Instant.now()
        );
        when(submissionRepository.findById("submission-id")).thenReturn(Optional.of(otherSubmission));

        assertThatThrownBy(() -> service.get(user, "form-id", "submission-id"))
                .isInstanceOf(ApiException.class)
                .extracting(exception -> ((ApiException) exception).getCode())
                .isEqualTo("SUBMISSION_NOT_FOUND");
    }

    @Test
    void csvExportUsesStableColumnsAndPreventsSpreadsheetFormulas() {
        FormSubmission dangerous = new FormSubmission(
                "form-id", 2, Map.of("name", "=SUM(A1:A2)", "score", 9),
                Instant.parse("2026-07-14T12:00:00Z")
        );
        when(submissionQueryRepository.findForExport("form-id", 2, null, null))
                .thenReturn(List.of(dangerous));

        FormSubmissionService.CsvExport export = service.exportCsv(
                user, "form-id", 2, null, null
        );
        String csv = new String(export.content(), StandardCharsets.UTF_8);

        assertThat(export.filename()).isEqualTo("feedback-v2-responses.csv");
        assertThat(csv).startsWith("Submitted at,\"Original name\",\"Score\"");
        assertThat(csv).contains("\"'=SUM(A1:A2)\"");
    }
}
