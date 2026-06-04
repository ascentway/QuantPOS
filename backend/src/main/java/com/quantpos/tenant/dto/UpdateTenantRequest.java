package com.quantpos.tenant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateTenantRequest {
    @NotBlank
    private String businessName;

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

    @NotBlank
    private String timezone;
}
