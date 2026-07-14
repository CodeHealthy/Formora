package com.formora.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public final class SubmissionDtos {

    private SubmissionDtos() {
    }

    public record SubmissionSummary(
            String id,
            int publicationVersion,
            int answeredFields,
            Instant submittedAt
    ) {
    }

    public record SubmissionListData(List<SubmissionSummary> submissions) {
    }

    public record SubmissionListResponse(SubmissionListData data, Map<String, Object> meta) {
    }

    public record AnswerDto(
            String fieldId,
            String label,
            String type,
            boolean answered,
            Object value
    ) {
    }

    public record SubmissionDetail(
            String id,
            String formId,
            String formTitle,
            int publicationVersion,
            String publicationTitle,
            Instant submittedAt,
            List<AnswerDto> answers
    ) {
    }

    public record SubmissionData(SubmissionDetail submission) {
    }

    public record SubmissionResponse(SubmissionData data, Map<String, String> meta) {
    }
}
