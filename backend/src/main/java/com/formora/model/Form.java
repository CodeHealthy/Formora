package com.formora.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Document("forms")
@CompoundIndex(
        name = "workspaceId_1_updatedAt_-1",
        def = "{'workspaceId': 1, 'updatedAt': -1}"
)
public class Form {

    @Id
    private String id;

    @Field(targetType = FieldType.OBJECT_ID)
    private String workspaceId;

    @Field(targetType = FieldType.OBJECT_ID)
    private String ownerId;
    private String title;

    @Indexed(name = "slug_1", unique = true)
    private String slug;

    private String status;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant archivedAt;

    public Form() {
    }

    public Form(String workspaceId, String ownerId, String title, String slug, Instant now) {
        this.workspaceId = workspaceId;
        this.ownerId = ownerId;
        this.title = title;
        this.slug = slug;
        this.status = "draft";
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void rename(String title, Instant now) {
        this.title = title;
        this.updatedAt = now;
    }

    public void archive(Instant now) {
        this.status = "archived";
        this.archivedAt = now;
        this.updatedAt = now;
    }

    public String getId() {
        return id;
    }

    public String getWorkspaceId() {
        return workspaceId;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public String getTitle() {
        return title;
    }

    public String getSlug() {
        return slug;
    }

    public String getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Instant getArchivedAt() {
        return archivedAt;
    }
}
