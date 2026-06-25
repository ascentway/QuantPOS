package com.quantpos.inventory.controller;

import com.quantpos.common.ApiResponse;
import com.quantpos.inventory.dto.BarcodeLookupResult;
import com.quantpos.inventory.dto.CreateProductRequest;
import com.quantpos.inventory.dto.ProductDto;
import com.quantpos.inventory.service.BarcodeService;
import com.quantpos.inventory.service.ProductService;
import com.quantpos.multitenancy.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final BarcodeService barcodeService;

    @PostMapping("/products")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<ProductDto>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        ProductDto created = productService.createProduct(TenantContext.getTenantId(), request);
        return ResponseEntity.ok(ApiResponse.success(created, "Product created successfully"));
    }

    @GetMapping("/products")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'CASHIER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getAllProducts() {
        List<ProductDto> products = productService.getAllProducts(TenantContext.getTenantId());
        return ResponseEntity.ok(ApiResponse.success(products, "Products retrieved successfully"));
    }

    @PostMapping("/products/{productId}/variants")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<com.quantpos.inventory.dto.ProductVariantDto>> createProductVariant(
            @PathVariable java.util.UUID productId,
            @Valid @RequestBody com.quantpos.inventory.dto.CreateProductVariantRequest request) {
        com.quantpos.inventory.dto.ProductVariantDto created = productService.addProductVariant(TenantContext.getTenantId(), productId, request);
        return ResponseEntity.ok(ApiResponse.success(created, "Product variant created successfully"));
    }

    @PutMapping("/products/{productId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<ProductDto>> updateProduct(
            @PathVariable java.util.UUID productId,
            @Valid @RequestBody CreateProductRequest request) {
        ProductDto updated = productService.updateProduct(TenantContext.getTenantId(), productId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Product updated successfully"));
    }

    @DeleteMapping("/products/{productId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable java.util.UUID productId) {
        productService.deleteProduct(TenantContext.getTenantId(), productId);
        return ResponseEntity.ok(ApiResponse.success(null, "Product deleted successfully"));
    }

    @PutMapping("/variants/{variantId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<com.quantpos.inventory.dto.ProductVariantDto>> updateProductVariant(
            @PathVariable java.util.UUID variantId,
            @Valid @RequestBody com.quantpos.inventory.dto.CreateProductVariantRequest request) {
        com.quantpos.inventory.dto.ProductVariantDto updated = productService.updateProductVariant(TenantContext.getTenantId(), variantId, request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Product variant updated successfully"));
    }

    @DeleteMapping("/variants/{variantId}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteProductVariant(@PathVariable java.util.UUID variantId) {
        productService.deleteProductVariant(TenantContext.getTenantId(), variantId);
        return ResponseEntity.ok(ApiResponse.success(null, "Product variant deleted successfully"));
    }

    @GetMapping("/barcode/{barcode}")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER', 'CASHIER', 'EMPLOYEE')")
    public ResponseEntity<ApiResponse<BarcodeLookupResult>> lookupBarcode(@PathVariable String barcode) {
        BarcodeLookupResult result = barcodeService.processBarcode(TenantContext.getTenantId(), barcode);
        return ResponseEntity.ok(ApiResponse.success(result, "Barcode decoded successfully"));
    }
}
