package com.quantpos.user.dto;

import com.quantpos.user.model.Permission;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Set;

@Data
public class UpdateUserPermissionsRequest {
    @NotNull(message = "Permissions set cannot be null")
    private Set<Permission> permissions;
}
