package com.quantpos.user.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserDto {
    private UUID id;
    private String email;
    private String fullName;
    private String role;
    private boolean isActive;
    private java.util.Set<String> permissions;
    
    // Status can map to online/offline later based on websocket presence
    private String status;
}
