package com.quantpos.inventory.service;

import com.quantpos.common.ApiException;
import com.quantpos.inventory.dto.CreateProductRequest;
import com.quantpos.inventory.dto.ProductDto;
import com.quantpos.inventory.model.Product;
import com.quantpos.inventory.model.ProductVariant;
import com.quantpos.inventory.model.ProductType;
import com.quantpos.inventory.repository.ProductRepository;
import com.quantpos.inventory.repository.ProductVariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private ProductVariantRepository productVariantRepository;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private ProductService productService;

    private UUID tenantId;
    private UUID productId;
    private Product product;
    private CreateProductRequest request;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        productId = UUID.randomUUID();

        product = new Product();
        product.setId(productId);
        product.setName("Old Name");
        product.setSku("SKU123");
        product.setBarcode("123456");
        product.setProductType(ProductType.PACKAGED);
        product.setPricePaise(1000L);
        product.setCostPaise(500L);
        product.setIsActive(false);

        request = new CreateProductRequest();
        request.setName("New Name");
        request.setSku("SKU123");
        request.setBarcode("123456");
        request.setProductType(ProductType.PACKAGED);
        request.setPricePaise(1200L);
        request.setCostPaise(600L);
    }

    @Test
    void updateProduct_success() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(productVariantRepository.findByProductId(productId)).thenReturn(Collections.emptyList());

        ProductDto result = productService.updateProduct(tenantId, productId, request);

        assertNotNull(result);
        assertEquals("New Name", result.getName());
        assertEquals(1200L, result.getPricePaise());
        verify(productRepository).save(product);
    }

    @Test
    void updateProduct_notFound() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class, () -> 
            productService.updateProduct(tenantId, productId, request)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("Product not found", exception.getMessage());
    }

    @Test
    void deleteProduct_success() {
        product.setIsActive(true);
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any(Product.class))).thenReturn(product);

        productService.deleteProduct(tenantId, productId);

        assertFalse(product.getIsActive());
        verify(productRepository).save(product);
    }

    @Test
    void deleteProduct_notFound() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        ApiException exception = assertThrows(ApiException.class, () -> 
            productService.deleteProduct(tenantId, productId)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("Product not found", exception.getMessage());
    }

    @Test
    void updateProductVariant_success() {
        UUID variantId = UUID.randomUUID();
        ProductVariant variant = new ProductVariant();
        variant.setId(variantId);
        variant.setName("Old Variant");
        variant.setSku("VAR-OLD");
        variant.setBarcode("987654");
        variant.setPricePaise(500L);
        variant.setProduct(product);
        variant.setIsActive(true);

        com.quantpos.inventory.dto.CreateProductVariantRequest vRequest = new com.quantpos.inventory.dto.CreateProductVariantRequest();
        vRequest.setName("New Variant");
        vRequest.setSku("VAR-OLD");
        vRequest.setBarcode("987654");
        vRequest.setPricePaise(600L);

        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(productVariantRepository.save(any(ProductVariant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.quantpos.inventory.dto.ProductVariantDto result = productService.updateProductVariant(tenantId, variantId, vRequest);

        assertNotNull(result);
        assertEquals("New Variant", result.getName());
        assertEquals(600L, result.getPricePaise());
        verify(productVariantRepository).save(variant);
    }

    @Test
    void deleteProductVariant_success() {
        UUID variantId = UUID.randomUUID();
        ProductVariant variant = new ProductVariant();
        variant.setId(variantId);
        variant.setIsActive(true);
        variant.setProduct(product);

        when(productVariantRepository.findById(variantId)).thenReturn(Optional.of(variant));
        when(productVariantRepository.save(any(ProductVariant.class))).thenReturn(variant);

        productService.deleteProductVariant(tenantId, variantId);

        assertFalse(variant.getIsActive());
        verify(productVariantRepository).save(variant);
    }
}
