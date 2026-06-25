package com.quantpos.inventory.dto;

import com.quantpos.inventory.model.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class NotificationDto {
    private UUID id;
    private NotificationType type;
    private String message;
    private Boolean isRead;
    private UUID referenceId;
    private LocalDateTime createdAt;
}
