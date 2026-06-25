package com.quantpos.auth.service;

import com.quantpos.auth.dto.*;
import com.quantpos.auth.security.JwtProvider;
import com.quantpos.common.ApiResponse;
import com.quantpos.common.ApiException;
import com.quantpos.common.ErrorCodes;
import com.quantpos.tenant.model.BusinessType;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.UUID;

@Service
@Transactional
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final JwtProvider jwtProvider;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, TenantRepository tenantRepository,
            JwtProvider jwtProvider, TokenService tokenService,
            EmailService emailService, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.tenantRepository = tenantRepository;
        this.jwtProvider = jwtProvider;
        this.tokenService = tokenService;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REGISTRATION
    // ─────────────────────────────────────────────────────────────────────────

    public ApiResponse<Void> register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Email already exists", ErrorCodes.EMAIL_ALREADY_EXISTS, "Email is already registered");
        }

        BusinessType businessType;
        try {
            businessType = BusinessType.valueOf(request.getBusinessType());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Invalid business type", ErrorCodes.VALIDATION_FAILED, "Business type must be RETAIL or FNB");
        }

        Tenant tenant = Tenant.builder()
                .businessName(request.getBusinessName())
                .businessType(businessType)
                .phoneNumber(request.getPhoneNumber())
                .gstin(request.getGstin())
                .addressStreet(request.getAddressStreet())
                .addressCity(request.getAddressCity())
                .addressState(request.getAddressState())
                .addressPincode(request.getAddressPincode())
                .currency(request.getCurrency() != null ? request.getCurrency() : "INR")
                .timezone(request.getTimezone() != null ? request.getTimezone() : "Asia/Kolkata")
                .isActive(true)
                .build();
        tenant = tenantRepository.save(tenant);

        User user = User.builder()
                .tenant(tenant)
                .fullName(request.getOwnerFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(Role.OWNER)
                .isEmailVerified(false)
                .isActive(true)
                .build();
        user = userRepository.save(user);

        // Skip cooldown for initial send (first registration OTP)
        String otp = tokenService.saveEmailVerificationOtpSkipCooldown(user.getEmail());
        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), otp);

        return ApiResponse.success(null, "Registration successful. Please check your email for your 6-digit OTP.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // EMAIL VERIFICATION
    // ─────────────────────────────────────────────────────────────────────────

    public ApiResponse<Void> verifyEmailOtp(String email, String otp) {
        if (!tokenService.validateEmailVerificationOtp(email, otp)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Invalid or expired OTP. Please request a new one.",
                    ErrorCodes.OTP_INVALID, "OTP mismatch or expired");
        }
        return userRepository.findByEmail(email)
                .map(user -> {
                    user.setEmailVerified(true);
                    userRepository.save(user);
                    emailService.sendWelcomeEmail(user.getEmail(), user.getFullName(),
                            user.getTenant().getBusinessName());
                    return ApiResponse.<Void>success(null, "Email verified successfully. You can now log in.");
                })
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "User not found for this email.", ErrorCodes.USER_NOT_FOUND, "User not found"));
    }

    public ApiResponse<Void> resendOtp(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                // Will throw if cooldown active exception propagates to controller
                String otp = tokenService.saveEmailVerificationOtp(email);
                emailService.sendVerificationEmail(email, user.getFullName(), otp);
            }
        });
        // Always return success to prevent email enumeration
        return ApiResponse.success(null,
                "If this email is registered and unverified, a new OTP has been sent.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN Step 1: Validate credentials, send 2FA OTP
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Step 1 of login: validate email/password, then send a 2FA OTP.
     * Returns a special response indicating 2FA is required (no tokens yet).
     */
    public ApiResponse<Void> login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        "Invalid credentials", ErrorCodes.INVALID_CREDENTIALS, "User not found"));

        if (user.isLocked()) {
            if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(java.time.LocalDateTime.now())) {
                throw new ApiException(HttpStatus.UNAUTHORIZED,
                        "Account is temporarily locked due to too many failed attempts. Try again later.",
                        ErrorCodes.INVALID_CREDENTIALS, "Account locked");
            } else {
                // Lock expired, reset
                user.setLocked(false);
                user.setLockedUntil(null);
                user.setLoginAttemptCount(0);
                userRepository.save(user);
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.setLoginAttemptCount(user.getLoginAttemptCount() + 1);
            if (user.getLoginAttemptCount() >= 5) {
                user.setLocked(true);
                user.setLockedUntil(java.time.LocalDateTime.now().plusMinutes(15));
            }
            userRepository.save(user);
            throw new ApiException(HttpStatus.UNAUTHORIZED,
                    "Invalid credentials", ErrorCodes.INVALID_CREDENTIALS, "Incorrect password");
        }

        if (user.getLoginAttemptCount() > 0) {
            user.setLoginAttemptCount(0);
            userRepository.save(user);
        }

        if (!user.isEmailVerified()) {
            // Auto-resend a fresh verification OTP (skip cooldown)
            String otp = tokenService.saveEmailVerificationOtpSkipCooldown(user.getEmail());
            emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), otp);
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Please verify your email before logging in. A new verification code has been sent.",
                    ErrorCodes.EMAIL_NOT_VERIFIED, "Email not verified");
        }
        if (!user.isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Your account has been deactivated. Contact support.",
                    ErrorCodes.ACCOUNT_INACTIVE, "User inactive");
        }
        if (!user.getTenant().isActive()) {
            throw new ApiException(HttpStatus.FORBIDDEN,
                    "Your business account is suspended.",
                    ErrorCodes.ACCOUNT_INACTIVE, "Tenant inactive");
        }

        // Credentials valid send 2FA OTP
        String otp2fa = tokenService.saveLogin2faOtp(user.getEmail());
        emailService.send2faEmail(user.getEmail(), user.getFullName(), otp2fa);

        return ApiResponse.success(null, "Credentials verified. A 6-digit code has been sent to your email.");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LOGIN Step 2: Verify 2FA OTP, issue tokens
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Step 2 of login: validate 2FA OTP and return JWT + refresh tokens.
     */
    public ApiResponse<AuthResponse> verify2fa(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        "Invalid session", ErrorCodes.INVALID_CREDENTIALS, "User not found"));

        if (!tokenService.validateLogin2faOtp(email, otp)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED,
                    "Invalid or expired code. Please try again.",
                    ErrorCodes.OTP_INVALID, "2FA OTP mismatch");
        }

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtProvider.generateAccessToken(user);
        String refreshToken = UUID.randomUUID().toString();
        tokenService.saveRefreshToken(user.getId(), refreshToken);

        AuthResponse.UserInfo userInfo = buildUserInfo(user);
        AuthResponse response = AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(userInfo)
                .build();

        return ApiResponse.success(response, "Login successful");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // TOKEN REFRESH + LOGOUT
    // ─────────────────────────────────────────────────────────────────────────

    public ApiResponse<AuthResponse> refreshToken(RefreshTokenRequest request) {
        String incomingToken = request.getRefreshToken();

        // ── Replay attack detection ────────────────────────────────────
        // If the token is NOT in Redis (already deleted/rotated) but IS in
        // the shadow key (rotated_refresh:{token}), this is a stale token replay.
        if (tokenService.validateRefreshToken(incomingToken).isEmpty()) {
            tokenService.getShadowUserId(incomingToken).ifPresent(userId -> {
                log.warn("SECURITY: Refresh token replay detected! " +
                        "Clearing all sessions for userId={}. " +
                        "A previously rotated token was presented  possible session hijack.", userId);
                tokenService.invalidateAllUserSessions(userId);
            });
            throw new ApiException(HttpStatus.UNAUTHORIZED,
                    "Refresh token expired or invalid", ErrorCodes.TOKEN_EXPIRED, "Invalid refresh token");
        }
        // ───────────────────────────────────────────────────────────────

        return tokenService.validateRefreshToken(incomingToken)
                .flatMap(userRepository::findById)
                .filter(User::isActive)
                .map(user -> {
                    String newRefreshToken = tokenService.rotateRefreshToken(
                            incomingToken, user.getId());
                    String newAccessToken = jwtProvider.generateAccessToken(user);

                    AuthResponse.UserInfo userInfo = buildUserInfo(user);
                    AuthResponse response = AuthResponse.builder()
                            .accessToken(newAccessToken)
                            .refreshToken(newRefreshToken)
                            .user(userInfo)
                            .build();
                    return ApiResponse.success(response, "Token refreshed successfully");
                })
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        "Refresh token expired or invalid", ErrorCodes.TOKEN_EXPIRED, "Invalid refresh token"));
    }

    public ApiResponse<Void> logout(String refreshToken) {
        tokenService.deleteRefreshToken(refreshToken);
        return ApiResponse.success(null, "Logged out successfully");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PASSWORD MANAGEMENT
    // ─────────────────────────────────────────────────────────────────────────

    public ApiResponse<Void> forgotPassword(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = tokenService.savePasswordResetToken(user.getId());
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), token);
        });
        return ApiResponse.success(null, "If an account exists, a reset link has been sent.");
    }

    public ApiResponse<Void> resetPassword(ResetPasswordRequest request) {
        return tokenService.validatePasswordResetToken(request.getToken())
                .flatMap(userRepository::findById)
                .map(user -> {
                    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
                    userRepository.save(user);
                    // Invalidate ALL active sessions across all devices
                    tokenService.invalidateAllUserSessions(user.getId());
                    return ApiResponse.<Void>success(null, "Password reset successful. Please log in.");
                })
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST,
                        "Reset link is invalid or has expired", ErrorCodes.TOKEN_INVALID, "Invalid token"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PROFILE & CHANGE PASSWORD
    // ─────────────────────────────────────────────────────────────────────────

    public ApiResponse<AuthResponse.UserInfo> getCurrentUser(UUID userId, UUID tenantId) {
        return userRepository.findById(userId)
                .filter(user -> user.getTenant().getId().equals(tenantId))
                .map(user -> ApiResponse.success(buildUserInfo(user), "User info retrieved"))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        "User not found", ErrorCodes.USER_NOT_FOUND, "User not found"));
    }

    public ApiResponse<Void> changePassword(UUID userId, ChangePasswordRequest request) {
        return userRepository.findById(userId)
                .map(user -> {
                    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
                        throw new ApiException(HttpStatus.UNAUTHORIZED,
                                "Invalid current password", ErrorCodes.INVALID_CREDENTIALS,
                                "Incorrect current password");
                    }
                    user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
                    userRepository.save(user);
                    // Invalidate ALL active sessions across all devices
                    tokenService.invalidateAllUserSessions(user.getId());
                    return ApiResponse.<Void>success(null,
                            "Password changed successfully. Please log in again on all devices.");
                })
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED,
                        "User not found", ErrorCodes.USER_NOT_FOUND, "User not found"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private AuthResponse.UserInfo buildUserInfo(User user) {
        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .tenantId(user.getTenant().getId())
                .businessName(user.getTenant().getBusinessName())
                .businessType(user.getTenant().getBusinessType().name())
                .subscriptionStatus(user.getTenant().getSubscriptionStatus().name())
                .gstin(user.getTenant().getGstin())
                .build();
    }
}
