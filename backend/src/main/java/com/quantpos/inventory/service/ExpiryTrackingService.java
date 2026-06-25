package com.quantpos.inventory.service;

import com.quantpos.auth.service.EmailService;
import com.quantpos.inventory.model.InventoryBatch;
import com.quantpos.inventory.model.NotificationType;
import com.quantpos.inventory.repository.InventoryBatchRepository;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpiryTrackingService {

    private final InventoryBatchRepository batchRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    // Runs every day at midnight
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void checkExpiryDates() {
        log.info("Starting scheduled expiry date check...");
        
        // Threshold: 7 days from now
        LocalDate thresholdDate = LocalDate.now().plusDays(7);
        
        List<InventoryBatch> expiringBatches = batchRepository.findByExpiryDateBefore(thresholdDate);
        
        for (InventoryBatch batch : expiringBatches) {
            Tenant tenant = batch.getTenant();
            String productName = batch.getProduct().getName();
            if (batch.getProductVariant() != null) {
                productName += " - " + batch.getProductVariant().getName();
            }

            // Create dashboard notification
            notificationService.createNotification(
                    tenant.getId(),
                    null,
                    NotificationType.EXPIRY,
                    "Product " + productName + " (Batch: " + batch.getBatchNumber() + ") is expiring soon or has expired on " + batch.getExpiryDate() + ".",
                    batch.getId()
            );

            // Send emails to owners and managers
            List<User> managementUsers = userRepository.findByTenantIdAndRoleIn(tenant.getId(), List.of(Role.OWNER, Role.MANAGER));
            for (User user : managementUsers) {
                emailService.sendExpiryAlert(user.getEmail(), productName, batch.getExpiryDate().toString(), batch.getBatchNumber());
            }
        }
        
        log.info("Completed expiry date check. Flagged {} batches.", expiringBatches.size());
    }
}
