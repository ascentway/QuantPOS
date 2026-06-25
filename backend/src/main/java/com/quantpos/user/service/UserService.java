package com.quantpos.user.service;

import com.quantpos.common.ErrorCodes;
import com.quantpos.common.ApiException;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.UserRepository;
import com.quantpos.auth.service.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final TokenService tokenService;

    public UserService(UserRepository userRepository, TokenService tokenService) {
        this.userRepository = userRepository;
        this.tokenService = tokenService;
    }

    public void updateUserStatus(UUID targetUserId, boolean isActive, UUID requestingUserId) {
        User requestingUser = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Requesting user not found", ErrorCodes.USER_NOT_FOUND, ""));

        // Only OWNER can activate/deactivate
        if (requestingUser.getRole() != Role.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only OWNER can activate or deactivate users", ErrorCodes.FORBIDDEN, "");
        }

        if (requestingUser.getId().equals(targetUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot activate/deactivate your own account", ErrorCodes.VALIDATION_FAILED, "");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Target user not found", ErrorCodes.USER_NOT_FOUND, ""));

        // Must belong to the same tenant
        if (!requestingUser.getTenant().getId().equals(targetUser.getTenant().getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Target user belongs to a different business", ErrorCodes.FORBIDDEN, "");
        }

        targetUser.setActive(isActive);
        userRepository.save(targetUser);
        tokenService.invalidateAllUserSessions(targetUserId);
    }

    public void updateUserRole(UUID targetUserId, Role newRole, UUID requestingUserId) {
        User requestingUser = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Requesting user not found", ErrorCodes.USER_NOT_FOUND, ""));

        if (requestingUser.getRole() != Role.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only OWNER can change roles", ErrorCodes.FORBIDDEN, "");
        }

        if (requestingUser.getId().equals(targetUserId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot change your own role", ErrorCodes.VALIDATION_FAILED, "");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Target user not found", ErrorCodes.USER_NOT_FOUND, ""));

        if (!requestingUser.getTenant().getId().equals(targetUser.getTenant().getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Target user belongs to a different business", ErrorCodes.FORBIDDEN, "");
        }

        targetUser.setRole(newRole);
        userRepository.save(targetUser);
        tokenService.invalidateAllUserSessions(targetUserId);
    }

    public void updateUserPermissions(UUID targetUserId, java.util.Set<com.quantpos.user.model.Permission> permissions, UUID requestingUserId) {
        User requestingUser = userRepository.findById(requestingUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Requesting user not found", ErrorCodes.USER_NOT_FOUND, ""));

        if (requestingUser.getRole() != Role.OWNER) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only OWNER can update permissions", ErrorCodes.FORBIDDEN, "");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Target user not found", ErrorCodes.USER_NOT_FOUND, ""));

        if (!requestingUser.getTenant().getId().equals(targetUser.getTenant().getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Target user belongs to a different business", ErrorCodes.FORBIDDEN, "");
        }

        targetUser.setPermissions(permissions);
        userRepository.save(targetUser);
        tokenService.invalidateAllUserSessions(targetUserId);
    }

    public java.util.List<com.quantpos.user.dto.UserDto> getTenantUsers(UUID tenantId) {
        return userRepository.findAllByTenantId(tenantId).stream()
                .map(user -> com.quantpos.user.dto.UserDto.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole().name())
                        .isActive(user.isActive())
                        .permissions(user.getPermissions() != null ? 
                                user.getPermissions().stream().map(Enum::name).collect(java.util.stream.Collectors.toSet()) 
                                : new java.util.HashSet<>())
                        .status(user.isActive() ? "offline" : "offline") // Defaulting to offline until websocket
                        .build())
                .collect(java.util.stream.Collectors.toList());
    }
}
