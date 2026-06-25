package com.quantpos.user.service;

import com.quantpos.common.ApiException;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.user.model.Permission;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.UserRepository;
import com.quantpos.auth.service.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private TokenService tokenService;

    @InjectMocks
    private UserService userService;

    private Tenant tenant;
    private User owner;
    private User targetUser;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setId(UUID.randomUUID());

        owner = new User();
        owner.setId(UUID.randomUUID());
        owner.setRole(Role.OWNER);
        owner.setTenant(tenant);

        targetUser = new User();
        targetUser.setId(UUID.randomUUID());
        targetUser.setRole(Role.EMPLOYEE);
        targetUser.setTenant(tenant);
    }

    @Test
    void updateUserRole_byOwner_shouldSucceed() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(userRepository.findById(targetUser.getId())).thenReturn(Optional.of(targetUser));

        userService.updateUserRole(targetUser.getId(), Role.MANAGER, owner.getId());

        assertEquals(Role.MANAGER, targetUser.getRole());
        verify(userRepository).save(targetUser);
        verify(tokenService).invalidateAllUserSessions(targetUser.getId());
    }

    @Test
    void updateUserPermissions_byOwner_shouldSucceed() {
        when(userRepository.findById(owner.getId())).thenReturn(Optional.of(owner));
        when(userRepository.findById(targetUser.getId())).thenReturn(Optional.of(targetUser));

        Set<Permission> permissions = Set.of(Permission.MANAGE_LOYALTY);
        userService.updateUserPermissions(targetUser.getId(), permissions, owner.getId());

        assertEquals(1, targetUser.getPermissions().size());
        assertTrue(targetUser.getPermissions().contains(Permission.MANAGE_LOYALTY));
        verify(userRepository).save(targetUser);
        verify(tokenService).invalidateAllUserSessions(targetUser.getId());
    }

    @Test
    void updateUserRole_byEmployee_shouldFailWithForbidden() {
        User employeeReq = new User();
        employeeReq.setId(UUID.randomUUID());
        employeeReq.setRole(Role.EMPLOYEE);
        employeeReq.setTenant(tenant);

        when(userRepository.findById(employeeReq.getId())).thenReturn(Optional.of(employeeReq));

        ApiException exception = assertThrows(ApiException.class, () -> 
            userService.updateUserRole(targetUser.getId(), Role.MANAGER, employeeReq.getId()));

        assertEquals("Only OWNER can change roles", exception.getMessage());
        verify(userRepository, never()).save(any());
        verify(tokenService, never()).invalidateAllUserSessions(any());
    }
}
