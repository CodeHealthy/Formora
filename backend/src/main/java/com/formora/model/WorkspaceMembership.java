package com.formora.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Document("workspace_memberships")
@CompoundIndex(
        name = "workspaceId_1_userId_1",
        def = "{'workspaceId': 1, 'userId': 1}",
        unique = true
)
public class WorkspaceMembership {

    @Id
    private String id;

    @Field(targetType = FieldType.OBJECT_ID)
    private String workspaceId;

    @Field(targetType = FieldType.OBJECT_ID)
    private String userId;
    private String role;
    private Instant createdAt;
    private Instant updatedAt;

    public WorkspaceMembership() {
    }

    public WorkspaceMembership(String workspaceId, String userId, String role, Instant now) {
        this.workspaceId = workspaceId;
        this.userId = userId;
        this.role = role;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public String getWorkspaceId() {
        return workspaceId;
    }

    public String getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }
}
