package com.quantpos.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class RecordLabelPrintRequest {
    private UUID productId;
    private UUID variantId;

    @NotBlank(message = "Product name is required")
    private String productName;

    @NotBlank(message = "SKU is required")
    private String sku;

    @NotBlank(message = "Barcode is required")
    private String barcode;

    private BigDecimal weight;

    @NotBlank(message = "Unit type is required")
    private String unitType;

    @NotNull(message = "Price is required")
    private BigDecimal price;
}
