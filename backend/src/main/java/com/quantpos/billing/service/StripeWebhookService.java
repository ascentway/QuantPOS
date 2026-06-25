package com.quantpos.billing.service;

import com.quantpos.billing.model.Invoice;
import com.quantpos.billing.model.PaymentEvent;
import com.quantpos.billing.model.Subscription;
import com.quantpos.billing.repository.InvoiceRepository;
import com.quantpos.billing.repository.PaymentEventRepository;
import com.quantpos.billing.repository.SubscriptionRepository;
import com.quantpos.tenant.model.SubscriptionStatus;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

@Service
@Slf4j
public class StripeWebhookService {

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    private final PaymentEventRepository paymentEventRepository;
    private final TenantRepository tenantRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final com.quantpos.config.StripeConfig stripeConfig;

    public StripeWebhookService(PaymentEventRepository paymentEventRepository,
            TenantRepository tenantRepository,
            SubscriptionRepository subscriptionRepository,
            InvoiceRepository invoiceRepository,
            com.quantpos.config.StripeConfig stripeConfig) {
        this.paymentEventRepository = paymentEventRepository;
        this.tenantRepository = tenantRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.invoiceRepository = invoiceRepository;
        this.stripeConfig = stripeConfig;
    }

    public Event validateSignature(String payload, String sigHeader) throws SignatureVerificationException {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("stripe.webhook-secret is not configured  rejecting all webhook requests");
            throw new SignatureVerificationException("Webhook secret not configured", sigHeader);
        }
        return Webhook.constructEvent(payload, sigHeader, webhookSecret);
    }

    @Transactional
    public boolean processEvent(Event event, String rawPayload) {
        String eventId = event.getId();
        String eventType = event.getType();

        if (paymentEventRepository.existsByStripeEventId(eventId)) {
            log.info("Stripe event already processed, skipping | eventId={} type={}", eventId, eventType);
            return true;
        }

        log.info("Processing Stripe event | eventId={} type={}", eventId, eventType);

        PaymentEvent paymentEvent = PaymentEvent.builder()
                .stripeEventId(eventId)
                .stripeEventType(eventType)
                .webhookPayload(rawPayload)
                .amountCents(BigDecimal.ZERO)
                .status("PROCESSING")
                .createdAt(LocalDateTime.now())
                .build();

        try {
            switch (eventType) {
                case "checkout.session.completed" -> handleCheckoutCompleted(event, paymentEvent);
                case "invoice.payment_succeeded" -> handleInvoiceSucceeded(event, paymentEvent);
                case "customer.subscription.deleted" -> handleSubscriptionDeleted(event, paymentEvent);
                case "customer.subscription.updated" -> handleSubscriptionUpdated(event, paymentEvent);
                case "customer.subscription.trial_will_end" -> handleTrialWillEnd(event, paymentEvent);
                case "invoice.payment_failed" -> handleInvoiceFailed(event, paymentEvent);
                default -> {
                    log.debug("Unhandled Stripe event type: {}", eventType);
                    paymentEvent.setStatus("SKIPPED");
                }
            }

            paymentEvent.setProcessedAt(LocalDateTime.now());
            if (!"SKIPPED".equals(paymentEvent.getStatus())) {
                paymentEvent.setStatus("SUCCESS");
            }
            paymentEventRepository.save(paymentEvent);
            return true;

        } catch (Exception e) {
            log.error("Failed to process Stripe event | eventId={} type={} error={}", eventId, eventType,
                    e.getMessage(), e);
            paymentEvent.setStatus("FAILED");
            paymentEvent.setProcessedAt(LocalDateTime.now());
            paymentEventRepository.save(paymentEvent);
            return false;
        }
    }

    private <T> Optional<T> extractObject(Event event, Class<T> targetClass) {
        Object obj = event.getDataObjectDeserializer().getObject().orElse(null);
        if (obj == null) {
            try {
                obj = event.getDataObjectDeserializer().deserializeUnsafe();
            } catch (Exception e) {
                log.error("Failed to deserializeUnsafe for event {}", event.getId(), e);
            }
        }
        if (targetClass.isInstance(obj)) {
            return Optional.of(targetClass.cast(obj));
        }
        return Optional.empty();
    }

    private void handleCheckoutCompleted(Event event, PaymentEvent paymentEvent) {
        extractObject(event, com.stripe.model.checkout.Session.class).ifPresent(session -> {
            String customerId = session.getCustomer();
            String subId = session.getSubscription();
            BigDecimal amount = session.getAmountTotal() != null ? BigDecimal.valueOf(session.getAmountTotal())
                    : BigDecimal.ZERO;

            paymentEvent.setStripeSubscriptionId(subId);
            paymentEvent.setAmountCents(amount);

            findTenantByCustomerId(customerId).ifPresent(tenant -> {
                paymentEvent.setTenant(tenant);

                tenant.setStripeSubscriptionId(subId);
                tenant.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
                String planType = session.getMetadata() != null ? session.getMetadata().get("plan_type") : "STARTER";
                tenant.setTerminalLimit(getTerminalLimit(planType));
                tenantRepository.save(tenant);

                try {
                    com.stripe.model.Subscription stripeSub = com.stripe.model.Subscription.retrieve(subId);
                    saveOrUpdateSubscription(tenant, stripeSub, planType);
                } catch (Exception e) {
                    log.error("Error retrieving subscription from Stripe: {}", e.getMessage(), e);
                }

                log.info("Tenant subscription activated | tenantId={} subscriptionId={}", tenant.getId(), subId);
            });
        });
    }

    private void handleInvoiceSucceeded(Event event, PaymentEvent paymentEvent) {
        extractObject(event, com.stripe.model.Invoice.class).ifPresent(invoiceObj -> {
            String customerId = invoiceObj.getCustomer();
            String invoiceId = invoiceObj.getId();
            String subId = invoiceObj.getSubscription();
            BigDecimal amount = invoiceObj.getAmountPaid() != null ? BigDecimal.valueOf(invoiceObj.getAmountPaid())
                    : BigDecimal.ZERO;

            paymentEvent.setStripeInvoiceId(invoiceId);
            paymentEvent.setStripeSubscriptionId(subId);
            paymentEvent.setAmountCents(amount);

            findTenantByCustomerId(customerId).ifPresent(tenant -> {
                paymentEvent.setTenant(tenant);
                tenant.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
                tenantRepository.save(tenant);

                saveInvoice(tenant, invoiceObj, "PAID");

                log.info("Tenant invoice paid | tenantId={} invoiceId={} amount={}", tenant.getId(), invoiceId, amount);
            });
        });
    }

    private void handleSubscriptionDeleted(Event event, PaymentEvent paymentEvent) {
        extractObject(event, com.stripe.model.Subscription.class).ifPresent(sub -> {
            String customerId = sub.getCustomer();
            paymentEvent.setStripeSubscriptionId(sub.getId());
            paymentEvent.setAmountCents(BigDecimal.ZERO);

            findTenantByCustomerId(customerId).ifPresent(tenant -> {
                paymentEvent.setTenant(tenant);
                tenant.setSubscriptionStatus(SubscriptionStatus.CANCELLED);
                tenantRepository.save(tenant);

                Subscription subscription = subscriptionRepository.findByStripeSubscriptionId(sub.getId()).orElse(null);
                if (subscription != null) {
                    subscription.setStatus(SubscriptionStatus.CANCELLED);
                    subscription.setCancelledAt(LocalDateTime.now());
                    subscriptionRepository.save(subscription);
                }

                log.warn("Tenant subscription cancelled | tenantId={} subscriptionId={}", tenant.getId(), sub.getId());
            });
        });
    }

    private void handleSubscriptionUpdated(Event event, PaymentEvent paymentEvent) {
        extractObject(event, com.stripe.model.Subscription.class).ifPresent(sub -> {
            String customerId = sub.getCustomer();
            paymentEvent.setStripeSubscriptionId(sub.getId());
            paymentEvent.setAmountCents(BigDecimal.ZERO);

            findTenantByCustomerId(customerId).ifPresent(tenant -> {
                paymentEvent.setTenant(tenant);

                Subscription subscription = subscriptionRepository.findByStripeSubscriptionId(sub.getId()).orElse(null);
                if (subscription != null) {
                    subscription.setCancelAtPeriodEnd(
                            sub.getCancelAtPeriodEnd() != null ? sub.getCancelAtPeriodEnd() : false);
                    if (Boolean.TRUE.equals(sub.getCancelAtPeriodEnd())) {
                        subscription.setCancellationReason("Cancelled via Stripe Portal");
                    } else {
                        subscription.setCancellationReason(null);
                    }

                    // We extract the new period end/start
                    if (sub.getCurrentPeriodStart() != null) {
                        subscription.setCurrentPeriodStart(
                                LocalDate.ofInstant(java.time.Instant.ofEpochSecond(sub.getCurrentPeriodStart()),
                                        java.time.ZoneId.systemDefault()));
                    }
                    if (sub.getCurrentPeriodEnd() != null) {
                        subscription.setCurrentPeriodEnd(
                                LocalDate.ofInstant(java.time.Instant.ofEpochSecond(sub.getCurrentPeriodEnd()),
                                        java.time.ZoneId.systemDefault()));
                        subscription.setNextBillingDate(subscription.getCurrentPeriodEnd());
                    }
                    if (sub.getTrialStart() != null) {
                        subscription
                                .setTrialStart(LocalDate.ofInstant(java.time.Instant.ofEpochSecond(sub.getTrialStart()),
                                        java.time.ZoneId.systemDefault()));
                    }
                    if (sub.getTrialEnd() != null) {
                        subscription.setTrialEnd(LocalDate.ofInstant(java.time.Instant.ofEpochSecond(sub.getTrialEnd()),
                                java.time.ZoneId.systemDefault()));
                    }

                    // We also update plan details if they upgraded/downgraded
                    if (sub.getItems() != null && sub.getItems().getData() != null
                            && !sub.getItems().getData().isEmpty()) {
                        com.stripe.model.SubscriptionItem item = sub.getItems().getData().get(0);
                        if (item.getPrice() != null && item.getPrice().getId() != null) {
                            String priceId = item.getPrice().getId();
                            subscription.setStripePriceId(priceId);

                            // Map the stripe price id back to our internal planType
                            String resolvedPlan = resolvePlanTypeFromPriceId(priceId);
                            if (resolvedPlan != null) {
                                subscription.setPlanType(resolvedPlan);
                                subscription.setPlanName(resolvedPlan + " Plan");
                                int newLimit = getTerminalLimit(resolvedPlan);
                                subscription.setTerminalLimit(newLimit);

                                tenant.setTerminalLimit(newLimit);
                                tenantRepository.save(tenant);
                            }

                            // update monthlyPrice if available
                            if (item.getPrice().getUnitAmount() != null) {
                                subscription.setMonthlyPrice(BigDecimal.valueOf(item.getPrice().getUnitAmount())
                                        .divide(BigDecimal.valueOf(100)));
                            }
                        }
                    }

                    subscriptionRepository.save(subscription);
                    log.info("Tenant subscription updated | tenantId={} subscriptionId={} cancelAtPeriodEnd={}",
                            tenant.getId(), sub.getId(), sub.getCancelAtPeriodEnd());
                }
            });
        });
    }

    private void handleInvoiceFailed(Event event, PaymentEvent paymentEvent) {
        extractObject(event, com.stripe.model.Invoice.class).ifPresent(invoiceObj -> {
            String customerId = invoiceObj.getCustomer();
            paymentEvent.setStripeInvoiceId(invoiceObj.getId());
            paymentEvent.setAmountCents(BigDecimal.ZERO);

            findTenantByCustomerId(customerId).ifPresent(tenant -> {
                paymentEvent.setTenant(tenant);
                tenant.setSubscriptionStatus(SubscriptionStatus.PAST_DUE);
                tenantRepository.save(tenant);

                saveInvoice(tenant, invoiceObj, "FAILED");

                log.warn("Tenant invoice payment failed | tenantId={} invoiceId={}", tenant.getId(),
                        invoiceObj.getId());
            });
        });
    }

    private Optional<Tenant> findTenantByCustomerId(String stripeCustomerId) {
        if (stripeCustomerId == null || stripeCustomerId.isBlank()) {
            return Optional.empty();
        }
        return tenantRepository.findByStripeCustomerId(stripeCustomerId);
    }

    private int getTerminalLimit(String planType) {
        if (planType == null)
            return 1;
        return switch (planType.toUpperCase()) {
            case "GROWTH" -> 3;
            case "PROFESSIONAL" -> 5;
            case "ENTERPRISE" -> 10;
            default -> 1; // STARTER
        };
    }

    private void saveOrUpdateSubscription(Tenant tenant, com.stripe.model.Subscription stripeSub,
            String providedPlanType) {
        Subscription subscription = subscriptionRepository.findByTenantId(tenant.getId())
                .orElse(Subscription.builder().tenant(tenant).build());

        subscription.setStripeCustomerId(stripeSub.getCustomer());
        subscription.setStripeSubscriptionId(stripeSub.getId());
        subscription.setStripePriceId(stripeSub.getItems().getData().get(0).getPrice().getId());

        if (providedPlanType != null) {
            subscription.setPlanType(providedPlanType);
            subscription.setPlanName(providedPlanType + " Plan");
            subscription.setTerminalLimit(getTerminalLimit(providedPlanType));
        }

        BigDecimal priceCents = BigDecimal.valueOf(stripeSub.getItems().getData().get(0).getPrice().getUnitAmount());
        subscription.setMonthlyPrice(priceCents.divide(BigDecimal.valueOf(100)));
        subscription.setCurrency(stripeSub.getCurrency().toUpperCase());

        subscription.setCurrentPeriodStart(
                LocalDate.ofInstant(Instant.ofEpochSecond(stripeSub.getCurrentPeriodStart()), ZoneId.systemDefault()));
        subscription.setCurrentPeriodEnd(
                LocalDate.ofInstant(Instant.ofEpochSecond(stripeSub.getCurrentPeriodEnd()), ZoneId.systemDefault()));

        String stripeStatus = stripeSub.getStatus().toUpperCase();
        SubscriptionStatus mappedStatus = SubscriptionStatus.INACTIVE;
        if (stripeStatus.equals("ACTIVE"))
            mappedStatus = SubscriptionStatus.ACTIVE;
        else if (stripeStatus.equals("PAST_DUE"))
            mappedStatus = SubscriptionStatus.PAST_DUE;
        else if (stripeStatus.equals("CANCELED") || stripeStatus.equals("CANCELLED"))
            mappedStatus = SubscriptionStatus.CANCELLED;

        subscription.setStatus(mappedStatus);

        subscription.setCancelAtPeriodEnd(stripeSub.getCancelAtPeriodEnd());

        if (stripeSub.getTrialStart() != null) {
            subscription.setTrialStart(
                    LocalDate.ofInstant(Instant.ofEpochSecond(stripeSub.getTrialStart()), ZoneId.systemDefault()));
        }
        if (stripeSub.getTrialEnd() != null) {
            subscription.setTrialEnd(
                    LocalDate.ofInstant(Instant.ofEpochSecond(stripeSub.getTrialEnd()), ZoneId.systemDefault()));
        }

        subscriptionRepository.save(subscription);
    }

    private void saveInvoice(Tenant tenant, com.stripe.model.Invoice stripeInvoice, String status) {
        BigDecimal amountDue = stripeInvoice.getAmountDue() != null
                ? BigDecimal.valueOf(stripeInvoice.getAmountDue()).divide(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
        BigDecimal amountPaid = stripeInvoice.getAmountPaid() != null
                ? BigDecimal.valueOf(stripeInvoice.getAmountPaid()).divide(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;

        Invoice invoice = Invoice.builder()
                .tenant(tenant)
                .stripeInvoiceId(stripeInvoice.getId())
                .stripeSubscriptionId(stripeInvoice.getSubscription())
                .invoiceNumber(stripeInvoice.getNumber())
                .amountDue(amountDue)
                .amountPaid(amountPaid)
                .currency(stripeInvoice.getCurrency().toUpperCase())
                .invoiceDate(stripeInvoice.getCreated() != null
                        ? LocalDate.ofInstant(Instant.ofEpochSecond(stripeInvoice.getCreated()), ZoneId.systemDefault())
                        : null)
                .dueDate(stripeInvoice.getDueDate() != null
                        ? LocalDate.ofInstant(Instant.ofEpochSecond(stripeInvoice.getDueDate()), ZoneId.systemDefault())
                        : null)
                .status(status)
                .invoicePdfUrl(stripeInvoice.getInvoicePdf())
                .build();

        if ("PAID".equals(status)) {
            invoice.setPaidAt(LocalDateTime.now());
        }

        invoiceRepository.save(invoice);
    }

    private void handleTrialWillEnd(Event event, PaymentEvent paymentEvent) {
        extractObject(event, com.stripe.model.Subscription.class).ifPresent(sub -> {
            String customerId = sub.getCustomer();
            paymentEvent.setStripeSubscriptionId(sub.getId());
            paymentEvent.setAmountCents(BigDecimal.ZERO);

            findTenantByCustomerId(customerId).ifPresent(tenant -> {
                paymentEvent.setTenant(tenant);
                log.info("Tenant subscription trial will end soon | tenantId={} subscriptionId={}", tenant.getId(),
                        sub.getId());
            });
        });
    }

    private String resolvePlanTypeFromPriceId(String priceId) {
        if (priceId == null)
            return null;
        if (priceId.equals(stripeConfig.getStarterPriceMonthly())
                || priceId.equals(stripeConfig.getStarterPriceYearly())) {
            return "STARTER";
        }
        if (priceId.equals(stripeConfig.getGrowthPriceMonthly())
                || priceId.equals(stripeConfig.getGrowthPriceYearly())) {
            return "GROWTH";
        }
        if (priceId.equals(stripeConfig.getProfessionalPriceMonthly())
                || priceId.equals(stripeConfig.getProfessionalPriceYearly())) {
            return "PROFESSIONAL";
        }
        if (priceId.equals(stripeConfig.getEnterprisePriceMonthly())
                || priceId.equals(stripeConfig.getEnterprisePriceYearly())) {
            return "ENTERPRISE";
        }
        return null;
    }
}
