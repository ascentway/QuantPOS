package com.quantpos.inventory.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantpos.common.ApiException;
import com.quantpos.common.RedisService;
import com.quantpos.inventory.dto.BarcodeLookupResult;
import com.quantpos.inventory.dto.ProductDto;
import com.quantpos.inventory.model.Product;
import com.quantpos.inventory.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BarcodeService {

    private final ProductRepository productRepository;
    private final ProductService productService;
    private final RedisService redisService;
    private final ObjectMapper objectMapper;

    private static final String CACHE_PREFIX = "cache_barcode:";
    private static final long CACHE_TTL_SECONDS = 86400; // 24 hours

    public BarcodeLookupResult processBarcode(UUID tenantId, String barcode) {
        String cacheKey = CACHE_PREFIX + tenantId + ":" + barcode;
        
        Optional<String> cachedResult = redisService.get(cacheKey);
        if (cachedResult.isPresent()) {
            try {
                return objectMapper.readValue(cachedResult.get(), BarcodeLookupResult.class);
            } catch (JsonProcessingException e) {
                log.warn("Failed to deserialize barcode cache for key: {}", cacheKey);
                redisService.delete(cacheKey);
            }
        }

        BarcodeLookupResult result = decodeAndLookup(tenantId, barcode);

        try {
            redisService.save(cacheKey, objectMapper.writeValueAsString(result), CACHE_TTL_SECONDS);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize barcode result for caching", e);
        }

        return result;
    }

    private BarcodeLookupResult decodeAndLookup(UUID tenantId, String barcode) {
        // Scenario B: QuantPOS Label (QP|productId|weightInGrams|priceInPaise|timestamp)
        if (barcode.startsWith("QP|")) {
            String[] parts = barcode.split("\\|");
            if (parts.length >= 4) {
                try {
                    UUID productId = UUID.fromString(parts[1]);
                    Product product = productRepository.findById(productId)
                            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found from QP label", "PRODUCT_NOT_FOUND", null));
                    
                    BigDecimal weightGrams = new BigDecimal(parts[2]);
                    Long pricePaise = Long.parseLong(parts[3]);

                    if (weightGrams.compareTo(BigDecimal.ZERO) <= 0 || pricePaise <= 0) {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid quantity or price in barcode label", "INVALID_BARCODE_DATA", null);
                    }

                    return BarcodeLookupResult.builder()
                            .product(mapToDto(product))
                            .weightGrams(weightGrams)
                            .calculatedPricePaise(pricePaise)
                            .isQuantPosLabel(true)
                            .isScaleBarcode(false)
                            .build();
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid QP barcode format: {}", barcode);
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Malformed QP barcode format", "INVALID_BARCODE_DATA", null);
                }
            }
        }

        // Scenario C: GS1 Scale Barcode (20 prefix + 5 item code + 5 weight + 1 checksum)
        if (barcode.startsWith("20") && barcode.length() == 13) {
            String itemCode = barcode.substring(2, 7);
            String weightStr = barcode.substring(7, 12);
            
            // Search by SKU matching the item code
            Optional<Product> optProduct = productRepository.findBySku(itemCode);
            if (optProduct.isPresent()) {
                Product product = optProduct.get();
                BigDecimal weightGrams = new BigDecimal(weightStr);

                if (weightGrams.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid weight in scale barcode", "INVALID_BARCODE_DATA", null);
                }
                
                // Calculate dynamic price based on weight if it's a LOOSE product
                Long calculatedPrice = null;
                if (product.getPricePerUnitPaise() != null) {
                    // Assuming price is per 1000g (KG) or 1000ml (Litre) usually, 
                    // but depending on UnitType we might need different logic.
                    // Let's assume pricePerUnitPaise is per base unit (e.g., 1000g)
                    // price = (weightGrams / 1000) * pricePerUnitPaise
                    calculatedPrice = product.getPricePerUnitPaise() * weightGrams.longValue() / 1000;
                    if (calculatedPrice <= 0) {
                        calculatedPrice = 0L;
                    }
                }

                return BarcodeLookupResult.builder()
                        .product(mapToDto(product))
                        .weightGrams(weightGrams)
                        .calculatedPricePaise(calculatedPrice)
                        .isScaleBarcode(true)
                        .isQuantPosLabel(false)
                        .build();
            }
        }

        // Scenario A: Standard Manufacturer Barcode
        Product product = productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found with barcode: " + barcode, "PRODUCT_NOT_FOUND", null));

        return BarcodeLookupResult.builder()
                .product(mapToDto(product))
                .isScaleBarcode(false)
                .isQuantPosLabel(false)
                .build();
    }

    private ProductDto mapToDto(Product p) {
        return ProductDto.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .barcode(p.getBarcode())
                .description(p.getDescription())
                .productType(p.getProductType())
                .pricePaise(p.getPricePaise())
                .costPaise(p.getCostPaise())
                .hsnCode(p.getHsnCode())
                .gstRate(p.getGstRate())
                .gstInclusive(p.getGstInclusive())
                .unitType(p.getUnitType())
                .pricePerUnitPaise(p.getPricePerUnitPaise())
                .stockQuantity(p.getStockQuantity())
                .minimumLooseQuantity(p.getMinimumLooseQuantity())
                .isActive(p.getIsActive())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
