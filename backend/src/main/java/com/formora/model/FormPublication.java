package com.formora.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Document("form_publications")
@CompoundIndex(name = "formId_1_version_1", def = "{'formId': 1, 'version': 1}", unique = true)
public class FormPublication {

    @Id
    private String id;

    @Field(targetType = FieldType.OBJECT_ID)
    private String formId;

    private int version;
    private String title;
    private FormDefinition definition;
    private Instant publishedAt;

    public FormPublication() {
    }

    public FormPublication(
            String formId,
            int version,
            String title,
            FormDefinition definition,
            Instant publishedAt
    ) {
        this.formId = formId;
        this.version = version;
        this.title = title;
        this.definition = definition;
        this.publishedAt = publishedAt;
    }

    public String getFormId() {
        return formId;
    }

    public int getVersion() {
        return version;
    }

    public String getTitle() {
        return title;
    }

    public FormDefinition getDefinition() {
        return definition;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }
}
