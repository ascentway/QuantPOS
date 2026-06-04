package com.quantpos.billing.controller;

import com.quantpos.billing.service.StripeWebhookService;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Receives and processes Stripe webhook events.
 *
 * <p><b>IMPORTANT:</b> The raw request body MUST be read as a String before any
 * Jackson deserialization, because Stripe's signature verification requires the
 * exact original byte sequence. Spring's {@code @RequestBody String} achieves this.
 *
 * <p>Endpoint: {@code POST /api/webhooks/stripe}
 * <br>Security: Public (permit-all in SecurityConfig) — protected by Stripe signature.
 */
@RestController
@RequestMapping("/api/webhooks")
@Slf4j
public class StripeWebhookController {

    private final StripeWebhookService webhookService;

    public StripeWebhookController(StripeWebhookService webhookService) {
        this.webhookService = webhookService;
    }

    /**
     * Entry point for all Stripe webhook events.
     *
     * <p>Flow:
     * <ol>
     *   <li>Validate Stripe-Signature — reject with 403 on failure</li>
     *   <li>Delegate to StripeWebhookService which handles idempotency + routing</li>
     *   <li>Return 200 OK to acknowledge receipt (Stripe retries on non-2xx)</li>
     * </ol>
     *
     * @param payload   Raw JSON body (NOT parsed — required for signature verification)
     * @param sigHeader Value of the {@code Stripe-Signature} header
     */
    @PostMapping("/stripe")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {

        // ── Step 1: Cryptographic signature validation ──────────────────
        Event event;
        try {
            event = webhookService.validateSignature(payload, sigHeader);
        } catch (SignatureVerificationException e) {
            log.warn("Stripe webhook signature verification FAILED | error={}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("{\"error\":\"Invalid Stripe signature\"}");
        }

        // ── Step 2: Idempotent event processing ─────────────────────────
        boolean processed = webhookService.processEvent(event, payload);

        // ── Step 3: Acknowledge receipt to Stripe ────────────────────────
        // Always return 200 even on processing errors — Stripe would otherwise
        // retry indefinitely. Internal failures are logged and tracked in DB.
        if (processed) {
            return ResponseEntity.ok("{\"received\":true}");
        } else {
            // 200 to prevent Stripe retry — error is logged and tracked internally
            return ResponseEntity.ok("{\"received\":true,\"warning\":\"processing_error\"}");
        }
    }
}
