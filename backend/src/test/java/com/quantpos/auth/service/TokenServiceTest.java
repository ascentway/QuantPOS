package com.quantpos.auth.service;

import com.quantpos.config.AppProperties;
import com.quantpos.common.RedisService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TokenServiceTest {

    @Mock
    private RedisService redisService;

    @Mock
    private AppProperties appProperties;

    @InjectMocks
    private TokenService tokenService;

    private final AppProperties.JwtProperties jwtProperties = new AppProperties.JwtProperties();

    @BeforeEach
    void setUp() {
        jwtProperties.setRefreshExpiryDays(7);
        lenient().when(appProperties.getJwt()).thenReturn(jwtProperties);
    }

    @Test
    void saveRefreshToken_success() {
        // Arrange
        UUID userId = UUID.randomUUID();
        String token = "some-refresh-token";

        // Act
        tokenService.saveRefreshToken(userId, token);

        // Assert
        verify(redisService).save("refresh_token:" + token, userId.toString(), 7 * 86400L);
    }

    @Test
    void validateRefreshToken_success() {
        // Arrange
        UUID userId = UUID.randomUUID();
        String token = "some-refresh-token";
        when(redisService.get("refresh_token:" + token)).thenReturn(Optional.of(userId.toString()));

        // Act
        Optional<UUID> validated = tokenService.validateRefreshToken(token);

        // Assert
        assertTrue(validated.isPresent());
        assertEquals(userId, validated.get());
    }

    @Test
    void validateRefreshToken_fail_notFound() {
        // Arrange
        String token = "nonexistent";
        when(redisService.get("refresh_token:" + token)).thenReturn(Optional.empty());

        // Act
        Optional<UUID> validated = tokenService.validateRefreshToken(token);

        // Assert
        assertFalse(validated.isPresent());
    }

    @Test
    void rotateRefreshToken_success() {
        // Arrange
        UUID userId = UUID.randomUUID();
        String oldToken = "old-token";

        // Act
        String newToken = tokenService.rotateRefreshToken(oldToken, userId);

        // Assert
        assertNotNull(newToken);
        assertNotEquals(oldToken, newToken);
        verify(redisService).delete("refresh_token:" + oldToken);
        verify(redisService).save(eq("refresh_token:" + newToken), eq(userId.toString()), anyLong());
    }

    @Test
    void deleteRefreshToken_success() {
        // Arrange
        String token = "to-delete";

        // Act
        tokenService.deleteRefreshToken(token);

        // Assert
        verify(redisService).delete("refresh_token:" + token);
    }

    @Test
    void saveEmailVerificationOtp_success() {
        // Arrange
        String email = "user@example.com";

        // Act
        String otp = tokenService.saveEmailVerificationOtp(email);

        // Assert
        assertNotNull(otp);
        assertEquals(6, otp.length());
        // OTP must be all digits
        assertTrue(otp.matches("[0-9]{6}"));
        verify(redisService).save(eq("email_otp:" + email), eq(otp), eq(600L));
    }

    @Test
    void validateEmailVerificationOtp_success() {
        // Arrange
        String email = "user@example.com";
        String otp = "123456";
        String key = "email_otp:" + email;
        when(redisService.get(key)).thenReturn(Optional.of(otp));

        // Act
        boolean valid = tokenService.validateEmailVerificationOtp(email, otp);

        // Assert
        assertTrue(valid);
        verify(redisService).delete(key);
    }

    @Test
    void validateEmailVerificationOtp_fail_wrong_otp() {
        // Arrange
        String email = "user@example.com";
        String key = "email_otp:" + email;
        when(redisService.get(key)).thenReturn(Optional.of("654321"));

        // Act
        boolean valid = tokenService.validateEmailVerificationOtp(email, "000000");

        // Assert
        assertFalse(valid);
        verify(redisService, never()).delete(key);
    }

    @Test
    void validateEmailVerificationOtp_fail_expired() {
        // Arrange
        String email = "user@example.com";
        String key = "email_otp:" + email;
        when(redisService.get(key)).thenReturn(Optional.empty());

        // Act
        boolean valid = tokenService.validateEmailVerificationOtp(email, "123456");

        // Assert
        assertFalse(valid);
        verify(redisService, never()).delete(key);
    }

    @Test
    void savePasswordResetToken_success() {
        // Arrange
        UUID userId = UUID.randomUUID();

        // Act
        String token = tokenService.savePasswordResetToken(userId);

        // Assert
        assertNotNull(token);
        verify(redisService).save("password_reset:" + token, userId.toString(), 3600L);
    }

    @Test
    void validatePasswordResetToken_success() {
        // Arrange
        UUID userId = UUID.randomUUID();
        String token = "reset-token";
        String key = "password_reset:" + token;
        when(redisService.get(key)).thenReturn(Optional.of(userId.toString()));

        // Act
        Optional<UUID> validated = tokenService.validatePasswordResetToken(token);

        // Assert
        assertTrue(validated.isPresent());
        assertEquals(userId, validated.get());
        verify(redisService).delete(key);
    }

    @Test
    void validatePasswordResetToken_fail_notFound() {
        // Arrange
        String token = "invalid-token";
        String key = "password_reset:" + token;
        when(redisService.get(key)).thenReturn(Optional.empty());

        // Act
        Optional<UUID> validated = tokenService.validatePasswordResetToken(token);

        // Assert
        assertFalse(validated.isPresent());
        verify(redisService, never()).delete(key);
    }
}
