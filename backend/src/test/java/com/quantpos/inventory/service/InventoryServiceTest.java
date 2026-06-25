package com.quantpos.inventory.service;

import com.quantpos.auth.service.EmailService;
import com.quantpos.inventory.dto.InventoryTransactionDto;
import com.quantpos.inventory.dto.StockAdjustmentRequest;
import com.quantpos.inventory.model.*;
import com.quantpos.inventory.repository.InventoryBatchRepository;
import com.quantpos.inventory.repository.InventoryTransactionRepository;
import com.quantpos.inventory.repository.ProductRepository;
import com.quantpos.inventory.repository.ProductVariantRepository;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock private InventoryTransactionRepository transactionRepository;
    @Mock private InventoryBatchRepository batchRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductVariantRepository variantRepository;
    @Mock private TenantRepository tenantRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private EmailService emailService;

    @InjectMocks
    private InventoryService inventoryService;

    private Tenant tenant;
    private User employee;
    private User manager;
    private Product product;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setId(UUID.randomUUID());

        employee = new User();
        employee.setId(UUID.randomUUID());
        employee.setRole(Role.EMPLOYEE);
        employee.setFullName("John Doe");

        manager = new User();
        manager.setId(UUID.randomUUID());
        manager.setRole(Role.MANAGER);
        manager.setFullName("Jane Smith");

        product = new Product();
        product.setId(UUID.randomUUID());
        product.setName("Test Product");
        product.setStockQuantity(BigDecimal.ZERO);
    }

    @Test
    void proposeStockAdjustment_byEmployee_shouldBePending() {
        StockAdjustmentRequest request = new StockAdjustmentRequest();
        request.setProductId(product.getId());
        request.setTransactionType(InventoryTransactionType.ADJUSTMENT);
        request.setQuantityChange(new BigDecimal("10"));

        when(tenantRepository.findById(tenant.getId())).thenReturn(Optional.of(tenant));
        when(userRepository.findById(employee.getId())).thenReturn(Optional.of(employee));
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(i -> {
            InventoryTransaction tx = i.getArgument(0);
            tx.setId(UUID.randomUUID());
            return tx;
        });

        InventoryTransactionDto result = inventoryService.proposeStockAdjustment(tenant.getId(), employee.getId(), request);

        assertEquals(TransactionStatus.PENDING, result.getStatus());
        verify(notificationService).createNotification(eq(tenant.getId()), isNull(), eq(NotificationType.APPROVAL_NEEDED), anyString(), any());
        verify(productRepository, never()).save(any()); // Stock not updated yet
    }

    @Test
    void proposeStockAdjustment_byManager_shouldBeApprovedAndApplied() {
        StockAdjustmentRequest request = new StockAdjustmentRequest();
        request.setProductId(product.getId());
        request.setTransactionType(InventoryTransactionType.ADJUSTMENT);
        request.setQuantityChange(new BigDecimal("20"));

        when(tenantRepository.findById(tenant.getId())).thenReturn(Optional.of(tenant));
        when(userRepository.findById(manager.getId())).thenReturn(Optional.of(manager));
        when(productRepository.findById(product.getId())).thenReturn(Optional.of(product));
        when(transactionRepository.save(any(InventoryTransaction.class))).thenAnswer(i -> {
            InventoryTransaction tx = i.getArgument(0);
            tx.setId(UUID.randomUUID());
            return tx;
        });

        InventoryTransactionDto result = inventoryService.proposeStockAdjustment(tenant.getId(), manager.getId(), request);

        assertEquals(TransactionStatus.APPROVED, result.getStatus());
        assertEquals("Jane Smith", result.getApprovedByUserName());
        verify(productRepository).save(product);
        assertEquals(new BigDecimal("20"), product.getStockQuantity());
    }
}
