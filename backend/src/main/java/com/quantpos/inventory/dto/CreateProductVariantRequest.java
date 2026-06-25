package com.quantpos.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateProductVariantRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String sku;

    private String barcode;

    @NotNull
    private Long pricePaise;

    private BigDecimal stockQuantity;
    
    private BigDecimal lowStockThreshold;
}
