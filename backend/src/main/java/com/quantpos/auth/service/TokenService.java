package com.quantpos.auth.service;

import com.quantpos.common.ApiException;
import com.quantpos.common.ErrorCodes;
import com.quantpos.common.RedisService;
import com.quantpos.config.AppProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Optional;
import java.util.UUID;

/**
 * Centralized service for all token and OTP operations.
 *
 * Redis key schema:
 * refresh_token:{token} → userId (TTL: refreshExpiryDays)
 * email_otp:{email} → otp (TTL: 10 min)
 * email_otp:attempts:{email} → attempt-count (TTL: 10 min)
 * email_otp:locked:{email} → "1" (TTL: 15 min)
 * email_otp:resend_cooldown:{email} → "1" (TTL: 60 sec)
 * login_2fa:{email} → otp (TTL: 10 min)
 * login_2fa:attempts:{email} → attempt-count (TTL: 10 min)
 * login_2fa:locked:{email} → "1" (TTL: 15 min)
 * login_2fa:resend_cooldown:{email} → "1" (TTL: 60 sec)
 * password_reset:{token} → userId (TTL: 1 hr)
 * user_sessions:{userId}:{token} → "1" (TTL: refreshExpiryDays)
 */
@Service
public class TokenService {

    private static final int OTP_TTL_SECONDS = 600; // 10 minutes
    private static final int OTP_LOCKOUT_SECONDS = 900; // 15 minutes
    private static final int OTP_MAX_ATTEMPTS = 5;
    private static final int OTP_RESEND_COOLDOWN = 60; // 1 minute

    private final RedisService redisService;
    private final AppProperties appProperties;

    public TokenService(RedisService redisService, AppProperties appProperties) {
        this.redisService = redisService;
        this.appProperties = appProperties;
    }

    // ─────────────────────────────────────────────────────────
    // REFRESH TOKENS
    // ─────────────────────────────────────────────────────────

    public void saveRefreshToken(UUID userId, String token) {
        long ttlSeconds = appProperties.getJwt().getRefreshExpiryDays() * 86400L;
        String tokenKey = "refresh_token:" + token;
        String sessionKey = "user_sessions:" + userId + ":" + token;
        redisService.save(tokenKey, userId.toString(), ttlSeconds);
        // Track the token under the user's session namespace (for bulk invalidation)
        redisService.save(sessionKey, "1", ttlSeconds);
    }

    public Optional<UUID> validateRefreshToken(String token) {
        return redisService.get("refresh_token:" + token).map(UUID::fromString);
    }

    public String rotateRefreshToken(String oldToken, UUID userId) {
        // Store shadow key BEFORE deletion so replay detection can find userId
        // TTL = 24h (longer than access token, shorter than refresh TTL)
        redisService.save("rotated_refresh:" + oldToken, userId.toString(), 86400L);
        // Remove old token and its session tracking entry
        deleteRefreshToken(oldToken, userId);
        String newToken = UUID.randomUUID().toString();
        saveRefreshToken(userId, newToken);
        return newToken;
    }

    /**
     * Checks if a refresh token was recently rotated (replay attack indicator).
     * Returns the userId of the owner, so all their sessions can be cleared.
     *
     * @param token the already-rotated (stale) refresh token
     * @return Optional UUID of the user who owned this token, or empty if unknown
     */
    public java.util.Optional<UUID> getShadowUserId(String token) {
        return redisService.get("rotated_refresh:" + token).map(UUID::fromString);
    }

    public void deleteRefreshToken(String token) {
        // Overload that does not remove session tracking (used by logout)
        Optional<UUID> userId = validateRefreshToken(token);
        redisService.delete("refresh_token:" + token);
        userId.ifPresent(id -> redisService.delete("user_sessions:" + id + ":" + token));
    }

    private void deleteRefreshToken(String token, UUID userId) {
        redisService.delete("refresh_token:" + token);
        redisService.delete("user_sessions:" + userId + ":" + token);
    }

    /**
     * Invalidates ALL refresh tokens for a given user.
     * Called after password change/reset to force re-login on all devices.
     * Uses a scan via naming convention – since we track session keys, we iterate
     * them.
     * For simplicity we store a special flag that JwtFilter checks:
     * "invalidate_all:{userId}" → epoch ms of invalidation.
     * Any token issued before that timestamp is considered invalid.
     */
    public void invalidateAllUserSessions(UUID userId) {
        // Store an "invalidate before" timestamp JwtFilter will check this
        redisService.save(
                "invalidate_before:" + userId,
                String.valueOf(System.currentTimeMillis()),
                appProperties.getJwt().getRefreshExpiryDays() * 86400L);
    }

    /**
     * Returns the "invalidate before" epoch ms for a userId, or 0 if none set.
     */
    public long getInvalidateBefore(UUID userId) {
        return redisService.get("invalidate_before:" + userId)
                .map(Long::parseLong).orElse(0L);
    }

    // ─────────────────────────────────────────────────────────
    // EMAIL VERIFICATION OTP
    // ─────────────────────────────────────────────────────────

