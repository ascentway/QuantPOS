package com.quantpos.inventory.dto;

import com.quantpos.inventory.model.ProductType;
import com.quantpos.inventory.model.UnitType;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ProductDto {
    private UUID id;
    private String name;
    private String sku;
    private String barcode;
    private String description;
    private ProductType productType;
    private Long pricePaise;
    private Long costPaise;
    private String hsnCode;
    private BigDecimal gstRate;
    private Boolean gstInclusive;
    private UnitType unitType;
    private Long pricePerUnitPaise;
    private BigDecimal stockQuantity;
    private BigDecimal minimumLooseQuantity;
    private BigDecimal lowStockThreshold;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private java.util.List<ProductVariantDto> variants;
}
