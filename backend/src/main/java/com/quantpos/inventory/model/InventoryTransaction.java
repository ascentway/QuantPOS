package com.quantpos.inventory.model;

import com.quantpos.tenant.model.Tenant;
import com.quantpos.user.model.User;
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
@Table(name = "inventory_transactions")
@Getter
@Setter
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class InventoryTransaction {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "transaction_type", columnDefinition = "inventory_transaction_type")
    private InventoryTransactionType transactionType;

    @Column(name = "quantity_change")
    private BigDecimal quantityChange;

    @Column(name = "is_negative_stock_warning")
    private Boolean isNegativeStockWarning = false;

    @Enumerated(EnumType.STRING)
    private TransactionStatus status;

    @ManyToOne
    @JoinColumn(name = "approved_by_user_id")
    private User approvedByUser;

    private String unit;
    private String reason;

    @Column(name = "reference_id")
    private UUID referenceId;

    @Column(name = "reference_type")
    private String referenceType;

    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdByUser;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
