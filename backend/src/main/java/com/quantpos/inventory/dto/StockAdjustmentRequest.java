package com.quantpos.inventory.dto;

import com.quantpos.inventory.model.InventoryTransactionType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class StockAdjustmentRequest {

    private UUID productId;
    private UUID variantId;

    @NotNull
    private InventoryTransactionType transactionType;

    @NotNull
    private BigDecimal quantityChange;

    private String reason;
    
    private String batchNumber;
    
    private java.time.LocalDate expiryDate;
}
