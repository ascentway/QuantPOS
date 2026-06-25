package com.quantpos.inventory.service;

import com.quantpos.auth.service.EmailService;
import com.quantpos.common.ApiException;
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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryService {

    private final InventoryTransactionRepository transactionRepository;
    private final InventoryBatchRepository batchRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    @Transactional
    public InventoryTransactionDto proposeStockAdjustment(UUID tenantId, UUID userId, StockAdjustmentRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found", "TENANT_NOT_FOUND", null));
        User user = userRepository.findById(userId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found", "USER_NOT_FOUND", null));
        Product product = productRepository.findById(request.getProductId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found", "PRODUCT_NOT_FOUND", null));
        ProductVariant variant = request.getVariantId() != null ? variantRepository.findById(request.getVariantId()).orElse(null) : null;

        InventoryTransaction transaction = new InventoryTransaction();
        transaction.setTenant(tenant);
        transaction.setProduct(product);
        transaction.setProductVariant(variant);
        transaction.setTransactionType(request.getTransactionType());
        transaction.setQuantityChange(request.getQuantityChange());
        transaction.setReason(request.getReason());
        transaction.setCreatedByUser(user);
        transaction.setUserName(user.getFullName());

        // Employee needs approval, Managers/Owners are auto-approved
        if (user.getRole() == Role.EMPLOYEE) {
            transaction.setStatus(TransactionStatus.PENDING);
        } else {
            transaction.setStatus(TransactionStatus.APPROVED);
            transaction.setApprovedByUser(user);
            applyStockChange(tenant, product, variant, request.getQuantityChange(), request.getBatchNumber(), request.getExpiryDate());
        }

        InventoryTransaction saved = transactionRepository.save(transaction);
        
        if (transaction.getStatus() == TransactionStatus.PENDING) {
            // Notify managers
            notificationService.createNotification(tenantId, null, NotificationType.APPROVAL_NEEDED, 
                    "Employee " + user.getFullName() + " proposed a stock adjustment for " + product.getName() + ". Pending approval.", saved.getId());
            // Optionally, trigger emailService.sendPendingApprovalAlert(...) if implemented
        }

        return mapToDto(saved);
    }

    @Transactional
    public InventoryTransactionDto approveTransaction(UUID tenantId, UUID managerId, UUID transactionId) {
        User manager = userRepository.findById(managerId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found", "USER_NOT_FOUND", null));
        if (manager.getRole() != Role.OWNER && manager.getRole() != Role.MANAGER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only managers or owners can approve transactions", "FORBIDDEN", null);
        }

        InventoryTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction not found", "TX_NOT_FOUND", null));

        if (transaction.getStatus() != TransactionStatus.PENDING) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Transaction is not pending", "TX_NOT_PENDING", null);
        }

        transaction.setStatus(TransactionStatus.APPROVED);
        transaction.setApprovedByUser(manager);

        if (transaction.getProduct() != null && !transaction.getProduct().getIsActive()) {
            transaction.getProduct().setIsActive(true);
            productRepository.save(transaction.getProduct());
        }

        // We assume batch mapping is simple here. If it was proposed with an expiry, we should capture that in the proposal
        // For simplicity, applying generally to product/variant
        applyStockChange(transaction.getTenant(), transaction.getProduct(), transaction.getProductVariant(), transaction.getQuantityChange(), null, null);

        InventoryTransaction saved = transactionRepository.save(transaction);

        // Notify proposing employee
        if (transaction.getCreatedByUser() != null) {
            String itemDesc = transaction.getProductVariant() != null 
                    ? transaction.getProduct().getName() + " (" + transaction.getProductVariant().getName() + ")" 
                    : transaction.getProduct().getName();
            notificationService.createNotification(
                    tenantId, 
                    transaction.getCreatedByUser().getId(), 
                    NotificationType.APPROVAL_RESULT, 
                    "Your request for " + itemDesc + " was approved by " + manager.getFullName(), 
                    saved.getId()
            );
        }

        return mapToDto(saved);
    }

    @Transactional
    public InventoryTransactionDto rejectTransaction(UUID tenantId, UUID managerId, UUID transactionId) {
        User manager = userRepository.findById(managerId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found", "USER_NOT_FOUND", null));
        if (manager.getRole() != Role.OWNER && manager.getRole() != Role.MANAGER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only managers or owners can approve transactions", "FORBIDDEN", null);
        }

        InventoryTransaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Transaction not found", "TX_NOT_FOUND", null));

        // Notify proposing employee
        if (transaction.getCreatedByUser() != null) {
            String itemDesc = transaction.getProductVariant() != null 
                    ? transaction.getProduct().getName() + " (" + transaction.getProductVariant().getName() + ")" 
                    : transaction.getProduct().getName();
            notificationService.createNotification(
                    tenantId, 
                    transaction.getCreatedByUser().getId(), 
                    NotificationType.APPROVAL_RESULT, 
                    "Your request for " + itemDesc + " was rejected by " + manager.getFullName(), 
                    null
            );
        }

        // If it was a proposed new product, completely delete the inactive product and the transaction
        if (transaction.getProduct() != null && !transaction.getProduct().getIsActive()) {
            Product productToDelete = transaction.getProduct();
            transactionRepository.delete(transaction);
            productRepository.delete(productToDelete);
            return InventoryTransactionDto.builder()
                    .id(transactionId)
                    .status(TransactionStatus.REJECTED)
                    .productName(productToDelete.getName())
                    .build();
        }

        transaction.setStatus(TransactionStatus.REJECTED);
        transaction.setApprovedByUser(manager);

        InventoryTransaction saved = transactionRepository.save(transaction);
        return mapToDto(saved);
    }

    private void applyStockChange(Tenant tenant, Product product, ProductVariant variant, BigDecimal quantityChange, String batchNum, java.time.LocalDate expiry) {
        BigDecimal newTotalStock;
        
        if (variant != null) {
            BigDecimal current = variant.getStockQuantity() != null ? variant.getStockQuantity() : BigDecimal.ZERO;
            newTotalStock = current.add(quantityChange);
            variant.setStockQuantity(newTotalStock);
            variantRepository.save(variant);
        } else {
            BigDecimal current = product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
            newTotalStock = current.add(quantityChange);
            product.setStockQuantity(newTotalStock);
            productRepository.save(product);
        }

        // Create or update batch
        if (quantityChange.compareTo(BigDecimal.ZERO) > 0 && expiry != null) {
            InventoryBatch batch = new InventoryBatch();
            batch.setTenant(tenant);
            batch.setProduct(product);
            batch.setProductVariant(variant);
            batch.setBatchNumber(batchNum);
            batch.setExpiryDate(expiry);
            batch.setStockQuantity(quantityChange);
            batchRepository.save(batch);
        }

        // Check for Low Stock Notification
        BigDecimal threshold = variant != null ? variant.getLowStockThreshold() : product.getLowStockThreshold();
        if (threshold != null && newTotalStock.compareTo(threshold) <= 0) {
            notificationService.createNotification(tenant.getId(), null, NotificationType.LOW_STOCK,
                    "Low stock alert: " + product.getName() + " is down to " + newTotalStock + " units.", product.getId());
            // Could also call emailService.sendLowStockEmail(...) here
        }
    }

    private InventoryTransactionDto mapToDto(InventoryTransaction tx) {
        return InventoryTransactionDto.builder()
                .id(tx.getId())
                .productId(tx.getProduct().getId())
                .productName(tx.getProduct().getName())
                .variantId(tx.getProductVariant() != null ? tx.getProductVariant().getId() : null)
                .variantName(tx.getProductVariant() != null ? tx.getProductVariant().getName() : null)
                .transactionType(tx.getTransactionType())
                .quantityChange(tx.getQuantityChange())
                .isNegativeStockWarning(tx.getIsNegativeStockWarning())
                .status(tx.getStatus())
                .reason(tx.getReason())
                .createdByUserName(tx.getUserName())
                .approvedByUserName(tx.getApprovedByUser() != null ? tx.getApprovedByUser().getFullName() : null)
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
