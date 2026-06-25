package com.quantpos.inventory.dto;

import com.quantpos.inventory.model.InventoryTransactionType;
import com.quantpos.inventory.model.TransactionStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class InventoryTransactionDto {
    private UUID id;
    private UUID productId;
    private String productName;
    private UUID variantId;
    private String variantName;
    private InventoryTransactionType transactionType;
    private BigDecimal quantityChange;
    private Boolean isNegativeStockWarning;
    private TransactionStatus status;
    private String reason;
    private String createdByUserName;
    private String approvedByUserName;
    private LocalDateTime createdAt;
}
