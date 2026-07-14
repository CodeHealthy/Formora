package com.formora.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

@Document("form_guest_access_tokens")
public class GuestAccessToken {

    @Id
    private String id;

    @Field(targetType = FieldType.OBJECT_ID)
    private String formId;

    @Indexed(name = "guestTokenHash_1", unique = true)
    private String tokenHash;

    private Instant createdAt;

    @Indexed(name = "guestTokenExpiresAt_1", expireAfter = "0s")
    private Instant expiresAt;

    public GuestAccessToken() {
    }

    public GuestAccessToken(String formId, String tokenHash, Instant createdAt, Instant expiresAt) {
        this.formId = formId;
        this.tokenHash = tokenHash;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    public String getFormId() {
        return formId;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }
}
