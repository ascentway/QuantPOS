package com.quantpos.inventory.controller;

import com.quantpos.common.ApiResponse;
import com.quantpos.inventory.dto.InventoryTransactionDto;
import com.quantpos.inventory.dto.StockAdjustmentRequest;
import com.quantpos.inventory.dto.RecordLabelPrintRequest;
import com.quantpos.inventory.dto.LabelPrintHistoryDto;
import com.quantpos.inventory.model.InventoryTransaction;
import com.quantpos.inventory.model.LabelPrintHistory;
import com.quantpos.inventory.repository.InventoryTransactionRepository;
import com.quantpos.inventory.repository.LabelPrintHistoryRepository;
import com.quantpos.inventory.repository.ProductRepository;
import com.quantpos.inventory.repository.ProductVariantRepository;
import com.quantpos.inventory.service.InventoryService;
import com.quantpos.multitenancy.TenantContext;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.UserRepository;
import com.quantpos.tenant.model.Tenant;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;
    private final InventoryTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final LabelPrintHistoryRepository labelPrintHistoryRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;

    @PostMapping("/stock/adjust")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<InventoryTransactionDto>> proposeStockAdjustment(
            @Valid @RequestBody StockAdjustmentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        UUID userId = UUID.fromString(userDetails.getUsername());
        InventoryTransactionDto tx = inventoryService.proposeStockAdjustment(TenantContext.getTenantId(), userId, request);
        String msg = tx.getStatus().name().equals("PENDING") ? "Stock adjustment proposed and pending approval." : "Stock adjustment applied successfully.";
        return ResponseEntity.ok(ApiResponse.success(tx, msg));
    }

    @PostMapping("/transactions/{transactionId}/approve")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryTransactionDto>> approveTransaction(
            @PathVariable UUID transactionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        UUID userId = UUID.fromString(userDetails.getUsername());
        InventoryTransactionDto tx = inventoryService.approveTransaction(TenantContext.getTenantId(), userId, transactionId);
        return ResponseEntity.ok(ApiResponse.success(tx, "Transaction approved successfully"));
    }

    @PostMapping("/transactions/{transactionId}/reject")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<InventoryTransactionDto>> rejectTransaction(
            @PathVariable UUID transactionId,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        UUID userId = UUID.fromString(userDetails.getUsername());
        InventoryTransactionDto tx = inventoryService.rejectTransaction(TenantContext.getTenantId(), userId, transactionId);
        return ResponseEntity.ok(ApiResponse.success(tx, "Transaction rejected"));
    }

    @GetMapping("/transactions/pending")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<InventoryTransactionDto>>> getPendingTransactions() {
        List<InventoryTransactionDto> pending = transactionRepository.findAll().stream()
                .filter(t -> t.getStatus().name().equals("PENDING"))
                .map(tx -> InventoryTransactionDto.builder()
                        .id(tx.getId())
                        .productId(tx.getProduct().getId())
                        .productName(tx.getProduct().getName())
                        .variantId(tx.getProductVariant() != null ? tx.getProductVariant().getId() : null)
                        .variantName(tx.getProductVariant() != null ? tx.getProductVariant().getName() : null)
                        .quantityChange(tx.getQuantityChange())
                        .transactionType(tx.getTransactionType())
                        .reason(tx.getReason())
                        .createdByUserName(tx.getUserName())
                        .createdAt(tx.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(pending, "Pending transactions retrieved"));
    }

    @GetMapping("/transactions/history")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<InventoryTransactionDto>>> getTransactionHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        UUID userId = UUID.fromString(userDetails.getUsername());
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        
        List<InventoryTransactionDto> history = transactionRepository.findAll().stream()
                .filter(t -> {
                    // Employees can only see their own requests (both pending, approved, and rejected)
                    if (user.getRole() == Role.EMPLOYEE) {
                        return t.getCreatedByUser() != null && t.getCreatedByUser().getId().equals(userId);
                    }
                    // Owners/managers see everything
                    return true;
                })
                .map(tx -> InventoryTransactionDto.builder()
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
                        .build())
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
                
        return ResponseEntity.ok(ApiResponse.success(history, "Transaction history retrieved"));
    }

    @PostMapping("/labels/history")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<LabelPrintHistoryDto>> recordLabelPrint(
            @Valid @RequestBody RecordLabelPrintRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        UUID userId = UUID.fromString(userDetails.getUsername());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Tenant tenant = user.getTenant();

        LabelPrintHistory history = LabelPrintHistory.builder()
                .tenant(tenant)
                .user(user)
                .productName(request.getProductName())
                .sku(request.getSku())
                .barcode(request.getBarcode())
                .weight(request.getWeight())
                .unitType(request.getUnitType())
                .price(request.getPrice())
                .product(request.getProductId() != null ? productRepository.findById(request.getProductId()).orElse(null) : null)
                .productVariant(request.getVariantId() != null ? variantRepository.findById(request.getVariantId()).orElse(null) : null)
                .build();

        LabelPrintHistory saved = labelPrintHistoryRepository.save(history);

        LabelPrintHistoryDto dto = LabelPrintHistoryDto.builder()
                .id(saved.getId())
                .productId(saved.getProduct() != null ? saved.getProduct().getId() : null)
                .variantId(saved.getProductVariant() != null ? saved.getProductVariant().getId() : null)
                .productName(saved.getProductName())
                .sku(saved.getSku())
                .barcode(saved.getBarcode())
                .weight(saved.getWeight())
                .unitType(saved.getUnitType())
                .price(saved.getPrice())
                .printedAt(saved.getPrintedAt())
                .printedByUserName(saved.getUser().getFullName())
                .printedByUserRole(saved.getUser().getRole().name())
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto, "Label print recorded"));
    }

    @GetMapping("/labels/history")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<LabelPrintHistoryDto>>> getLabelPrintHistory(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        UUID userId = UUID.fromString(userDetails.getUsername());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Role userRole = user.getRole();

        List<LabelPrintHistoryDto> history = labelPrintHistoryRepository.findAllByOrderByPrintedAtDesc().stream()
                .filter(record -> {
                    if (userRole == Role.OWNER || userRole == Role.SUPER_ADMIN) {
                        return true;
                    }
                    
                    User creator = record.getUser();
                    if (creator == null) return false;

                    if (userRole == Role.MANAGER) {
                        return creator.getRole() != Role.OWNER && creator.getRole() != Role.SUPER_ADMIN;
                    }

                    return creator.getId().equals(userId);
                })
                .map(saved -> LabelPrintHistoryDto.builder()
                        .id(saved.getId())
                        .productId(saved.getProduct() != null ? saved.getProduct().getId() : null)
                        .variantId(saved.getProductVariant() != null ? saved.getProductVariant().getId() : null)
                        .productName(saved.getProductName())
                        .sku(saved.getSku())
                        .barcode(saved.getBarcode())
                        .weight(saved.getWeight())
                        .unitType(saved.getUnitType())
                        .price(saved.getPrice())
                        .printedAt(saved.getPrintedAt())
                        .printedByUserName(saved.getUser().getFullName())
                        .printedByUserRole(saved.getUser().getRole().name())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(history, "Label print history retrieved"));
    }
}
