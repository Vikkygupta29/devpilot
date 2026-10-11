package com.devpilot.entity;


import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "users")
@Builder
public class User implements Serializable {
    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(name = "github_id", nullable = false, unique = true)
    private Long githubId;
    @Column(name = "github_username",nullable = false,length = 100)
    private String githubUsername;
    @Column(name = "display_name",nullable = false,length = 200)
    private String displayName;
    @Column(name = "avatar_url",length = 500)
    private String avatarUrl;
    @Column(name = "access_token",nullable = false,columnDefinition = "TEXT")
    private String accessToken;
    @Column(name = "token_scopes", length = 500)
    private String tokenScopes;

    @Column(name = "created_at",nullable = false,updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = Instant.now();
    }



}
