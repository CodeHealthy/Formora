package com.formora.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Document("sessions")
public class Session {

    @Id
    private String id;

    @Indexed(name = "tokenHash_1", unique = true)
    private String tokenHash;

    @Field(targetType = FieldType.OBJECT_ID)
    private String userId;
    private Instant createdAt;

    @Indexed(name = "expiresAt_1", expireAfter = "0s")
    private Instant expiresAt;

    public Session() {
    }

    public Session(String tokenHash, String userId, Instant createdAt, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.userId = userId;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public String getUserId() {
        return userId;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }
}
