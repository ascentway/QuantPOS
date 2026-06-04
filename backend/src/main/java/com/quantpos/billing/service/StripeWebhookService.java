package com.quantpos.billing.service;

import com.quantpos.billing.model.PaymentEvent;
import com.quantpos.billing.repository.PaymentEventRepository;
import com.quantpos.tenant.model.SubscriptionStatus;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Customer;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.net.Webhook;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Handles incoming Stripe webhook events with full idempotency protection.
 *
 * <p><b>Flow:</b>
 * <ol>
 *   <li>Validate Stripe-Signature using the endpoint secret (env var only)</li>
 *   <li>Check {@code payment_events} table — if stripe_event_id exists, skip processing
 *       and return {@code true} (acknowledge to Stripe)</li>
 *   <li>Persist event as PROCESSING, route by event type, update tenant state</li>
 *   <li>Mark event SUCCESS or FAILED</li>
 * </ol>
 *
 * <p><b>Supported events:</b>
 * <ul>
 *   <li>{@code checkout.session.completed}    — activate subscription</li>
 *   <li>{@code invoice.payment_succeeded}     — refresh active status</li>
 *   <li>{@code customer.subscription.deleted} — mark subscription CANCELLED</li>
 *   <li>{@code invoice.payment_failed}        — mark subscription PAST_DUE</li>
 * </ul>
 */
@Service
@Slf4j
public class StripeWebhookService {

    /** Injected from STRIPE_WEBHOOK_SECRET environment variable — never in YAML */
    @Value("${STRIPE_WEBHOOK_SECRET:}")
    private String webhookSecret;

    private final PaymentEventRepository paymentEventRepository;
    private final TenantRepository       tenantRepository;

