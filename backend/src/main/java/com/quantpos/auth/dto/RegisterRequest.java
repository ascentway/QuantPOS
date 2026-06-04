package com.quantpos.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    @Size(max = 255)
    private String businessName;

    @NotBlank
    private String businessType;

    @NotBlank
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be 10 digits")
    private String phoneNumber;

    @Pattern(regexp = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", message = "Invalid GSTIN format")
    private String gstin;

    @NotBlank
    private String addressStreet;

    @NotBlank
    private String addressCity;

    @NotBlank
    private String addressState;

    @NotBlank
    @Pattern(regexp = "^[0-9]{6}$", message = "Pincode must be 6 digits")
    private String addressPincode;

    private String currency; // Will default to INR in service if null
    
    private String timezone; // Will default to Asia/Kolkata in service if null

    @NotBlank
    private String ownerFullName;

    @NotBlank
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank
    @Size(min = 8, max = 64, message = "Password must be between 8 and 64 characters")
    private String password;
}
