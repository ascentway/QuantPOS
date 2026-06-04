package com.quantpos.billing.repository;

import com.quantpos.billing.model.PaymentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

/**
 * Repository for idempotency lookups on Stripe webhook events.
 */
@Repository
public interface PaymentEventRepository extends JpaRepository<PaymentEvent, UUID> {

    /**
     * Fast idempotency check. The underlying column has a DB UNIQUE constraint
     * and an index ({@code idx_payment_events_stripe_id}) for O(log n) lookup.
     */
    boolean existsByStripeEventId(String stripeEventId);
}
