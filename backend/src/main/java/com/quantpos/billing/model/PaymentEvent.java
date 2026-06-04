package com.quantpos.billing.model;

import com.quantpos.tenant.model.Tenant;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Persists every Stripe webhook event for idempotency and audit.
 *
 * <p>Maps to the {@code payment_events} table created in V4 migration.
 * The {@code stripeEventId} column has a DB-level UNIQUE constraint —
 * this is the first guard against duplicate processing.
 */
@Entity
@Table(name = "payment_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentEvent {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "stripe_event_id", nullable = false, unique = true, length = 255)
    private String stripeEventId;

    @Column(name = "stripe_event_type", length = 100)
    private String stripeEventType;

    @Column(name = "stripe_subscription_id", length = 255)
    private String stripeSubscriptionId;

    @Column(name = "stripe_invoice_id", length = 255)
    private String stripeInvoiceId;

    @Column(name = "amount_cents", nullable = false)
    private BigDecimal amountCents;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "USD";

    @Column(name = "status", length = 50)
    private String status; // PROCESSING, SUCCESS, FAILED, SKIPPED

    @Column(name = "webhook_payload", columnDefinition = "jsonb", nullable = false)
    @JdbcTypeCode(SqlTypes.JSON)
    private String webhookPayload;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "idempotency_key", length = 255)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
