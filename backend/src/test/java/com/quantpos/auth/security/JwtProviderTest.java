package com.quantpos.auth.security;

import com.quantpos.config.AppProperties;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

public class JwtProviderTest {

    private AppProperties appProperties;
    private JwtProvider jwtProvider;
    private static final String TEST_SECRET = "thisisverysupersecretjwtkeyforquantposanditmustbe256bitslong";

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        appProperties.getJwt().setSecret(TEST_SECRET);
        appProperties.getJwt().setAccessExpiryMs(3600000); // 1 hour
        jwtProvider = new JwtProvider(appProperties);
    }

    @Test
    void generateAccessToken_and_extractClaims_success() {
        // Arrange
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        Tenant tenant = Tenant.builder()
                .id(tenantId)
                .businessName("Test Business")
                .build();

        User user = User.builder()
                .id(userId)
                .email("test@example.com")
                .role(Role.OWNER)
                .tenant(tenant)
                .build();

        // Act
        String token = jwtProvider.generateAccessToken(user);

        // Assert
        assertNotNull(token);
        assertTrue(jwtProvider.validateToken(token));

        assertEquals(userId, jwtProvider.extractUserId(token));
        assertEquals(tenantId, jwtProvider.extractTenantId(token));
        assertEquals("OWNER", jwtProvider.extractRole(token));
        assertEquals("test@example.com", jwtProvider.extractEmail(token));

        Claims claims = jwtProvider.extractClaims(token);
        assertEquals("Test Business", claims.get("businessName", String.class));
    }

    @Test
    void validateToken_fail_expired() {
        // Arrange
        appProperties.getJwt().setAccessExpiryMs(-1000); // Expired 1 second ago
        jwtProvider = new JwtProvider(appProperties);

        UUID userId = UUID.randomUUID();
        Tenant tenant = Tenant.builder().id(UUID.randomUUID()).businessName("Shop").build();
        User user = User.builder().id(userId).email("a@b.com").role(Role.OWNER).tenant(tenant).build();

        String token = jwtProvider.generateAccessToken(user);

        // Act
        boolean isValid = jwtProvider.validateToken(token);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_fail_tampered() {
        // Arrange
        UUID userId = UUID.randomUUID();
        Tenant tenant = Tenant.builder().id(UUID.randomUUID()).businessName("Shop").build();
        User user = User.builder().id(userId).email("a@b.com").role(Role.OWNER).tenant(tenant).build();

        String token = jwtProvider.generateAccessToken(user);
        String tamperedToken = token + "modified";

        // Act
        boolean isValid = jwtProvider.validateToken(tamperedToken);

        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateToken_fail_wrong_signature() {
        // Arrange
        UUID userId = UUID.randomUUID();
        Tenant tenant = Tenant.builder().id(UUID.randomUUID()).businessName("Shop").build();
        User user = User.builder().id(userId).email("a@b.com").role(Role.OWNER).tenant(tenant).build();

        String token = jwtProvider.generateAccessToken(user);

        // Create a different provider with a different secret
        AppProperties otherProps = new AppProperties();
        otherProps.getJwt().setSecret("anotherverysupersecretjwtkeyforquantposanditmustbe256bitslong");
        otherProps.getJwt().setAccessExpiryMs(3600000);
        JwtProvider otherProvider = new JwtProvider(otherProps);

        // Act
        boolean isValid = otherProvider.validateToken(token);

        // Assert
        assertFalse(isValid);
    }
}
