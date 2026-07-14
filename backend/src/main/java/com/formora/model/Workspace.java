package com.formora.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Document("workspaces")
public class Workspace {

    @Id
    private String id;

    private String name;
    @Field(targetType = FieldType.OBJECT_ID)
    private String ownerId;
    private Instant createdAt;
    private Instant updatedAt;

    public Workspace() {
    }

    public Workspace(String name, String ownerId, Instant now) {
        this.name = name;
        this.ownerId = ownerId;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
