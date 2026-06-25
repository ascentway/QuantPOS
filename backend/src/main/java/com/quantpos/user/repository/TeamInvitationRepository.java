package com.quantpos.user.repository;

import com.quantpos.user.model.TeamInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamInvitationRepository extends JpaRepository<TeamInvitation, UUID> {
    Optional<TeamInvitation> findByInvitationToken(String token);
    boolean existsByTenantIdAndEmailIgnoreCaseAndStatus(UUID tenantId, String email, String status);
    Optional<TeamInvitation> findByTenantIdAndEmailIgnoreCaseAndStatus(UUID tenantId, String email, String status);
    List<TeamInvitation> findAllByTenantIdOrderByCreatedAtDesc(UUID tenantId);
}
