package com.quantpos.user.controller;

import com.quantpos.common.ApiResponse;
import com.quantpos.user.dto.UpdateUserStatusRequest;
import com.quantpos.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "Endpoints for managing users in a tenant")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PatchMapping("/{userId}/status")
    @Operation(summary = "Activate or deactivate a user", description = "Allows an OWNER to activate or deactivate employees within their business.")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication) {

        UUID requestingUserId = UUID.fromString(authentication.getName());
        userService.updateUserStatus(userId, request.getIsActive(), requestingUserId);

        String action = request.getIsActive() ? "activated" : "deactivated";
        return ResponseEntity.ok(ApiResponse.success(null, "User successfully " + action));
    }

    @GetMapping
    @Operation(summary = "Get all users", description = "Allows an OWNER or MANAGER to retrieve all users in their business.")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<java.util.List<com.quantpos.user.dto.UserDto>>> getAllUsers(Authentication authentication) {
        java.util.List<com.quantpos.user.dto.UserDto> users = userService.getTenantUsers(com.quantpos.multitenancy.TenantContext.getTenantId());
        return ResponseEntity.ok(ApiResponse.success(users, "Users retrieved successfully"));
    }

    @PatchMapping("/{userId}/role")
    @Operation(summary = "Update user role", description = "Allows an OWNER to promote or demote a user.")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(
            @PathVariable UUID userId,
            @Valid @RequestBody com.quantpos.user.dto.UpdateUserRoleRequest request,
            Authentication authentication) {

        UUID requestingUserId = UUID.fromString(authentication.getName());
        userService.updateUserRole(userId, request.getRole(), requestingUserId);

        return ResponseEntity.ok(ApiResponse.success(null, "User role successfully updated"));
    }

    @PatchMapping("/{userId}/permissions")
    @Operation(summary = "Update user permissions", description = "Allows an OWNER to grant specific granular permissions.")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> updateUserPermissions(
            @PathVariable UUID userId,
            @Valid @RequestBody com.quantpos.user.dto.UpdateUserPermissionsRequest request,
            Authentication authentication) {

        UUID requestingUserId = UUID.fromString(authentication.getName());
        userService.updateUserPermissions(userId, request.getPermissions(), requestingUserId);

        return ResponseEntity.ok(ApiResponse.success(null, "User permissions successfully updated"));
    }
}
