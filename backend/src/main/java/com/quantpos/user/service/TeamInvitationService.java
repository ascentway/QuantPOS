package com.quantpos.user.service;

import com.quantpos.auth.dto.AcceptInviteRequest;
import com.quantpos.auth.dto.InviteStaffRequest;
import com.quantpos.auth.service.EmailService;
import com.quantpos.common.ApiException;
import com.quantpos.config.AppProperties;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import com.quantpos.user.dto.InvitationDto;
import com.quantpos.user.model.Role;
import com.quantpos.user.model.TeamInvitation;
import com.quantpos.user.model.User;
import com.quantpos.user.repository.TeamInvitationRepository;
import com.quantpos.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamInvitationService {

    private final TeamInvitationRepository teamInvitationRepository;
    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AppProperties appProperties;

    @Transactional
    public void inviteStaff(UUID tenantId, InviteStaffRequest request, UUID inviterId) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User with this email already exists", "EMAIL_EXISTS", null);
        }

        // If an existing PENDING invitation exists, expire it and create a fresh one
        teamInvitationRepository.findByTenantIdAndEmailIgnoreCaseAndStatus(tenantId, request.getEmail(), "PENDING")
                .ifPresent(existing -> {
                    existing.setStatus("EXPIRED");
                    teamInvitationRepository.save(existing);
                });

        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found", "TENANT_NOT_FOUND", null));

        User inviter = userRepository.findById(inviterId).orElse(null);

        String token = generateSecureToken();

        TeamInvitation invitation = new TeamInvitation();
        invitation.setTenant(tenant);
        invitation.setEmail(request.getEmail().toLowerCase());
        invitation.setFullName(request.getFullName());
        invitation.setRole(request.getRole());
        invitation.setInvitationToken(token);
        invitation.setExpiresAt(LocalDateTime.now().plusHours(1)); // Expires in 1 hour
        invitation.setInvitedBy(inviter);

        teamInvitationRepository.save(invitation);

        // Send invitation email
        String acceptUrl = appProperties.getBaseUrl() + "/accept-invite?token=" + token;
        String fullName = request.getFullName() != null ? request.getFullName() : "there";
        emailService.sendStaffInvitationEmail(request.getEmail(), fullName, tenant.getBusinessName(), acceptUrl);
        log.info("Invitation email sent to {} for tenant {}", request.getEmail(), tenantId);
    }

    @Transactional
    public void resendInvitation(UUID invitationId, UUID requesterId) {
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitation not found", "NOT_FOUND", null));

        if ("ACCEPTED".equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This invitation has already been accepted", "ALREADY_ACCEPTED", null);
        }

        if ("REVOKED".equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This invitation has been revoked and cannot be resent", "REVOKED", null);
        }

        // Re-generate token and reset expiry
        String token = generateSecureToken();
        invitation.setInvitationToken(token);
        invitation.setExpiresAt(LocalDateTime.now().plusHours(1));
        invitation.setStatus("PENDING");
        teamInvitationRepository.save(invitation);

        // Re-send email
        String acceptUrl = appProperties.getBaseUrl() + "/accept-invite?token=" + token;
        String fullName = invitation.getFullName() != null ? invitation.getFullName() : "there";
        emailService.sendStaffInvitationEmail(invitation.getEmail(), fullName, invitation.getTenant().getBusinessName(), acceptUrl);
        log.info("Invitation resent to {} (id={})", invitation.getEmail(), invitationId);
    }

    @Transactional
    public void revokeInvitation(UUID invitationId, UUID requesterId) {
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Invitation not found", "NOT_FOUND", null));

        if ("ACCEPTED".equals(invitation.getStatus())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot revoke an already accepted invitation", "ALREADY_ACCEPTED", null);
        }

        invitation.setStatus("REVOKED");
        teamInvitationRepository.save(invitation);
        log.info("Invitation revoked for {} (id={})", invitation.getEmail(), invitationId);
    }

    public List<InvitationDto> getInvitations(UUID tenantId) {
        return teamInvitationRepository.findAllByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(inv -> InvitationDto.builder()
                        .id(inv.getId())
                        .email(inv.getEmail())
                        .fullName(inv.getFullName())
                        .role(inv.getRole() != null ? inv.getRole().name() : null)
                        .status(inv.getStatus())
                        .invitedByName(inv.getInvitedBy() != null ? inv.getInvitedBy().getFullName() : null)
                        .createdAt(inv.getCreatedAt())
                        .expiresAt(inv.getExpiresAt())
                        .acceptedAt(inv.getAcceptedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void acceptInvitation(AcceptInviteRequest request) {
        TeamInvitation invitation = teamInvitationRepository.findByInvitationToken(request.getToken())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired invitation token", "INVALID_TOKEN", null));

        if (!("PENDING".equals(invitation.getStatus()))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "This invitation has already been processed", "INVALID_TOKEN", null);
        }

        if (invitation.getExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus("EXPIRED");
            teamInvitationRepository.save(invitation);
            throw new ApiException(HttpStatus.BAD_REQUEST, "This invitation has expired. Please ask your owner to resend it.", "EXPIRED_TOKEN", null);
        }

        if (userRepository.existsByEmail(invitation.getEmail())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "An account with this email already exists", "EMAIL_EXISTS", null);
        }

        // Create the user account
        User user = User.builder()
                .tenant(invitation.getTenant())
                .email(invitation.getEmail())
                .fullName(request.getFullName())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(invitation.getRole())
                .isEmailVerified(true) // Verified since they received the invite email
                .isActive(true)
                .build();

        userRepository.save(user);

        // Mark invitation as accepted
        invitation.setStatus("ACCEPTED");
        invitation.setAcceptedAt(LocalDateTime.now());
        teamInvitationRepository.save(invitation);
    }

    private String generateSecureToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
