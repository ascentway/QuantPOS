package com.quantpos.billing.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantpos.common.ApiResponse;
import com.quantpos.multitenancy.TenantContext;
import com.quantpos.tenant.model.SubscriptionStatus;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class SubscriptionInterceptor implements HandlerInterceptor {

    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        RequiresActiveSubscription requiresSubscription = handlerMethod.getMethodAnnotation(RequiresActiveSubscription.class);
        if (requiresSubscription == null) {
            requiresSubscription = handlerMethod.getBeanType().getAnnotation(RequiresActiveSubscription.class);
        }

        if (requiresSubscription != null) {
            UUID tenantId = TenantContext.getTenantId();
            if (tenantId == null) {
                sendPaymentRequired(response, "No active tenant context found.");
                return false;
            }

            Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
            if (tenant == null || tenant.getSubscriptionStatus() != SubscriptionStatus.ACTIVE) {
                sendPaymentRequired(response, "An active subscription is required to access this feature.");
                return false;
            }
        }

        return true;
    }

    private void sendPaymentRequired(HttpServletResponse response, String message) throws Exception {
        response.setStatus(HttpStatus.PAYMENT_REQUIRED.value());
        response.setContentType("application/json");
        ApiResponse<?> apiResponse = ApiResponse.error(message, "PAYMENT_REQUIRED", null);
        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
    }
}
