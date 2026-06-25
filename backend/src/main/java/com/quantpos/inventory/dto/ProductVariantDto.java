package com.quantpos.inventory.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProductVariantDto {
    private UUID id;
    private UUID productId;
    private String name;
    private String sku;
    private String barcode;
    private Long pricePaise;
    private BigDecimal stockQuantity;
    private BigDecimal lowStockThreshold;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
