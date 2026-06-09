package com.quantpos.billing.controller;

import com.quantpos.billing.service.BillingService;
import com.quantpos.multitenancy.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/billing")
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billingService;

    @PostMapping("/checkout-session")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, String>> createCheckoutSession(@RequestBody Map<String, String> request) {
        String planType = request.get("planType");
        String billingCycle = request.getOrDefault("billingCycle", "MONTHLY");
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(billingService.createCheckoutSession(tenantId, planType, billingCycle));
    }

    @PostMapping("/portal-session")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, String>> createPortalSession() {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(billingService.createPortalSession(tenantId));
    }

    @GetMapping("/status")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<Map<String, Object>> getBillingStatus() {
        UUID tenantId = TenantContext.getTenantId();
        return ResponseEntity.ok(billingService.getBillingStatus(tenantId));
    }
}
