package com.quantpos.billing.repository;

import com.quantpos.billing.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {
    Optional<Subscription> findByTenantId(UUID tenantId);
    Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);
}
