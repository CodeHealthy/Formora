package com.formora.model;

import java.time.Instant;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("users")
public class User {

    @Id
    private String id;

    private String displayName;

    private String email;

    @Indexed(name = "emailNormalized_1", unique = true)
    private String emailNormalized;

    private String passwordHash;
    private UserRole role = UserRole.USER;
    private Instant createdAt;
    private Instant updatedAt;

    public User() {
    }

    public User(String displayName, String email, String passwordHash, Instant now) {
        this(displayName, email, passwordHash, UserRole.USER, now);
    }

    public User(String displayName, String email, String passwordHash, UserRole role, Instant now) {
        this.displayName = displayName;
        this.email = email;
        this.emailNormalized = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public String getId() {
        return id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public UserRole getRole() {
        // Accounts created before RBAC was introduced retain normal user access.
        return role == null ? UserRole.USER : role;
    }

    public void assignRole(UserRole role, Instant now) {
        this.role = role;
        this.updatedAt = now;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
