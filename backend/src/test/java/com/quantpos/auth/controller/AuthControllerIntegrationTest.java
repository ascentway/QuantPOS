package com.quantpos.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quantpos.auth.dto.LoginRequest;
import com.quantpos.auth.dto.RegisterRequest;
import com.quantpos.auth.security.JwtProvider;
import com.quantpos.auth.service.EmailService;
import com.quantpos.common.RedisService;
import com.quantpos.tenant.model.BusinessType;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TenantRepository tenantRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EmailService emailService;

    @MockBean
    private RedisService redisService;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
        tenantRepository.deleteAll();
        
        // Mock RedisService behavior by default
        lenient().when(redisService.get(any())).thenReturn(Optional.empty());
    }

    @Test
    void register_success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setBusinessName("Integration Shop");
        request.setBusinessType("RETAIL");
        request.setPhoneNumber("9876543210");
        request.setAddressStreet("123 Main St");
        request.setAddressCity("City");
        request.setAddressState("State");
        request.setAddressPincode("560001");
        request.setOwnerFullName("Jane Doe");
        request.setEmail("jane@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("Registration successful")));
    }

    @Test
    void register_fail_duplicateEmail() throws Exception {
        Tenant tenant = Tenant.builder()
                .businessName("Test Shop")
                .businessType(BusinessType.RETAIL)
                .phoneNumber("1234567890")
                .addressStreet("St")
                .addressCity("City")
                .addressState("State")
                .addressPincode("123456")
                .isActive(true)
                .build();
        tenant = tenantRepository.save(tenant);

        User user = User.builder()
                .tenant(tenant)
                .fullName("John Owner")
                .email("duplicate@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.OWNER)
                .isEmailVerified(true)
                .isActive(true)
                .build();
        userRepository.save(user);

        RegisterRequest request = new RegisterRequest();
        request.setBusinessName("Integration Shop 2");
        request.setBusinessType("RETAIL");
        request.setPhoneNumber("9876543210");
        request.setAddressStreet("123 Main St");
        request.setAddressCity("City");
        request.setAddressState("State");
        request.setAddressPincode("560001");
        request.setOwnerFullName("Jane Doe");
        request.setEmail("duplicate@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Email already exists")));
    }

    @Test
    void login_success() throws Exception {
        Tenant tenant = Tenant.builder()
                .businessName("Test Shop")
                .businessType(BusinessType.RETAIL)
                .phoneNumber("1234567890")
                .addressStreet("St")
                .addressCity("City")
                .addressState("State")
                .addressPincode("123456")
                .isActive(true)
                .build();
        tenant = tenantRepository.save(tenant);

        User user = User.builder()
                .tenant(tenant)
                .fullName("John Owner")
                .email("john@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.OWNER)
                .isEmailVerified(true)
                .isActive(true)
                .build();
        userRepository.save(user);

        LoginRequest request = new LoginRequest();
        request.setEmail("john@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("john@example.com")));
    }

    @Test
    void login_fail_unverified() throws Exception {
        Tenant tenant = Tenant.builder()
                .businessName("Test Shop")
                .businessType(BusinessType.RETAIL)
                .phoneNumber("1234567890")
                .addressStreet("St")
                .addressCity("City")
                .addressState("State")
                .addressPincode("123456")
                .isActive(true)
                .build();
        tenant = tenantRepository.save(tenant);

        User user = User.builder()
                .tenant(tenant)
                .fullName("John Owner")
                .email("unverified@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.OWNER)
                .isEmailVerified(false)
                .isActive(true)
                .build();
        userRepository.save(user);

        LoginRequest request = new LoginRequest();
        request.setEmail("unverified@example.com");
        request.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("verify your email")));
    }

    @Test
    void login_fail_invalidPassword() throws Exception {
        Tenant tenant = Tenant.builder()
                .businessName("Test Shop")
                .businessType(BusinessType.RETAIL)
                .phoneNumber("1234567890")
                .addressStreet("St")
                .addressCity("City")
                .addressState("State")
                .addressPincode("123456")
                .isActive(true)
                .build();
        tenant = tenantRepository.save(tenant);

        User user = User.builder()
                .tenant(tenant)
                .fullName("John Owner")
                .email("john@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.OWNER)
                .isEmailVerified(true)
                .isActive(true)
                .build();
        userRepository.save(user);

        LoginRequest request = new LoginRequest();
        request.setEmail("john@example.com");
        request.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.message", containsString("Invalid credentials")));
    }

    @Test
    void getMe_success() throws Exception {
        Tenant tenant = Tenant.builder()
                .businessName("Test Shop")
                .businessType(BusinessType.RETAIL)
                .phoneNumber("1234567890")
                .addressStreet("St")
                .addressCity("City")
                .addressState("State")
                .addressPincode("123456")
                .isActive(true)
                .build();
        tenant = tenantRepository.save(tenant);

        User user = User.builder()
                .tenant(tenant)
                .fullName("John Owner")
                .email("john@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.OWNER)
                .isEmailVerified(true)
                .isActive(true)
                .build();
        user = userRepository.save(user);

        String token = jwtProvider.generateAccessToken(user);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("john@example.com")))
                .andExpect(jsonPath("$.data.fullName", is("John Owner")));
    }

    @Test
    void getMe_unauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    void roleBasedAccessControl_forbiddenForCashier() throws Exception {
        Tenant tenant = Tenant.builder()
                .businessName("Test Shop")
                .businessType(BusinessType.RETAIL)
                .phoneNumber("1234567890")
                .addressStreet("St")
                .addressCity("City")
                .addressState("State")
                .addressPincode("123456")
                .isActive(true)
                .build();
        tenant = tenantRepository.save(tenant);

        User cashier = User.builder()
                .tenant(tenant)
                .fullName("Cashier John")
                .email("cashier@example.com")
                .passwordHash(passwordEncoder.encode("password123"))
                .role(Role.CASHIER)
                .isEmailVerified(true)
                .isActive(true)
                .build();
        cashier = userRepository.save(cashier);

        String token = jwtProvider.generateAccessToken(cashier);

        com.quantpos.tenant.dto.UpdateTenantRequest updateRequest = new com.quantpos.tenant.dto.UpdateTenantRequest();
        updateRequest.setBusinessName("Updated Shop");
        updateRequest.setPhoneNumber("9876543210");
        updateRequest.setAddressStreet("123 Street");
        updateRequest.setAddressCity("City");
        updateRequest.setAddressState("State");
        updateRequest.setAddressPincode("560001");
        updateRequest.setTimezone("Asia/Kolkata");

        // Put request to update profile (requires OWNER role)
        mockMvc.perform(put("/api/tenant/profile")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden());
    }
}
