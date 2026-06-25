package com.quantpos.inventory.dto;

import com.quantpos.inventory.model.ProductType;
import com.quantpos.inventory.model.UnitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateProductRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String sku;

    private String barcode;
    private String description;

    @NotNull
    private ProductType productType;

    @NotNull
    private Long pricePaise;

    private Long costPaise;

    private String hsnCode;
    private BigDecimal gstRate;
    private Boolean gstInclusive;

    // Loose specific fields
    private UnitType unitType;
    private Long pricePerUnitPaise;
    private BigDecimal stockQuantity;
    private BigDecimal minimumLooseQuantity;
    private BigDecimal lowStockThreshold;
}
