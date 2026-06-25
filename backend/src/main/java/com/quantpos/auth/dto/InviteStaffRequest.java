package com.quantpos.auth.dto;

import com.quantpos.user.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class InviteStaffRequest {
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String fullName;

    @NotNull(message = "Role is required")
    private Role role; // MANAGER or CASHIER
}
