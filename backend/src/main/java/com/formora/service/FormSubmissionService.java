package com.formora.service;

import com.formora.common.ApiException;
import com.formora.model.Form;
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
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class FormSubmissionService {

    private static final int MAXIMUM_EXPORT_ROWS = 50_000;

    private final FormRepository formRepository;
    private final FormSubmissionRepository submissionRepository;
    private final FormSubmissionQueryRepository submissionQueryRepository;
    private final FormPublicationRepository publicationRepository;
    private final WorkspaceService workspaceService;

    public FormSubmissionService(
            FormRepository formRepository,
            FormSubmissionRepository submissionRepository,
            FormSubmissionQueryRepository submissionQueryRepository,
            FormPublicationRepository publicationRepository,
            WorkspaceService workspaceService
    ) {
        this.formRepository = formRepository;
        this.submissionRepository = submissionRepository;
        this.submissionQueryRepository = submissionQueryRepository;
        this.publicationRepository = publicationRepository;
        this.workspaceService = workspaceService;
    }

    public SubmissionPage list(
            User user,
            String formId,
            Integer publicationVersion,
            Instant from,
            Instant to,
            int page,
            int pageSize
    ) {
        requireReadableForm(user, formId);
        validateDateRange(from, to);
        Page<FormSubmission> submissions = submissionQueryRepository.findPage(
                formId, publicationVersion, from, to, page, pageSize
        );
        List<Integer> versions = publicationRepository.findByFormIdOrderByVersionDesc(formId).stream()
                .map(FormPublication::getVersion)
                .toList();
        return new SubmissionPage(submissions, versions);
    }

    public SubmissionView get(User user, String formId, String submissionId) {
        Form form = requireReadableForm(user, formId);
        FormSubmission submission = submissionRepository.findById(submissionId)
                .filter(item -> formId.equals(item.getFormId()))
                .orElseThrow(() -> new ApiException(
                        "SUBMISSION_NOT_FOUND", "The requested submission was not found.", HttpStatus.NOT_FOUND
                ));
        FormPublication publication = requirePublication(formId, submission.getPublicationVersion());
        List<AnswerView> answers = publication.getDefinition().getFields().stream()
                .map(field -> answer(field, submission))
                .toList();
        return new SubmissionView(form, submission, publication, answers);
    }

    public CsvExport exportCsv(
            User user,
            String formId,
            int publicationVersion,
            Instant from,
            Instant to
    ) {
        Form form = requireReadableForm(user, formId);
        validateDateRange(from, to);
        FormPublication publication = requirePublication(formId, publicationVersion);
        List<FormSubmission> submissions = submissionQueryRepository.findForExport(
                formId, publicationVersion, from, to
        );
        if (submissions.size() > MAXIMUM_EXPORT_ROWS) {
            throw new ApiException(
                    "EXPORT_TOO_LARGE",
                    "Narrow the date range before exporting more than 50,000 responses.",
                    HttpStatus.BAD_REQUEST
            );
        }

        StringBuilder csv = new StringBuilder("Submitted at");
        for (FormField field : publication.getDefinition().getFields()) {
            csv.append(',').append(csvCell(field.getLabel()));
        }
        csv.append("\r\n");
        for (FormSubmission submission : submissions) {
            csv.append(csvCell(submission.getCreatedAt().toString()));
            for (FormField field : publication.getDefinition().getFields()) {
                csv.append(',').append(csvCell(value(submission.getAnswers().get(field.getId()))));
            }
            csv.append("\r\n");
        }
        String filename = form.getSlug() + "-v" + publicationVersion + "-responses.csv";
        return new CsvExport(filename, csv.toString().getBytes(StandardCharsets.UTF_8));
    }

    private Form requireReadableForm(User user, String formId) {
        Form form = formRepository.findById(formId).orElseThrow(() -> new ApiException(
                "FORM_NOT_FOUND", "The requested form was not found.", HttpStatus.NOT_FOUND
        ));
        workspaceService.requirePermission(
                user, form.getWorkspaceId(), WorkspaceService.Permission.FORMS_READ
        );
        return form;
    }

    private FormPublication requirePublication(String formId, int version) {
        return publicationRepository.findByFormIdAndVersion(formId, version).orElseThrow(() -> new ApiException(
                "FORM_PUBLICATION_NOT_FOUND",
                "The publication used by this response was not found.",
                HttpStatus.NOT_FOUND
        ));
    }

    private AnswerView answer(FormField field, FormSubmission submission) {
        boolean answered = submission.getAnswers().containsKey(field.getId());
        return new AnswerView(
                field.getId(), field.getLabel(), field.getType(), answered,
                answered ? submission.getAnswers().get(field.getId()) : null
        );
    }

    private void validateDateRange(Instant from, Instant to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new ApiException(
                    "DATE_RANGE_INVALID", "The start date must be before the end date.", HttpStatus.BAD_REQUEST
            );
        }
    }

    private String value(Object rawValue) {
        return rawValue == null ? "" : String.valueOf(rawValue);
    }

    private String csvCell(String rawValue) {
        String safeValue = rawValue;
        if (!safeValue.isEmpty() && "=+-@".indexOf(safeValue.charAt(0)) >= 0) {
            safeValue = "'" + safeValue;
        }
        return "\"" + safeValue.replace("\"", "\"\"") + "\"";
    }

    public record SubmissionPage(Page<FormSubmission> submissions, List<Integer> availableVersions) {
    }

    public record AnswerView(String fieldId, String label, String type, boolean answered, Object value) {
    }

    public record SubmissionView(
            Form form,
            FormSubmission submission,
            FormPublication publication,
            List<AnswerView> answers
    ) {
    }

    public record CsvExport(String filename, byte[] content) {
    }
}
