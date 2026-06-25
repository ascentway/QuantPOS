package com.quantpos.inventory.service;

import com.quantpos.billing.model.Subscription;
import com.quantpos.billing.repository.SubscriptionRepository;
import com.quantpos.common.ApiException;
import com.quantpos.inventory.dto.CreateProductRequest;
import com.quantpos.inventory.dto.CreateProductVariantRequest;
import com.quantpos.inventory.dto.ProductDto;
import com.quantpos.inventory.dto.ProductVariantDto;
import com.quantpos.inventory.model.Product;
import com.quantpos.inventory.model.ProductType;
import com.quantpos.inventory.model.ProductVariant;
import com.quantpos.inventory.model.InventoryTransaction;
import com.quantpos.inventory.model.TransactionStatus;
import com.quantpos.inventory.model.InventoryTransactionType;
import com.quantpos.inventory.repository.ProductRepository;
import com.quantpos.inventory.repository.ProductVariantRepository;
import com.quantpos.inventory.repository.InventoryTransactionRepository;
import com.quantpos.user.model.User;
import com.quantpos.user.model.Role;
import com.quantpos.user.repository.UserRepository;
import com.quantpos.tenant.model.SubscriptionStatus;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final TenantRepository tenantRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final InventoryTransactionRepository transactionRepository;
    private final NotificationService notificationService;

    @Transactional
    public ProductDto createProduct(UUID tenantId, CreateProductRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found", "TENANT_NOT_FOUND", null));



        if (request.getSku() != null && productRepository.findBySku(request.getSku()).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SKU already exists", "SKU_EXISTS", null);
        }

        if (request.getBarcode() != null && productRepository.findByBarcode(request.getBarcode()).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Barcode already exists", "BARCODE_EXISTS", null);
        }

        boolean isEmployee = false;
        User creator = null;
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            try {
                UUID userId = UUID.fromString(auth.getName());
                creator = userRepository.findById(userId).orElse(null);
                if (creator != null && creator.getRole() == Role.EMPLOYEE) {
                    isEmployee = true;
                }
            } catch (Exception e) {
                // Ignore
            }
        }

        Product product = new Product();
        product.setTenant(tenant);
        product.setName(request.getName());
        product.setSku(request.getSku());
        product.setBarcode(request.getBarcode());
        product.setDescription(request.getDescription());
        product.setProductType(request.getProductType());
        product.setPricePaise(request.getPricePaise());
        product.setCostPaise(request.getCostPaise());
        product.setHsnCode(request.getHsnCode());
        product.setGstRate(request.getGstRate());
        product.setGstInclusive(request.getGstInclusive());
        product.setUnitType(request.getUnitType());
        product.setPricePerUnitPaise(request.getPricePerUnitPaise());
        product.setMinimumLooseQuantity(request.getMinimumLooseQuantity());

        BigDecimal initialStock = request.getStockQuantity() != null ? request.getStockQuantity() : BigDecimal.ZERO;
        if (isEmployee) {
            product.setStockQuantity(BigDecimal.ZERO);
            product.setIsActive(false);
        } else {
            product.setStockQuantity(initialStock);
            product.setIsActive(true);
        }

        Product saved = productRepository.save(product);

        if (isEmployee) {
            InventoryTransaction transaction = new InventoryTransaction();
            transaction.setTenant(tenant);
            transaction.setProduct(saved);
            transaction.setTransactionType(InventoryTransactionType.ADJUSTMENT);
            transaction.setQuantityChange(initialStock);
            transaction.setReason("New Product Creation: " + saved.getName());
            transaction.setCreatedByUser(creator);
            transaction.setUserName(creator != null ? creator.getFullName() : "Employee");
            transaction.setStatus(TransactionStatus.PENDING);
            InventoryTransaction savedTx = transactionRepository.save(transaction);

            notificationService.createNotification(tenantId, null, com.quantpos.inventory.model.NotificationType.APPROVAL_NEEDED,
                    "Employee " + (creator != null ? creator.getFullName() : "Staff") + " proposed a new product " + saved.getName() + ". Pending approval.", savedTx.getId());
        }

        return mapToDto(saved);
    }

    @Transactional
    public ProductDto updateProduct(UUID tenantId, UUID productId, CreateProductRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found", "PRODUCT_NOT_FOUND", null));

        if (request.getSku() != null && !request.getSku().equals(product.getSku())) {
            if (productRepository.findBySku(request.getSku()).isPresent()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "SKU already exists", "SKU_EXISTS", null);
            }
        }

        if (request.getBarcode() != null && !request.getBarcode().equals(product.getBarcode())) {
            if (productRepository.findByBarcode(request.getBarcode()).isPresent()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Barcode already exists", "BARCODE_EXISTS", null);
            }
        }

        product.setName(request.getName());
        product.setSku(request.getSku());
        product.setBarcode(request.getBarcode());
        product.setDescription(request.getDescription());
        product.setProductType(request.getProductType());
        product.setPricePaise(request.getPricePaise());
        product.setCostPaise(request.getCostPaise());
        product.setHsnCode(request.getHsnCode());
        product.setGstRate(request.getGstRate());
        product.setGstInclusive(request.getGstInclusive());
        product.setUnitType(request.getUnitType());
        product.setPricePerUnitPaise(request.getPricePerUnitPaise());
        product.setMinimumLooseQuantity(request.getMinimumLooseQuantity());

        Product saved = productRepository.save(product);
        return mapToDto(saved);
    }

    @Transactional
    public void deleteProduct(UUID tenantId, UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found", "PRODUCT_NOT_FOUND", null));
        product.setIsActive(false);
        productRepository.save(product);
    }

    @Transactional(readOnly = true)
    public List<ProductDto> getAllProducts(UUID tenantId) {
        // Tenant filter is automatically applied by Hibernate
        return productRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductVariantDto addProductVariant(UUID tenantId, UUID productId, CreateProductVariantRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found", "TENANT_NOT_FOUND", null));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found", "PRODUCT_NOT_FOUND", null));

        if (request.getSku() != null && productVariantRepository.findBySku(request.getSku()).isPresent()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Variant SKU already exists", "SKU_EXISTS", null);
        }

        ProductVariant variant = new ProductVariant();
        variant.setTenant(tenant);
        variant.setProduct(product);
        variant.setName(request.getName());
        variant.setSku(request.getSku());
        variant.setBarcode(request.getBarcode());
        variant.setPricePaise(request.getPricePaise());
        variant.setStockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : BigDecimal.ZERO);
        variant.setLowStockThreshold(request.getLowStockThreshold() != null ? request.getLowStockThreshold() : BigDecimal.ZERO);

        ProductVariant saved = productVariantRepository.save(variant);
        return mapVariantToDto(saved);
    }

    @Transactional
    public ProductVariantDto updateProductVariant(UUID tenantId, UUID variantId, CreateProductVariantRequest request) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Variant not found", "VARIANT_NOT_FOUND", null));

        if (request.getSku() != null && !request.getSku().equals(variant.getSku())) {
            if (productVariantRepository.findBySku(request.getSku()).isPresent()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Variant SKU already exists", "SKU_EXISTS", null);
            }
        }

        if (request.getBarcode() != null && !request.getBarcode().equals(variant.getBarcode())) {
            if (productVariantRepository.findByBarcode(request.getBarcode()).isPresent()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Variant Barcode already exists", "BARCODE_EXISTS", null);
            }
        }

        variant.setName(request.getName());
        variant.setSku(request.getSku());
        variant.setBarcode(request.getBarcode());
        variant.setPricePaise(request.getPricePaise());
        if (request.getStockQuantity() != null) {
            variant.setStockQuantity(request.getStockQuantity());
        }
        if (request.getLowStockThreshold() != null) {
            variant.setLowStockThreshold(request.getLowStockThreshold());
        }

        ProductVariant saved = productVariantRepository.save(variant);
        return mapVariantToDto(saved);
    }

    @Transactional
    public void deleteProductVariant(UUID tenantId, UUID variantId) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Variant not found", "VARIANT_NOT_FOUND", null));
        variant.setIsActive(false);
        productVariantRepository.save(variant);
    }



    private ProductDto mapToDto(Product p) {
        List<ProductVariantDto> variants = productVariantRepository.findByProductId(p.getId())
                .stream()
                .filter(v -> v.getIsActive() == null || v.getIsActive())
                .map(this::mapVariantToDto)
                .collect(Collectors.toList());

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
                .lowStockThreshold(p.getLowStockThreshold())
                .isActive(p.getIsActive())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .variants(variants)
                .build();
    }

    private ProductVariantDto mapVariantToDto(ProductVariant v) {
        return ProductVariantDto.builder()
                .id(v.getId())
                .productId(v.getProduct().getId())
                .name(v.getName())
                .sku(v.getSku())
                .barcode(v.getBarcode())
                .pricePaise(v.getPricePaise())
                .stockQuantity(v.getStockQuantity())
                .lowStockThreshold(v.getLowStockThreshold())
                .isActive(v.getIsActive())
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .build();
    }
}