    /**
     * Generates and stores an email verification OTP.
     * Enforces 1-minute resend cooldown.
     * 
     * @throws ApiException if cooldown is active.
     */
    public String saveEmailVerificationOtp(String email) {
        checkResendCooldown("email_otp:resend_cooldown:" + email);
        String otp = generateOtp();
        redisService.save("email_otp:" + email, otp, OTP_TTL_SECONDS);
        // Reset attempt counter on fresh OTP
        redisService.delete("email_otp:attempts:" + email);
        // Set resend cooldown
        redisService.save("email_otp:resend_cooldown:" + email, "1", OTP_RESEND_COOLDOWN);
        return otp;
    }

    /**
     * Same as saveEmailVerificationOtp but bypasses cooldown.
     * Used during registration (first OTP send) and login-triggered resends.
     */
    public String saveEmailVerificationOtpSkipCooldown(String email) {
        String otp = generateOtp();
        redisService.save("email_otp:" + email, otp, OTP_TTL_SECONDS);
        redisService.delete("email_otp:attempts:" + email);
        redisService.save("email_otp:resend_cooldown:" + email, "1", OTP_RESEND_COOLDOWN);
        return otp;
    }

    /**
     * Validates the email verification OTP.
     * Tracks failed attempts and locks after OTP_MAX_ATTEMPTS.
     *
     * @return true on success (OTP deleted), false on mismatch.
     * @throws ApiException if account is locked.
     */
    public boolean validateEmailVerificationOtp(String email, String otp) {
        checkOtpLock("email_otp:locked:" + email);

        String key = "email_otp:" + email;
        Optional<String> stored = redisService.get(key);

        if (stored.isEmpty()) {
            return false; // OTP expired
        }
        if (!stored.get().equals(otp)) {
            long attempts = redisService.increment("email_otp:attempts:" + email, OTP_TTL_SECONDS);
            if (attempts >= OTP_MAX_ATTEMPTS) {
                redisService.save("email_otp:locked:" + email, "1", OTP_LOCKOUT_SECONDS);
                redisService.delete(key);
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many failed attempts. Try again in 15 minutes.",
                        ErrorCodes.OTP_LOCKED, "OTP brute-force lockout");
            }
            return false;
        }
        // Success clean up
        redisService.delete(key);
        redisService.delete("email_otp:attempts:" + email);
        return true;
    }

    // ─────────────────────────────────────────────────────────
    // LOGIN 2FA OTP
    // ─────────────────────────────────────────────────────────

    /**
     * Generates and stores a 2FA OTP for login.
     * Bypasses cooldown (always fresh on each login attempt).
     */
    public String saveLogin2faOtp(String email) {
        String otp = generateOtp();
        redisService.save("login_2fa:" + email, otp, OTP_TTL_SECONDS);
        redisService.delete("login_2fa:attempts:" + email);
        redisService.save("login_2fa:resend_cooldown:" + email, "1", OTP_RESEND_COOLDOWN);
        return otp;
    }

    /**
     * Validates the 2FA login OTP.
     * Tracks failed attempts and locks after OTP_MAX_ATTEMPTS.
     *
     * @return true on success (OTP deleted), false on mismatch.
     * @throws ApiException if locked or OTP expired.
     */
    public boolean validateLogin2faOtp(String email, String otp) {
        checkOtpLock("login_2fa:locked:" + email);

        String key = "login_2fa:" + email;
        Optional<String> stored = redisService.get(key);

        if (stored.isEmpty()) {
            return false; // OTP expired
        }
        if (!stored.get().equals(otp)) {
            long attempts = redisService.increment("login_2fa:attempts:" + email, OTP_TTL_SECONDS);
            if (attempts >= OTP_MAX_ATTEMPTS) {
                redisService.save("login_2fa:locked:" + email, "1", OTP_LOCKOUT_SECONDS);
                redisService.delete(key);
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                        "Too many failed attempts. Try again in 15 minutes.",
                        ErrorCodes.OTP_LOCKED, "2FA brute-force lockout");
            }
            return false;
        }
        // Success clean up
        redisService.delete(key);
        redisService.delete("login_2fa:attempts:" + email);
        return true;
    }

    // ─────────────────────────────────────────────────────────
    // PASSWORD RESET TOKEN
    // ─────────────────────────────────────────────────────────

    public String savePasswordResetToken(UUID userId) {
        String token = UUID.randomUUID().toString();
        redisService.save("password_reset:" + token, userId.toString(), 3600L);
        return token;
    }

    public Optional<UUID> validatePasswordResetToken(String token) {
        String key = "password_reset:" + token;
        Optional<String> userIdStr = redisService.get(key);
        if (userIdStr.isPresent()) {
            redisService.delete(key);
            return Optional.of(UUID.fromString(userIdStr.get()));
        }
        return Optional.empty();
    }

    // ─────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────

    private String generateOtp() {
        return String.format("%06d", new SecureRandom().nextInt(1_000_000));
    }

    private void checkOtpLock(String lockKey) {
        if (redisService.exists(lockKey)) {
            long remaining = redisService.getExpire(lockKey);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Account temporarily locked. Try again in " + Math.max(remaining, 1) + " seconds.",
                    ErrorCodes.OTP_LOCKED, "OTP lockout active");
        }
    }

    private void checkResendCooldown(String cooldownKey) {
        if (redisService.exists(cooldownKey)) {
            long remaining = redisService.getExpire(cooldownKey);
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS,
                    "Please wait " + Math.max(remaining, 1) + " seconds before requesting a new code.",
                    ErrorCodes.RATE_LIMITED, "Resend cooldown active");
        }
    }
}
