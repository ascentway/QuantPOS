package com.quantpos.inventory.repository;

import com.quantpos.inventory.model.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductVariantRepository extends JpaRepository<ProductVariant, UUID> {
    Optional<ProductVariant> findByBarcode(String barcode);
    Optional<ProductVariant> findBySku(String sku);
    java.util.List<ProductVariant> findByProductId(UUID productId);
}
