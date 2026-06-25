package com.quantpos.inventory.service;

import com.quantpos.auth.service.EmailService;
import com.quantpos.inventory.model.InventoryBatch;
import com.quantpos.inventory.model.NotificationType;
import com.quantpos.inventory.model.Product;
import com.quantpos.inventory.repository.InventoryBatchRepository;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExpiryTrackingServiceTest {

    @Mock private InventoryBatchRepository batchRepository;
    @Mock private NotificationService notificationService;
    @Mock private EmailService emailService;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private ExpiryTrackingService expiryTrackingService;

    @Test
    void checkExpiryDates_shouldNotifyAndEmailForExpiringBatches() {
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());

        Product product = new Product();
        product.setId(UUID.randomUUID());
        product.setName("Expired Bread");

        InventoryBatch batch = new InventoryBatch();
        batch.setId(UUID.randomUUID());
        batch.setTenant(tenant);
        batch.setProduct(product);
        batch.setBatchNumber("B-100");
        batch.setExpiryDate(LocalDate.now().plusDays(2));

        User owner = new User();
        owner.setId(UUID.randomUUID());
        owner.setEmail("owner@test.com");

        when(batchRepository.findByExpiryDateBefore(any(LocalDate.class))).thenReturn(List.of(batch));
        when(userRepository.findByTenantIdAndRoleIn(tenant.getId(), List.of(Role.OWNER, Role.MANAGER)))
                .thenReturn(List.of(owner));

        expiryTrackingService.checkExpiryDates();

        verify(notificationService).createNotification(eq(tenant.getId()), isNull(), eq(NotificationType.EXPIRY), contains("Expired Bread"), eq(batch.getId()));
        verify(emailService).sendExpiryAlert(eq("owner@test.com"), eq("Expired Bread"), eq(batch.getExpiryDate().toString()), eq("B-100"));
    }
}
