package com.quantpos.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateUserStatusRequest {
    @NotNull(message = "isActive field is required")
    private Boolean isActive;
}
