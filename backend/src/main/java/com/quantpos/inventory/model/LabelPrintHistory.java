package com.quantpos.inventory.model;

import com.quantpos.tenant.model.Tenant;
import com.quantpos.user.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "label_print_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class LabelPrintHistory {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tenant_id")
    private Tenant tenant;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Product product;

    @ManyToOne
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "sku", nullable = false)
    private String sku;

    @Column(name = "barcode", nullable = false)
    private String barcode;

    @Column(name = "weight", precision = 15, scale = 3)
    private BigDecimal weight;

    @Column(name = "unit_type", nullable = false)
    private String unitType;

    @Column(name = "price", nullable = false, precision = 15, scale = 2)
    private BigDecimal price;

    @Column(name = "printed_at")
    private LocalDateTime printedAt;

    @PrePersist
    public void prePersist() {
        if (printedAt == null) {
            printedAt = LocalDateTime.now();
        }
    }
}
