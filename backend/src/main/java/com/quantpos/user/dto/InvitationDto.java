package com.quantpos.user.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class InvitationDto {
    private UUID id;
    private String email;
    private String fullName;
    private String role;
    private String status;
    private String invitedByName;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime acceptedAt;
}
