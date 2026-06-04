package com.quantpos.auth.security;

import com.quantpos.common.RedisService;
import com.quantpos.multitenancy.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtProvider          jwtProvider;
    private final UserDetailsServiceImpl userDetailsService;
    private final RedisService         redisService;

    public JwtFilter(JwtProvider jwtProvider, UserDetailsServiceImpl userDetailsService,
                     RedisService redisService) {
        this.jwtProvider      = jwtProvider;
        this.userDetailsService = userDetailsService;
        this.redisService     = redisService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = getJwtFromRequest(request);

            if (StringUtils.hasText(token) && jwtProvider.validateToken(token)) {
                String email    = jwtProvider.extractEmail(token);
                UUID   tenantId = jwtProvider.extractTenantId(token);
                UUID   userId   = jwtProvider.extractUserId(token);

                // ── Session invalidation check ──────────────────────────────────
                // If password was changed/reset after this token was issued, reject it.
                long tokenIssuedAt     = jwtProvider.extractIssuedAt(token);
                long invalidateBefore  = redisService.get("invalidate_before:" + userId)
                        .map(Long::parseLong).orElse(0L);

                if (tokenIssuedAt < invalidateBefore) {
                    // Token pre-dates the last password change — treat as expired
                    filterChain.doFilter(request, response);
                    return;
                }
                // ────────────────────────────────────────────────────────────────

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                // Set tenant context for multi-tenancy (cleared in finally block)
                TenantContext.setTenantId(tenantId);
            }

            filterChain.doFilter(request, response);

        } finally {
            // Always clear to prevent ThreadLocal bleed between requests
            TenantContext.clear();
        }
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
