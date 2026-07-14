package com.formora.service;

import com.formora.common.ApiException;
import com.formora.model.Form;
import com.formora.model.FormAccessMode;
import com.formora.model.FormDefinition;
import com.formora.model.FormField;
import com.formora.model.FormSubmission;
import com.formora.repository.FormRepository;
import com.formora.repository.FormSubmissionRepository;
import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PublicFormService {

    private static final int MAXIMUM_TEXT_LENGTH = 10_000;
    private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");

    private final FormRepository formRepository;
    private final FormSubmissionRepository submissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final GuestAccessTokenService tokenService;
    private final SubmissionRateLimiter rateLimiter;

    public PublicFormService(
            FormRepository formRepository,
            FormSubmissionRepository submissionRepository,
            PasswordEncoder passwordEncoder,
            GuestAccessTokenService tokenService,
            SubmissionRateLimiter rateLimiter
    ) {
        this.formRepository = formRepository;
        this.submissionRepository = submissionRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.rateLimiter = rateLimiter;
    }

    public PublicFormView getPublishedForm(String slug) {
        Form form = findPublished(slug);
        boolean requiresPassword = form.getAccessMode() == FormAccessMode.PASSWORD;
        return view(form, requiresPassword ? null : form.getPublishedDefinition());
    }

    public AccessGrant unlock(String slug, String password) {
        Form form = findPublished(slug);
        if (form.getAccessMode() != FormAccessMode.PASSWORD) {
            throw new ApiException(
                    "FORM_PASSWORD_NOT_REQUIRED", "This form does not require a password.", HttpStatus.BAD_REQUEST
            );
        }
        if (password == null || !passwordEncoder.matches(password, form.getSubmissionPasswordHash())) {
            throw new ApiException(
                    "FORM_PASSWORD_INVALID", "The form password is incorrect.", HttpStatus.UNAUTHORIZED
            );
        }
        GuestAccessTokenService.IssuedToken token = tokenService.issue(form.getId());
        return new AccessGrant(view(form, form.getPublishedDefinition()), token.value(), token.expiresAt());
    }

    public FormSubmission submit(
            String slug,
            String accessToken,
            Map<String, Object> answers,
            String clientAddress
    ) {
        Form form = findPublished(slug);
        if (form.getAccessMode() == FormAccessMode.PASSWORD) {
            tokenService.requireValid(form.getId(), accessToken);
        }
        rateLimiter.check(form.getId(), clientAddress);
        Map<String, Object> normalizedAnswers = validateAnswers(form.getPublishedDefinition(), answers);
        return submissionRepository.save(new FormSubmission(
                form.getId(), form.getPublicationVersion(), normalizedAnswers, Instant.now()
        ));
    }

    private Map<String, Object> validateAnswers(FormDefinition definition, Map<String, Object> answers) {
        if (answers == null || answers.size() > definition.getFields().size()) {
            throw invalidSubmission("The submission contains an invalid number of answers.");
        }
        Set<String> fieldIds = definition.getFields().stream()
                .map(FormField::getId)
                .collect(java.util.stream.Collectors.toCollection(HashSet::new));
        if (!fieldIds.containsAll(answers.keySet())) {
            throw invalidSubmission("The submission contains an unknown field.");
        }

        Map<String, Object> normalized = new LinkedHashMap<>();
        for (FormField field : definition.getFields()) {
            Object answer = answers.get(field.getId());
            if (answer == null || (answer instanceof String text && text.isBlank())) {
                if (field.isRequired()) {
                    throw invalidSubmission("A required field is missing: " + field.getLabel());
                }
                continue;
            }
            normalized.put(field.getId(), validateAnswer(field, answer));
        }
        return normalized;
    }

    private Object validateAnswer(FormField field, Object answer) {
        return switch (field.getType()) {
            case "text", "textarea" -> validateText(field, answer, false);
            case "email" -> validateText(field, answer, true);
            case "number" -> validateNumber(field, answer);
            case "select" -> validateSelect(field, answer);
            case "checkbox" -> validateCheckbox(field, answer);
            default -> throw invalidSubmission("The published form contains an unsupported field.");
        };
    }

    private String validateText(FormField field, Object answer, boolean email) {
        if (!(answer instanceof String text) || text.length() > MAXIMUM_TEXT_LENGTH
                || (email && !EMAIL.matcher(text).matches())) {
            throw invalidSubmission("The answer is invalid for: " + field.getLabel());
        }
        return text;
    }

    private Number validateNumber(FormField field, Object answer) {
        if (!(answer instanceof Number number) || !Double.isFinite(number.doubleValue())) {
            throw invalidSubmission("The answer must be a number for: " + field.getLabel());
        }
        return number;
    }

    private String validateSelect(FormField field, Object answer) {
        if (!(answer instanceof String selected) || !field.getOptions().contains(selected)) {
            throw invalidSubmission("Select a valid option for: " + field.getLabel());
        }
        return selected;
    }

    private Boolean validateCheckbox(FormField field, Object answer) {
        if (!(answer instanceof Boolean checked) || (field.isRequired() && !checked)) {
            throw invalidSubmission("The checkbox must be accepted: " + field.getLabel());
        }
        return checked;
    }

    private Form findPublished(String slug) {
        Form form = formRepository.findBySlug(slug).orElseThrow(this::notFound);
        if (!"published".equals(form.getStatus()) || form.getPublishedDefinition() == null) {
            throw notFound();
        }
        return form;
    }

    private PublicFormView view(Form form, FormDefinition definition) {
        return new PublicFormView(
                form.getSlug(), form.getPublishedTitle(), form.getAccessMode() == FormAccessMode.PASSWORD,
                form.getPublicationVersion(), definition
        );
    }

    private ApiException notFound() {
        return new ApiException("PUBLIC_FORM_NOT_FOUND", "The requested form is not available.", HttpStatus.NOT_FOUND);
    }

    private ApiException invalidSubmission(String message) {
        return new ApiException("SUBMISSION_INVALID", message, HttpStatus.BAD_REQUEST);
    }

    public record PublicFormView(
            String slug,
            String title,
            boolean requiresPassword,
            int publicationVersion,
            FormDefinition definition
    ) {
    }

    public record AccessGrant(PublicFormView form, String accessToken, Instant expiresAt) {
    }
}
