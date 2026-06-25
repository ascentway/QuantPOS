package com.quantpos.inventory.model;

import com.quantpos.tenant.model.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.ParamDef;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "products")
@Getter
@Setter
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Product {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    private String name;
    private String sku;
    private String barcode;
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "product_type", columnDefinition = "product_type")
    private ProductType productType;

    @Column(name = "price_paise")
    private Long pricePaise;

    @Column(name = "cost_paise")
    private Long costPaise;

    @Column(name = "hsn_code")
    private String hsnCode;

    @Column(name = "gst_rate")
    private BigDecimal gstRate;

    @Column(name = "gst_inclusive")
    private Boolean gstInclusive;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit_type")
    private UnitType unitType;

    @Column(name = "price_per_unit_paise")
    private Long pricePerUnitPaise;

    @Column(name = "stock_quantity")
    private BigDecimal stockQuantity;

    @Column(name = "minimum_loose_quantity")
    private BigDecimal minimumLooseQuantity;

    @Column(name = "low_stock_threshold")
    private BigDecimal lowStockThreshold;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
