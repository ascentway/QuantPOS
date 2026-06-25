package com.quantpos.inventory.service;

import com.quantpos.inventory.dto.NotificationDto;
import com.quantpos.inventory.model.Notification;
import com.quantpos.inventory.model.NotificationType;
import com.quantpos.inventory.repository.NotificationRepository;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;

    @Transactional
    public void createNotification(UUID tenantId, UUID userId, NotificationType type, String message, UUID referenceId) {
        Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
        if (tenant == null) return;

        Notification notification = new Notification();
        notification.setTenant(tenant);
        
        if (userId != null) {
            userRepository.findById(userId).ifPresent(notification::setUser);
        }
        
        notification.setType(type);
        notification.setMessage(message);
        notification.setReferenceId(referenceId);
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getUnreadNotifications(UUID tenantId, UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        Role role = user != null ? user.getRole() : Role.EMPLOYEE;

        return notificationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .filter(n -> !n.getIsRead())
                .filter(n -> {
                    if (n.getUser() != null && !n.getUser().getId().equals(userId)) {
                        return false;
                    }
                    if (role == Role.EMPLOYEE && n.getType() == NotificationType.APPROVAL_NEEDED) {
                        return false;
                    }
                    return true;
                })
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(UUID tenantId, UUID notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(UUID tenantId, UUID userId) {
        User user = userRepository.findById(userId).orElse(null);
        Role role = user != null ? user.getRole() : Role.EMPLOYEE;

        List<Notification> unread = notificationRepository.findAll().stream()
                .filter(n -> !n.getIsRead())
                .filter(n -> {
                    if (n.getUser() != null && !n.getUser().getId().equals(userId)) {
                        return false;
                    }
                    if (role == Role.EMPLOYEE && n.getType() == NotificationType.APPROVAL_NEEDED) {
                        return false;
                    }
                    return true;
                })
                .collect(Collectors.toList());

        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    private NotificationDto mapToDto(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .message(n.getMessage())
                .isRead(n.getIsRead())
                .referenceId(n.getReferenceId())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
