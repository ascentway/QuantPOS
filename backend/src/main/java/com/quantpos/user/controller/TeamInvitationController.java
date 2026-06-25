package com.quantpos.user.controller;

import com.quantpos.auth.dto.AcceptInviteRequest;
import com.quantpos.auth.dto.InviteStaffRequest;
import com.quantpos.common.ApiResponse;
import com.quantpos.multitenancy.TenantContext;
import com.quantpos.user.dto.InvitationDto;
import com.quantpos.user.service.TeamInvitationService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class TeamInvitationController {

    private final TeamInvitationService teamInvitationService;

    @PostMapping("/invite")
    @Operation(summary = "Invite a new staff member (Owner only)")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> inviteStaff(
            @Valid @RequestBody InviteStaffRequest request,
            Authentication authentication) {
        UUID inviterId = UUID.fromString(authentication.getName());
        teamInvitationService.inviteStaff(TenantContext.getTenantId(), request, inviterId);
        return ResponseEntity.ok(ApiResponse.success(null, "Invitation sent successfully"));
    }

    @GetMapping("/invitations")
    @Operation(summary = "Get all invitations for this tenant (Owner only)")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<List<InvitationDto>>> getInvitations() {
        List<InvitationDto> invitations = teamInvitationService.getInvitations(TenantContext.getTenantId());
        return ResponseEntity.ok(ApiResponse.success(invitations, "Invitations fetched"));
    }

    @PostMapping("/invitations/{id}/resend")
    @Operation(summary = "Resend an invitation (Owner only)")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> resendInvitation(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID requesterId = UUID.fromString(authentication.getName());
        teamInvitationService.resendInvitation(id, requesterId);
        return ResponseEntity.ok(ApiResponse.success(null, "Invitation resent successfully"));
    }

    @DeleteMapping("/invitations/{id}")
    @Operation(summary = "Revoke an invitation (Owner only)")
    @PreAuthorize("hasRole('OWNER')")
    public ResponseEntity<ApiResponse<Void>> revokeInvitation(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID requesterId = UUID.fromString(authentication.getName());
        teamInvitationService.revokeInvitation(id, requesterId);
        return ResponseEntity.ok(ApiResponse.success(null, "Invitation revoked successfully"));
    }

    @PostMapping("/accept-invite")
    @Operation(summary = "Accept an invitation and create an account")
    public ResponseEntity<ApiResponse<Void>> acceptInvitation(@Valid @RequestBody AcceptInviteRequest request) {
        teamInvitationService.acceptInvitation(request);
        return ResponseEntity.ok(ApiResponse.success(null, "Invitation accepted. You can now log in."));
    }
}