    public StripeWebhookService(PaymentEventRepository paymentEventRepository,
                                TenantRepository tenantRepository) {
        this.paymentEventRepository = paymentEventRepository;
        this.tenantRepository       = tenantRepository;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SIGNATURE VALIDATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Validates the Stripe-Signature header against the raw request body.
     *
     * @param payload   Raw HTTP request body bytes (MUST NOT be parsed before this)
     * @param sigHeader Value of the {@code Stripe-Signature} header
     * @return Parsed {@link Event} if valid
     * @throws SignatureVerificationException if signature is invalid
     */
    public Event validateSignature(String payload, String sigHeader)
            throws SignatureVerificationException {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("STRIPE_WEBHOOK_SECRET is not configured — rejecting all webhook requests");
            throw new SignatureVerificationException(
                "Webhook secret not configured", sigHeader);
        }
        return Webhook.constructEvent(payload, sigHeader, webhookSecret);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EVENT PROCESSING
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Processes a validated Stripe event with full idempotency protection.
     *
     * @param event          Validated Stripe Event object
     * @param rawPayload     Original JSON string for audit storage
     * @return {@code true} if the event was processed (or already processed), {@code false} on error
     */
    @Transactional
    public boolean processEvent(Event event, String rawPayload) {
        String eventId   = event.getId();
        String eventType = event.getType();

        // ── Idempotency check ─────────────────────────────────────────────
        // If we've already processed this event ID, acknowledge and skip.
        if (paymentEventRepository.existsByStripeEventId(eventId)) {
            log.info("Stripe event already processed, skipping | eventId={} type={}", eventId, eventType);
            return true;
        }
        // ─────────────────────────────────────────────────────────────────

        log.info("Processing Stripe event | eventId={} type={}", eventId, eventType);

        // Save event in PROCESSING state for audit trail
        PaymentEvent paymentEvent = PaymentEvent.builder()
            .stripeEventId(eventId)
            .stripeEventType(eventType)
            .webhookPayload(rawPayload)
            .amountCents(BigDecimal.ZERO) // updated below per event type
            .status("PROCESSING")
            .createdAt(LocalDateTime.now())
            .build();

        try {
            switch (eventType) {
                case "checkout.session.completed"    -> handleCheckoutCompleted(event, paymentEvent);
                case "invoice.payment_succeeded"     -> handleInvoiceSucceeded(event, paymentEvent);
                case "customer.subscription.deleted" -> handleSubscriptionDeleted(event, paymentEvent);
                case "invoice.payment_failed"        -> handleInvoiceFailed(event, paymentEvent);
                default -> {
                    log.debug("Unhandled Stripe event type: {}", eventType);
                    paymentEvent.setStatus("SKIPPED");
                }
            }

            paymentEvent.setProcessedAt(LocalDateTime.now());
            // Only set SUCCESS if not already marked SKIPPED
            if (!"SKIPPED".equals(paymentEvent.getStatus())) {
                paymentEvent.setStatus("SUCCESS");
            }
            paymentEventRepository.save(paymentEvent);
            return true;

        } catch (Exception e) {
            log.error("Failed to process Stripe event | eventId={} type={} error={}",
                eventId, eventType, e.getMessage(), e);
            paymentEvent.setStatus("FAILED");
            paymentEvent.setProcessedAt(LocalDateTime.now());
            paymentEventRepository.save(paymentEvent);
            return false;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE EVENT HANDLERS
    // ─────────────────────────────────────────────────────────────────────────

    private void handleCheckoutCompleted(Event event, PaymentEvent paymentEvent) {
        event.getDataObjectDeserializer().getObject().ifPresent(obj -> {
            if (obj instanceof com.stripe.model.checkout.Session session) {
                String customerId = session.getCustomer();
                String subId      = session.getSubscription();
                BigDecimal amount = session.getAmountTotal() != null
                    ? BigDecimal.valueOf(session.getAmountTotal()) : BigDecimal.ZERO;

                paymentEvent.setStripeSubscriptionId(subId);
                paymentEvent.setAmountCents(amount);
                paymentEvent.setTenant(findTenantByCustomerId(customerId).orElse(null));

                findTenantByCustomerId(customerId).ifPresent(tenant -> {
                    tenant.setStripeSubscriptionId(subId);
                    tenant.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
                    tenantRepository.save(tenant);
                    log.info("Tenant subscription activated | tenantId={} subscriptionId={}",
                        tenant.getId(), subId);
                });
            }
        });
    }

    private void handleInvoiceSucceeded(Event event, PaymentEvent paymentEvent) {
        event.getDataObjectDeserializer().getObject().ifPresent(obj -> {
            if (obj instanceof com.stripe.model.Invoice invoice) {
                String customerId = invoice.getCustomer();
                String invoiceId  = invoice.getId();
                String subId      = invoice.getSubscription();
                BigDecimal amount = invoice.getAmountPaid() != null
                    ? BigDecimal.valueOf(invoice.getAmountPaid()) : BigDecimal.ZERO;

                paymentEvent.setStripeInvoiceId(invoiceId);
                paymentEvent.setStripeSubscriptionId(subId);
                paymentEvent.setAmountCents(amount);
                paymentEvent.setTenant(findTenantByCustomerId(customerId).orElse(null));

                findTenantByCustomerId(customerId).ifPresent(tenant -> {
                    tenant.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
                    tenantRepository.save(tenant);
                    log.info("Tenant invoice paid | tenantId={} invoiceId={} amount={}",
                        tenant.getId(), invoiceId, amount);
                });
            }
        });
    }

    private void handleSubscriptionDeleted(Event event, PaymentEvent paymentEvent) {
        event.getDataObjectDeserializer().getObject().ifPresent(obj -> {
            if (obj instanceof Subscription sub) {
                String customerId = sub.getCustomer();
                paymentEvent.setStripeSubscriptionId(sub.getId());
                paymentEvent.setAmountCents(BigDecimal.ZERO);
                paymentEvent.setTenant(findTenantByCustomerId(customerId).orElse(null));

                findTenantByCustomerId(customerId).ifPresent(tenant -> {
                    tenant.setSubscriptionStatus(SubscriptionStatus.CANCELLED);
                    tenantRepository.save(tenant);
                    log.warn("Tenant subscription cancelled | tenantId={} subscriptionId={}",
                        tenant.getId(), sub.getId());
                });
            }
        });
    }

    private void handleInvoiceFailed(Event event, PaymentEvent paymentEvent) {
        event.getDataObjectDeserializer().getObject().ifPresent(obj -> {
            if (obj instanceof com.stripe.model.Invoice invoice) {
                String customerId = invoice.getCustomer();
                paymentEvent.setStripeInvoiceId(invoice.getId());
                paymentEvent.setAmountCents(BigDecimal.ZERO);
                paymentEvent.setTenant(findTenantByCustomerId(customerId).orElse(null));

                findTenantByCustomerId(customerId).ifPresent(tenant -> {
                    tenant.setSubscriptionStatus(SubscriptionStatus.PAST_DUE);
                    tenantRepository.save(tenant);
                    log.warn("Tenant invoice payment failed | tenantId={} invoiceId={}",
                        tenant.getId(), invoice.getId());
                });
            }
        });
    }

    private Optional<Tenant> findTenantByCustomerId(String stripeCustomerId) {
        if (stripeCustomerId == null || stripeCustomerId.isBlank()) {
            return Optional.empty();
        }
        return tenantRepository.findByStripeCustomerId(stripeCustomerId);
    }
}
