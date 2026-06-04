package com.quantpos.auth.service;

import com.quantpos.auth.dto.*;
import com.quantpos.auth.security.JwtProvider;
import com.quantpos.common.ApiException;
import com.quantpos.common.ErrorCodes;
import com.quantpos.tenant.model.BusinessType;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private TokenService tokenService;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    void register_success() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("owner@example.com");
        request.setPassword("password123");
        request.setOwnerFullName("John Doe");
        request.setBusinessName("My Shop");
        request.setBusinessType("RETAIL");
        request.setPhoneNumber("1234567890");
        request.setAddressStreet("Street 1");
        request.setAddressCity("City");
        request.setAddressState("State");
        request.setAddressPincode("123456");

        Tenant savedTenant = Tenant.builder()
                .id(UUID.randomUUID())
                .businessName(request.getBusinessName())
                .businessType(BusinessType.RETAIL)
                .isActive(true)
                .build();

        User savedUser = User.builder()
                .id(UUID.randomUUID())
                .fullName(request.getOwnerFullName())
                .email(request.getEmail())
                .role(Role.OWNER)
                .isEmailVerified(false)
                .isActive(true)
                .build();

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(tenantRepository.save(any(Tenant.class))).thenReturn(savedTenant);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(tokenService.saveEmailVerificationOtp(savedUser.getEmail())).thenReturn("123456");

        // Act
        var response = authService.register(request);

        // Assert
        assertNotNull(response);
        assertEquals("Registration successful. Please check your email for your 6-digit OTP.", response.getMessage());
        verify(emailService).sendVerificationEmail(request.getEmail(), savedUser.getFullName(), "123456");
    }

    @Test
    void register_fail_email_exists() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("existing@example.com");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.register(request));
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(ErrorCodes.EMAIL_ALREADY_EXISTS, exception.getCode());
    }

    @Test
    void register_fail_invalid_business_type() {
        // Arrange
        RegisterRequest request = new RegisterRequest();
        request.setEmail("owner@example.com");
        request.setBusinessType("INVALID_TYPE");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.register(request));
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(ErrorCodes.VALIDATION_FAILED, exception.getCode());
    }

    @Test
    void verifyEmailOtp_success() {
        // Arrange
        String email = "user@example.com";
        String otp = "123456";
        Tenant tenant = Tenant.builder().businessName("Test Shop").build();
        User user = User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .fullName("John Doe")
                .tenant(tenant)
                .isEmailVerified(false)
                .build();

        when(tokenService.validateEmailVerificationOtp(email, otp)).thenReturn(true);
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));

        // Act
        var response = authService.verifyEmailOtp(email, otp);

        // Assert
        assertNotNull(response);
        assertTrue(user.isEmailVerified());
        verify(userRepository).save(user);
        verify(emailService).sendWelcomeEmail(email, "John Doe", "Test Shop");
    }

    @Test
    void verifyEmailOtp_fail_invalid_otp() {
        // Arrange
        String email = "user@example.com";
        String otp = "000000";
        when(tokenService.validateEmailVerificationOtp(email, otp)).thenReturn(false);

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.verifyEmailOtp(email, otp));
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(ErrorCodes.OTP_INVALID, exception.getCode());
    }

    @Test
    void login_success() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("password123");

        Tenant tenant = Tenant.builder()
                .id(UUID.randomUUID())
                .businessName("Shop")
                .businessType(BusinessType.RETAIL)
                .isActive(true)
                .build();

        User user = User.builder()
                .id(UUID.randomUUID())
                .email(request.getEmail())
                .fullName("John Doe")
                .passwordHash("hashedPassword")
                .role(Role.OWNER)
                .isEmailVerified(true)
                .isActive(true)
                .tenant(tenant)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPasswordHash())).thenReturn(true);

        // Act — Step 1: login() now only validates credentials and sends 2FA OTP
        var response = authService.login(request);

        // Assert — login step 1 returns success with null data (tokens not yet issued)
        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertNull(response.getData());
        verify(tokenService).saveLogin2faOtp(user.getEmail());
        verify(emailService).send2faEmail(eq(user.getEmail()), any(), any());
    }

    @Test
    void login_fail_user_not_found() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("nonexistent@example.com");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.empty());

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.login(request));
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals(ErrorCodes.INVALID_CREDENTIALS, exception.getCode());
    }

    @Test
    void login_fail_email_not_verified() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("unverified@example.com");
        request.setPassword("password123");

        User user = User.builder()
                .email("unverified@example.com")
                .fullName("John Doe")
                .passwordHash("hashedPassword")
                .isEmailVerified(false)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPasswordHash())).thenReturn(true);
        when(tokenService.saveEmailVerificationOtp(user.getEmail())).thenReturn("123456");

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.login(request));
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals(ErrorCodes.EMAIL_NOT_VERIFIED, exception.getCode());
        verify(emailService).sendVerificationEmail("unverified@example.com", "John Doe", "123456");
    }

    @Test
    void login_fail_account_inactive() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("inactive@example.com");
        request.setPassword("password123");

        User user = User.builder()
                .passwordHash("hashedPassword")
                .isEmailVerified(true)
                .isActive(false)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPasswordHash())).thenReturn(true);

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.login(request));
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals(ErrorCodes.ACCOUNT_INACTIVE, exception.getCode());
    }

    @Test
    void login_fail_tenant_inactive() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("password123");

        Tenant tenant = Tenant.builder().isActive(false).build();
        User user = User.builder()
                .passwordHash("hashedPassword")
                .isEmailVerified(true)
                .isActive(true)
                .tenant(tenant)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPasswordHash())).thenReturn(true);

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.login(request));
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals(ErrorCodes.ACCOUNT_INACTIVE, exception.getCode());
    }

    @Test
    void login_fail_invalid_password() {
        // Arrange
        LoginRequest request = new LoginRequest();
        request.setEmail("user@example.com");
        request.setPassword("wrong");

        Tenant tenant = Tenant.builder().isActive(true).build();
        User user = User.builder()
                .passwordHash("hash")
                .isEmailVerified(true)
                .isActive(true)
                .tenant(tenant)
                .build();

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getPassword(), user.getPasswordHash())).thenReturn(false);

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.login(request));
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals(ErrorCodes.INVALID_CREDENTIALS, exception.getCode());
    }

    @Test
    void refreshToken_success() {
        // Arrange
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("old-refresh-token");

        Tenant tenant = Tenant.builder()
                .id(UUID.randomUUID())
                .businessName("Shop")
                .businessType(BusinessType.RETAIL)
                .isActive(true)
                .build();

        User user = User.builder()
                .id(UUID.randomUUID())
                .email("user@example.com")
                .fullName("John Doe")
                .role(Role.OWNER)
                .isActive(true)
                .tenant(tenant)
                .build();

        when(tokenService.validateRefreshToken(request.getRefreshToken())).thenReturn(Optional.of(user.getId()));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(tokenService.rotateRefreshToken(request.getRefreshToken(), user.getId())).thenReturn("new-refresh-token");
        when(jwtProvider.generateAccessToken(user)).thenReturn("new-access-token");

        // Act
        var response = authService.refreshToken(request);

        // Assert
        assertNotNull(response);
        assertEquals("new-access-token", response.getData().getAccessToken());
        assertEquals("new-refresh-token", response.getData().getRefreshToken());
    }

    @Test
    void refreshToken_fail_invalid_token() {
        // Arrange
        RefreshTokenRequest request = new RefreshTokenRequest();
        request.setRefreshToken("invalid");

        when(tokenService.validateRefreshToken("invalid")).thenReturn(Optional.empty());

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.refreshToken(request));
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals(ErrorCodes.TOKEN_EXPIRED, exception.getCode());
    }

    @Test
    void logout_success() {
        // Act
        var response = authService.logout("refresh-token");

        // Assert
        assertNotNull(response);
        assertEquals("Logged out successfully", response.getMessage());
        verify(tokenService).deleteRefreshToken("refresh-token");
    }

    @Test
    void forgotPassword_success() {
        // Arrange
        String email = "user@example.com";
        User user = User.builder().id(UUID.randomUUID()).email(email).fullName("John").build();

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(user));
        when(tokenService.savePasswordResetToken(user.getId())).thenReturn("reset-token");

        // Act
        var response = authService.forgotPassword(email);

        // Assert
        assertNotNull(response);
        assertEquals("If an account exists, a reset link has been sent.", response.getMessage());
        verify(emailService).sendPasswordResetEmail(email, "John", "reset-token");
    }

    @Test
    void resetPassword_success() {
        // Arrange
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("reset-token");
        request.setPassword("new-password");

        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).build();

        when(tokenService.validatePasswordResetToken("reset-token")).thenReturn(Optional.of(userId));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("new-password")).thenReturn("new-hash");

        // Act
        var response = authService.resetPassword(request);

        // Assert
        assertNotNull(response);
        assertEquals("Password reset successful. Please log in.", response.getMessage());
        verify(userRepository).save(user);
        assertEquals("new-hash", user.getPasswordHash());
    }

    @Test
    void resetPassword_fail_invalid_token() {
        // Arrange
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("invalid");

        when(tokenService.validatePasswordResetToken("invalid")).thenReturn(Optional.empty());

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.resetPassword(request));
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals(ErrorCodes.TOKEN_INVALID, exception.getCode());
    }

    @Test
    void getCurrentUser_success() {
        // Arrange
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();

        Tenant tenant = Tenant.builder()
                .id(tenantId)
                .businessName("Shop")
                .businessType(BusinessType.RETAIL)
                .build();

        User user = User.builder()
                .id(userId)
                .email("user@example.com")
                .fullName("John")
                .role(Role.OWNER)
                .tenant(tenant)
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // Act
        var response = authService.getCurrentUser(userId, tenantId);

        // Assert
        assertNotNull(response);
        assertEquals("user@example.com", response.getData().getEmail());
        assertEquals(tenantId, response.getData().getTenantId());
    }

    @Test
    void getCurrentUser_fail_not_found() {
        // Arrange
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();

        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.getCurrentUser(userId, tenantId));
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals(ErrorCodes.USER_NOT_FOUND, exception.getCode());
    }

    @Test
    void changePassword_success() {
        // Arrange
        UUID userId = UUID.randomUUID();
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("old");
        request.setNewPassword("new");

        User user = User.builder()
                .id(userId)
                .passwordHash("old-hash")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("old", "old-hash")).thenReturn(true);
        when(passwordEncoder.encode("new")).thenReturn("new-hash");

        // Act
        var response = authService.changePassword(userId, request);

        // Assert
        assertNotNull(response);
        assertEquals("Password changed successfully", response.getMessage());
        verify(userRepository).save(user);
        assertEquals("new-hash", user.getPasswordHash());
    }

    @Test
    void changePassword_fail_invalid_password() {
        // Arrange
        UUID userId = UUID.randomUUID();
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("wrong");

        User user = User.builder()
                .id(userId)
                .passwordHash("old-hash")
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "old-hash")).thenReturn(false);

        // Act & Assert
        ApiException exception = assertThrows(ApiException.class, () -> authService.changePassword(userId, request));
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals(ErrorCodes.INVALID_CREDENTIALS, exception.getCode());
    }
}
