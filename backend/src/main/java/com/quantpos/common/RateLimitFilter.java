package com.quantpos.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

/**
 * IP-based sliding-window rate limiter for sensitive auth endpoints.
 *
 * <p>
 * Uses Redis INCR + EXPIRE (already implemented in RedisService.increment).
 * The TTL is set on first write (window start); subsequent increments within
 * the
 * same window do NOT reset the timer giving a true fixed-window counter.
 *
 * <p>
 * Redis key format: rate_limit:{ip}:{endpoint_slug} → count (TTL = window
 * seconds)
 *
 * <p>
 * Rate matrix (applies to ALL profiles including dev):
 * <ul>
 * <li>POST /api/auth/login → 10 req / 60 s per IP</li>
 * <li>POST /api/auth/register → 5 req / 60 s per IP</li>
 * <li>POST /api/auth/forgot-password → 5 req / 60 s per IP</li>
 * </ul>
 */
@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    // endpoint slug → (limit, window-seconds)
    private static final Map<String, long[]> RATE_MATRIX = Map.of(
            "/api/auth/login", new long[] { 10, 60 },
            "/api/auth/register", new long[] { 5, 60 },
            "/api/auth/forgot-password", new long[] { 5, 60 });

    private final RedisService redisService;

    public RateLimitFilter(RedisService redisService) {
        this.redisService = redisService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Only rate-limit POST requests to configured endpoints
        if ("POST".equalsIgnoreCase(method) && RATE_MATRIX.containsKey(path)) {

            String clientIp = request.getRemoteAddr();
            String slug = path.replace("/api/auth/", "").replace("-", "_");
            String key = "rate_limit:" + clientIp + ":" + slug;

            long[] config = RATE_MATRIX.get(path);
            long limit = config[0];
            long window = config[1];

            long count = redisService.increment(key, window);

            if (count > limit) {
                long retryAfter = redisService.getExpire(key);
                log.warn("Rate limit exceeded | ip={} path={} count={} limit={} requestId={}",
                        clientIp, path, count, limit, MDC.get("requestId"));

                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setHeader("Retry-After", String.valueOf(Math.max(retryAfter, 1)));
                response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
                response.setHeader("X-RateLimit-Remaining", "0");
                response.setHeader("X-RateLimit-Reset", String.valueOf(Math.max(retryAfter, 1)));
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Too many requests. Please wait " +
                                Math.max(retryAfter, 1) + " seconds before trying again.\"," +
                                "\"error\":{\"code\":\"RATE_LIMITED\",\"details\":\"Rate limit exceeded for " + path
                                + "\"}}");
                return;
            }

            // Attach remaining count to response headers for client awareness
            response.setHeader("X-RateLimit-Limit", String.valueOf(limit));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, limit - count)));
        }

        filterChain.doFilter(request, response);
    }
}
