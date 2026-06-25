package com.quantpos.auth.security;

import com.quantpos.common.MdcLoggingFilter;
import com.quantpos.common.RedisService;
import com.quantpos.multitenancy.TenantContext;
import com.quantpos.multitenancy.TenantFilterActivator;
import com.quantpos.user.model.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * JWT authentication filter runs on every request after MdcLoggingFilter.
 *
 * <p>
 * Responsibilities:
 * <ol>
 * <li>Extract Bearer token from Authorization header</li>
 * <li>Validate signature and expiry via JwtProvider</li>
 * <li>Check session-invalidation timestamp ("invalidate_before:{userId}")</li>
 * <li>Populate Spring SecurityContext</li>
 * <li>Set TenantContext (ThreadLocal) for downstream components</li>
 * <li>Enable Hibernate tenant filter via TenantFilterActivator
 * (SUPER_ADMIN bypasses the filter)</li>
 * <li>Enrich MDC with userId and tenantId for structured logging</li>
 * </ol>
 *
 * <p>
 * <b>Cleanup:</b> TenantContext is cleared in the {@code finally} block.
 * Hibernate filter is also disabled in {@code finally}.
 * MDC is cleared by MdcLoggingFilter which wraps this filter's execution.
 */
@Component
@Slf4j
public class JwtFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;
    private final UserDetailsServiceImpl userDetailsService;
    private final RedisService redisService;
    private final TenantFilterActivator tenantFilterActivator;

    public JwtFilter(JwtProvider jwtProvider,
            UserDetailsServiceImpl userDetailsService,
            RedisService redisService,
            TenantFilterActivator tenantFilterActivator) {
        this.jwtProvider = jwtProvider;
        this.userDetailsService = userDetailsService;
        this.redisService = redisService;
        this.tenantFilterActivator = tenantFilterActivator;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        boolean filterEnabled = false;

        try {
            String token = getJwtFromRequest(request);

            if (StringUtils.hasText(token) && jwtProvider.validateToken(token)) {
                String email = jwtProvider.extractEmail(token);
                UUID tenantId = jwtProvider.extractTenantId(token);
                UUID userId = jwtProvider.extractUserId(token);
                String roleStr = jwtProvider.extractRole(token);

                // ── Session invalidation check ──────────────────────────────
                long tokenIssuedAt = jwtProvider.extractIssuedAt(token);
                long invalidateBefore = redisService.get("invalidate_before:" + userId)
                        .map(Long::parseLong).orElse(0L);

                if (tokenIssuedAt < invalidateBefore) {
                    log.warn("Rejected pre-invalidation token | userId={} issuedAt={} invalidateBefore={}",
                            userId, tokenIssuedAt, invalidateBefore);
                    filterChain.doFilter(request, response);
                    return;
                }
                // ───────────────────────────────────────────────────────────

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                // ── Tenant isolation ────────────────────────────────────────
                TenantContext.setTenantId(tenantId);

                // ── Hibernate filter (SUPER_ADMIN bypasses) ─────────────────
                Role role = parseRole(roleStr);
                tenantFilterActivator.enableForSession(tenantId, role);
                filterEnabled = true;

                // ── MDC enrichment ──────────────────────────────────────────
                MDC.put(MdcLoggingFilter.MDC_USER_ID, userId.toString());
                MDC.put(MdcLoggingFilter.MDC_TENANT_ID, tenantId.toString());
            }

            filterChain.doFilter(request, response);

        } finally {
            // Always clean up to prevent ThreadLocal bleed between Tomcat thread recycling
            TenantContext.clear();
            if (filterEnabled) {
                tenantFilterActivator.disableForSession();
            }
            // MDC is cleared by MdcLoggingFilter which wraps this filter
        }
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    private Role parseRole(String roleStr) {
        try {
            return roleStr != null ? Role.valueOf(roleStr) : Role.CASHIER;
        } catch (IllegalArgumentException e) {
            return Role.CASHIER;
        }
    }
}
