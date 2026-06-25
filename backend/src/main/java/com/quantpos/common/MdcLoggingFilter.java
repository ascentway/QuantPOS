package com.quantpos.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * First-in-chain filter that assigns a unique requestId to every HTTP request
 * and populates the SLF4J Mapped Diagnostic Context (MDC).
 *
 * <p>
 * MDC keys populated:
 * <ul>
 * <li>{@code requestId} UUID, either taken from incoming X-Request-ID header or
 * freshly generated</li>
 * <li>{@code method} HTTP method (GET, POST, …)</li>
 * <li>{@code path} Request URI</li>
 * </ul>
 *
 * <p>
 * Additional MDC keys ({@code userId}, {@code tenantId}) are set later by
 * {@link com.quantpos.auth.security.JwtFilter} once the JWT is validated.
 *
 * <p>
 * The requestId is echoed back in the {@code X-Request-ID} response header so
 * the frontend/API client can correlate frontend logs with backend traces.
 *
 * <p>
 * MDC is always cleared in the {@code finally} block to prevent ThreadLocal
 * leaks.
 */
@Component
@Order(1) // Must run BEFORE RateLimitFilter and JwtFilter
public class MdcLoggingFilter extends OncePerRequestFilter {

    public static final String REQUEST_ID_HEADER = "X-Request-ID";

    // MDC key constants used by JwtFilter too
    public static final String MDC_REQUEST_ID = "requestId";
    public static final String MDC_USER_ID = "userId";
    public static final String MDC_TENANT_ID = "tenantId";
    public static final String MDC_METHOD = "method";
    public static final String MDC_PATH = "path";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        try {
            // ── Resolve or generate Request ID ─────────────────────────────
            String requestId = request.getHeader(REQUEST_ID_HEADER);
            if (requestId == null || requestId.isBlank()) {
                requestId = UUID.randomUUID().toString();
            }

            // ── Populate MDC ────────────────────────────────────────────────
            MDC.put(MDC_REQUEST_ID, requestId);
            MDC.put(MDC_METHOD, request.getMethod());
            MDC.put(MDC_PATH, request.getRequestURI());

            // Echo the requestId back to the client for correlation
            response.setHeader(REQUEST_ID_HEADER, requestId);

            filterChain.doFilter(request, response);

        } finally {
            // Always clean up MDC keys set by JwtFilter are also cleared here
            // because JwtFilter runs after this filter in the same thread
            MDC.clear();
        }
    }
}
