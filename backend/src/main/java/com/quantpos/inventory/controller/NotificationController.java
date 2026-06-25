package com.quantpos.inventory.controller;

import com.quantpos.common.ApiResponse;
import com.quantpos.inventory.dto.NotificationDto;
import com.quantpos.inventory.service.NotificationService;
import com.quantpos.multitenancy.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'CASHIER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<NotificationDto>>> getUnreadNotifications(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        List<NotificationDto> notifications = notificationService.getUnreadNotifications(TenantContext.getTenantId(), userId);
        return ResponseEntity.ok(ApiResponse.success(notifications, "Notifications retrieved successfully"));
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'CASHIER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(TenantContext.getTenantId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
    }

    @PutMapping("/read-all")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'CASHIER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        notificationService.markAllAsRead(TenantContext.getTenantId(), userId);
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }
}
