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
    public ResponseEntity<ApiResponse<Void>> updateUserStatus(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateUserStatusRequest request,
            Authentication authentication) {

        UUID requestingUserId = UUID.fromString(authentication.getName());
        userService.updateUserStatus(userId, request.getIsActive(), requestingUserId);

        String action = request.getIsActive() ? "activated" : "deactivated";
        return ResponseEntity.ok(ApiResponse.success(null, "User successfully " + action));
    }
}
