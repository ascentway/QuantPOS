package com.quantpos.auth.controller;

import com.quantpos.auth.dto.*;
import com.quantpos.auth.service.AuthService;
import com.quantpos.common.ApiResponse;
import com.quantpos.multitenancy.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@Validated
@Tag(name = "Authentication", description = "Endpoints for registration, login (2-step: credentials + 2FA OTP), verification, and password management")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return UUID.fromString(auth.getName());
    }

    private UUID getCurrentTenantId() {
        return TenantContext.getTenantId();
    }

    // ─────────────────────────────────────────────────────────────
    // REGISTRATION
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/register")
    @Operation(summary = "Register a new tenant/business and its owner account")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Registration successful, verification OTP sent")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid input or email already exists")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    // ─────────────────────────────────────────────────────────────
    // EMAIL VERIFICATION
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/verify-email")
    @Operation(summary = "Verify account email using the 6-digit OTP received in email")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Email verified successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or expired OTP")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429", description = "OTP locked due to too many failed attempts")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(
            @RequestParam @Email String email,
            @RequestParam @NotBlank String otp) {
        return ResponseEntity.ok(authService.verifyEmailOtp(email, otp));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend a fresh 6-digit OTP to the registered email (1-minute cooldown enforced)")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "OTP resent if account exists and is unverified")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429", description = "Resend cooldown active")
    public ResponseEntity<ApiResponse<Void>> resendOtp(@RequestParam @Email String email) {
        return ResponseEntity.ok(authService.resendOtp(email));
    }

    // ─────────────────────────────────────────────────────────────
    // LOGIN 2-step flow
    // ─────────────────────────────────────────────────────────────

    /**
     * Step 1: Validate email + password.
     * On success, sends 2FA OTP to email and returns { success: true, data: null }.
     * Frontend then shows OTP entry screen and calls /verify-2fa.
     */
    @PostMapping("/login")
    @Operation(summary = "Login Step 1  Validate credentials and trigger 2FA OTP")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Credentials valid, 2FA OTP sent to email")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid credentials")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Email not verified or account/tenant inactive")
    public ResponseEntity<ApiResponse<Void>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /**
     * Step 2: Validate 2FA OTP.
     * On success, issues JWT access token + refresh token.
     */
    @PostMapping("/verify-2fa")
    @Operation(summary = "Login Step 2  Verify 2FA OTP and receive JWT tokens")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful, tokens issued")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid or expired 2FA OTP")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "429", description = "2FA OTP locked due to too many attempts")
    public ResponseEntity<ApiResponse<AuthResponse>> verify2fa(
            @RequestParam @Email String email,
            @RequestParam @NotBlank String otp) {
        return ResponseEntity.ok(authService.verify2fa(email, otp));
    }

    // ─────────────────────────────────────────────────────────────
    // TOKEN MANAGEMENT
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/refresh")
    @Operation(summary = "Obtain a new access token using a valid refresh token")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token refreshed successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid or expired refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.refreshToken(request));
    }

    @PostMapping("/logout")
    @Operation(summary = "Invalidate user's refresh token and log out")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logged out successfully")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(authService.logout(request.getRefreshToken()));
    }

    // ─────────────────────────────────────────────────────────────
    // PASSWORD MANAGEMENT
    // ─────────────────────────────────────────────────────────────

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset link")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password reset link sent (if email exists)")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        return ResponseEntity.ok(authService.forgotPassword(request.getEmail()));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using token and new password (invalidates all sessions)")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password reset successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid or expired reset token")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return ResponseEntity.ok(authService.resetPassword(request));
    }

    // ─────────────────────────────────────────────────────────────
    // PROFILE
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current authenticated user information")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User information retrieved successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getCurrentUser() {
        return ResponseEntity.ok(authService.getCurrentUser(getCurrentUserId(), getCurrentTenantId()));
    }

    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change password for the logged-in user (invalidates all sessions)")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Password changed successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Invalid current password or unauthorized")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        return ResponseEntity.ok(authService.changePassword(getCurrentUserId(), request));
    }
}
