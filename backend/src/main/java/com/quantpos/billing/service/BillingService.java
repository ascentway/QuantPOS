package com.quantpos.billing.service;

import com.quantpos.billing.model.Subscription;
import com.quantpos.billing.model.Invoice;
import com.quantpos.billing.repository.SubscriptionRepository;
import com.quantpos.billing.repository.InvoiceRepository;
import com.quantpos.config.StripeConfig;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import com.quantpos.terminal.repository.TerminalRepository;
import com.quantpos.common.ApiException;
import com.stripe.exception.StripeException;
import com.stripe.model.Customer;
import com.stripe.model.checkout.Session;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.checkout.SessionCreateParams;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BillingService {

    private final TenantRepository tenantRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final InvoiceRepository invoiceRepository;
    private final TerminalRepository terminalRepository;
    private final StripeConfig stripeConfig;

    @Value("${app.base-url:http://localhost:3000}")
    private String appBaseUrl;

    @Transactional
    public Map<String, String> createCheckoutSession(UUID tenantId, String planType, String billingCycle) {
        try {
            Tenant tenant = tenantRepository.findById(tenantId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found", "TENANT_NOT_FOUND", null));

            String priceId = getPriceIdForPlan(planType, billingCycle);
            if (priceId == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid plan type: " + planType, "INVALID_PLAN", null);
            }

            // Create Stripe Customer if needed
            String customerId = tenant.getStripeCustomerId();
            if (customerId == null || customerId.isBlank()) {
                CustomerCreateParams customerParams = CustomerCreateParams.builder()
                        .setName(tenant.getBusinessName())
                        .setEmail(tenant.getPhoneNumber() + "@quantpos.temp") // Placeholder email if not available
                        .putMetadata("tenant_id", tenant.getId().toString())
                        .build();

                Customer customer = Customer.create(customerParams);
                customerId = customer.getId();

                tenant.setStripeCustomerId(customerId);
                tenantRepository.save(tenant);
            }

            SessionCreateParams params = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                    .setCustomer(customerId)
                    .addLineItem(
                            SessionCreateParams.LineItem.builder()
                                    .setPrice(priceId)
                                    .setQuantity(1L)
                                    .build()
                    )
                    .setSubscriptionData(
                            SessionCreateParams.SubscriptionData.builder()
                                    .setTrialPeriodDays(14L)
                                    .build()
                    )
                    .putMetadata("tenant_id", tenant.getId().toString())
                    .putMetadata("plan_type", planType.toUpperCase())
                    .putMetadata("billing_cycle", billingCycle.toUpperCase())
                    .setSuccessUrl(appBaseUrl + "/dashboard/settings?checkout=success")
                    .setCancelUrl(appBaseUrl + "/dashboard/settings?checkout=cancelled")
                    .build();

            Session session = Session.create(params);

            return Map.of("url", session.getUrl());
        } catch (StripeException e) {
            log.error("Stripe error creating checkout session", e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Error communicating with payment gateway", "STRIPE_ERROR", e.getMessage());
        }
    }

    public Map<String, String> createPortalSession(UUID tenantId) {
        try {
            Tenant tenant = tenantRepository.findById(tenantId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found", "TENANT_NOT_FOUND", null));

            String customerId = tenant.getStripeCustomerId();
            if (customerId == null || customerId.isBlank()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "No billing profile found for this tenant", "NO_BILLING_PROFILE", null);
            }

            com.stripe.param.billingportal.SessionCreateParams params = com.stripe.param.billingportal.SessionCreateParams.builder()
                    .setCustomer(customerId)
                    .setReturnUrl(appBaseUrl + "/dashboard/settings")
                    .build();

            com.stripe.model.billingportal.Session portalSession = com.stripe.model.billingportal.Session.create(params);

            return Map.of("url", portalSession.getUrl());
        } catch (StripeException e) {
            log.error("Stripe error creating portal session", e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Error communicating with payment gateway", "STRIPE_ERROR", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getBillingStatus(UUID tenantId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found", "TENANT_NOT_FOUND", null));

        Subscription subscription = subscriptionRepository.findByTenantId(tenantId).orElse(null);
        List<Invoice> invoices = invoiceRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId);
        long activeTerminals = terminalRepository.countByTenantIdAndIsActiveTrue(tenantId);

        Map<String, Object> status = new HashMap<>();
        status.put("subscriptionStatus", tenant.getSubscriptionStatus().name());
        status.put("terminalLimit", tenant.getTerminalLimit());
        status.put("activeTerminals", activeTerminals);

        if (subscription != null) {
            status.put("planType", subscription.getPlanType());
            status.put("planName", subscription.getPlanName());
            status.put("monthlyPrice", subscription.getMonthlyPrice());
            status.put("currency", subscription.getCurrency());
            status.put("currentPeriodStart", subscription.getCurrentPeriodStart());
            status.put("currentPeriodEnd", subscription.getCurrentPeriodEnd());
            status.put("nextBillingDate", subscription.getNextBillingDate());
            status.put("cancelAtPeriodEnd", subscription.isCancelAtPeriodEnd());
        }

        status.put("invoices", invoices);

        return status;
    }

    private String getPriceIdForPlan(String planType, String billingCycle) {
        if (planType == null) return null;
        boolean isYearly = "YEARLY".equalsIgnoreCase(billingCycle);
        
        return switch (planType.toUpperCase()) {
            case "STARTER" -> isYearly ? stripeConfig.getStarterPriceYearly() : stripeConfig.getStarterPriceMonthly();
            case "GROWTH" -> isYearly ? stripeConfig.getGrowthPriceYearly() : stripeConfig.getGrowthPriceMonthly();
            case "PROFESSIONAL" -> isYearly ? stripeConfig.getProfessionalPriceYearly() : stripeConfig.getProfessionalPriceMonthly();
            case "ENTERPRISE" -> isYearly ? stripeConfig.getEnterprisePriceYearly() : stripeConfig.getEnterprisePriceMonthly();
            default -> null;
        };
    }
}
