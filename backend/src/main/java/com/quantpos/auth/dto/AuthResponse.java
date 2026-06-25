package com.quantpos.auth.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private UserInfo user;

    @Data
    @Builder
    public static class UserInfo {
        private UUID   id;
        private String email;
        private String fullName;
        private String role;
        private UUID   tenantId;
        private String businessName;
        private String businessType;
        private String subscriptionStatus;  // INACTIVE | ACTIVE | PAST_DUE | CANCELLED
        private String gstin;
    }
}
