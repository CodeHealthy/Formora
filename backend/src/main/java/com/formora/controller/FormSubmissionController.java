package com.formora.controller;

import com.formora.common.ApiResponse;
import com.formora.dto.SubmissionDtos.AnswerDto;
import com.formora.dto.SubmissionDtos.SubmissionData;
import com.formora.dto.SubmissionDtos.SubmissionDetail;
import com.formora.dto.SubmissionDtos.SubmissionListData;
import com.formora.dto.SubmissionDtos.SubmissionListResponse;
import com.formora.dto.SubmissionDtos.SubmissionResponse;
import com.formora.dto.SubmissionDtos.SubmissionSummary;
import com.formora.model.FormSubmission;
import com.formora.service.AuthService;
import com.formora.service.FormSubmissionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/forms/{formId}/submissions")
public class FormSubmissionController {

    private static final MediaType CSV = new MediaType("text", "csv");

    private final AuthService authService;
    private final FormSubmissionService submissionService;

    public FormSubmissionController(AuthService authService, FormSubmissionService submissionService) {
        this.authService = authService;
        this.submissionService = submissionService;
    }

    @GetMapping
    SubmissionListResponse list(
            @PathVariable String formId,
            @RequestParam(required = false) @Min(1) Integer publicationVersion,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int pageSize,
            HttpServletRequest request
    ) {
        FormSubmissionService.SubmissionPage result = submissionService.list(
                authService.requireUser(request), formId, publicationVersion, from, to, page, pageSize
        );
        List<SubmissionSummary> submissions = result.submissions().getContent().stream()
                .map(this::summary)
                .toList();
        Map<String, Object> meta = new LinkedHashMap<>();
        meta.put("page", page);
        meta.put("pageSize", pageSize);
        meta.put("totalItems", result.submissions().getTotalElements());
        meta.put("totalPages", result.submissions().getTotalPages());
        meta.put("availableVersions", result.availableVersions());
        meta.put("requestId", ApiResponse.requestId(request));
        return new SubmissionListResponse(new SubmissionListData(submissions), meta);
    }

    @GetMapping("/{submissionId}")
    SubmissionResponse get(
            @PathVariable String formId,
            @PathVariable String submissionId,
            HttpServletRequest request
    ) {
        FormSubmissionService.SubmissionView view = submissionService.get(
                authService.requireUser(request), formId, submissionId
        );
        List<AnswerDto> answers = view.answers().stream().map(answer -> new AnswerDto(
                answer.fieldId(), answer.label(), answer.type(), answer.answered(), answer.value()
        )).toList();
        SubmissionDetail detail = new SubmissionDetail(
                view.submission().getId(),
                view.form().getId(),
                view.form().getTitle(),
                view.submission().getPublicationVersion(),
                view.publication().getTitle(),
                view.submission().getCreatedAt(),
                answers
        );
        return new SubmissionResponse(new SubmissionData(detail), ApiResponse.meta(request));
    }

    @GetMapping("/export")
    ResponseEntity<byte[]> export(
            @PathVariable String formId,
            @RequestParam @Min(1) int publicationVersion,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            HttpServletRequest request
    ) {
        FormSubmissionService.CsvExport export = submissionService.exportCsv(
                authService.requireUser(request), formId, publicationVersion, from, to
        );
        ContentDisposition disposition = ContentDisposition.attachment().filename(export.filename()).build();
        return ResponseEntity.ok()
                .contentType(CSV)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(export.content());
    }

    private SubmissionSummary summary(FormSubmission submission) {
        return new SubmissionSummary(
                submission.getId(), submission.getPublicationVersion(), submission.getAnswers().size(),
                submission.getCreatedAt()
        );
    }
}
