package com.quantpos.config;

import com.quantpos.auth.security.JwtFilter;
import com.quantpos.common.MdcLoggingFilter;
import com.quantpos.common.RateLimitFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter       jwtFilter;
    private final RateLimitFilter rateLimitFilter;
    private final MdcLoggingFilter mdcLoggingFilter;

    public SecurityConfig(JwtFilter jwtFilter,
                          RateLimitFilter rateLimitFilter,
                          MdcLoggingFilter mdcLoggingFilter) {
        this.jwtFilter       = jwtFilter;
        this.rateLimitFilter  = rateLimitFilter;
        this.mdcLoggingFilter = mdcLoggingFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                // ── Auth endpoints ────────────────────────────
                                "/api/auth/register",
                                "/api/auth/login",
                                "/api/auth/verify-2fa",
                                "/api/auth/refresh",
                                "/api/auth/verify-email",
                                "/api/auth/resend-otp",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password",
                                // ── Stripe webhooks (protected by signature) ──
                                "/api/webhooks/**",
                                // ── Actuator health probes ─────────────────────
                                "/actuator/health",
                                "/actuator/info",
                                "/actuator/metrics",
                                "/actuator/prometheus",
                                // ── Swagger / OpenAPI ─────────────────────────
                                "/docs",
                                "/docs/**",
                                "/docs/api-docs",
                                "/docs/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs",
                                "/v3/api-docs/**",
                                "/webjars/**"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                // Filter order:
                // 1. MdcLoggingFilter  — assigns requestId, populates MDC
                // 2. RateLimitFilter   — IP-based rate limiting on auth endpoints
                // 3. JwtFilter         — JWT validation, tenant context, Hibernate filter
                .addFilterBefore(mdcLoggingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(rateLimitFilter,   MdcLoggingFilter.class)
                .addFilterBefore(jwtFilter,        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        // Echo X-Request-ID so frontend can correlate traces
        configuration.setExposedHeaders(List.of("X-Request-ID", "X-RateLimit-Limit",
            "X-RateLimit-Remaining", "X-RateLimit-Reset", "Retry-After"));
        configuration.setAllowCredentials(false);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
