package com.formora.model;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Document("form_submissions")
@CompoundIndex(name = "formId_1_createdAt_-1", def = "{'formId': 1, 'createdAt': -1}")
public class FormSubmission {

    @Id
    private String id;

    @Field(targetType = FieldType.OBJECT_ID)
    private String formId;

    private int publicationVersion;
    private Map<String, Object> answers = new LinkedHashMap<>();
    private Instant createdAt;

    public FormSubmission() {
    }

    public FormSubmission(String formId, int publicationVersion, Map<String, Object> answers, Instant createdAt) {
        this.formId = formId;
        this.publicationVersion = publicationVersion;
        this.answers = new LinkedHashMap<>(answers);
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public String getFormId() {
        return formId;
    }

    public int getPublicationVersion() {
        return publicationVersion;
    }

    public Map<String, Object> getAnswers() {
        return Map.copyOf(answers);
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
