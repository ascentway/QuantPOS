package com.quantpos.inventory.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class BarcodeLookupResult {
    private ProductDto product;
    private BigDecimal weightGrams;
    private Long calculatedPricePaise;
    private boolean isScaleBarcode;
    private boolean isQuantPosLabel;
}
