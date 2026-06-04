package com.quantpos.auth.security;

import com.quantpos.config.AppProperties;
import com.quantpos.user.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtProvider {

    private final AppProperties appProperties;
    private final SecretKey key;

    public JwtProvider(AppProperties appProperties) {
        this.appProperties = appProperties;
        this.key = Keys.hmacShaKeyFor(appProperties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(User user) {
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("tenantId", user.getTenant().getId().toString())
                .claim("role", user.getRole().name())
                .claim("email", user.getEmail())
                .claim("businessName", user.getTenant().getBusinessName())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + appProperties.getJwt().getAccessExpiryMs()))
                .signWith(key)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Claims extractClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractUserId(String token) {
        return UUID.fromString(extractClaims(token).getSubject());
    }

    public UUID extractTenantId(String token) {
        return UUID.fromString(extractClaims(token).get("tenantId", String.class));
    }

    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }

    public String extractEmail(String token) {
        return extractClaims(token).get("email", String.class);
    }

    public long extractIssuedAt(String token) {
        return extractClaims(token).getIssuedAt().getTime(); // epoch millis
    }
}
