package com.quantpos.user.service;

import com.quantpos.common.ErrorCodes;
import com.quantpos.common.ApiException;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
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
    }
}
