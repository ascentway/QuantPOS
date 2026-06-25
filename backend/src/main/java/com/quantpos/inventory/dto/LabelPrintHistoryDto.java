package com.quantpos.inventory.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class LabelPrintHistoryDto {
    private UUID id;
    private UUID productId;
    private UUID variantId;
    private String productName;
    private String sku;
    private String barcode;
    private BigDecimal weight;
    private String unitType;
    private BigDecimal price;
    private LocalDateTime printedAt;
    private String printedByUserName;
    private String printedByUserRole;
}
