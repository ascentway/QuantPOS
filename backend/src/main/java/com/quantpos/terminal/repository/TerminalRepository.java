package com.quantpos.terminal.repository;

import com.quantpos.terminal.model.Terminal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TerminalRepository extends JpaRepository<Terminal, UUID> {
    List<Terminal> findByTenantId(UUID tenantId);
    Optional<Terminal> findByTenantIdAndId(UUID tenantId, UUID id);
    long countByTenantIdAndIsActiveTrue(UUID tenantId);
    boolean existsByTenantIdAndTerminalNameIgnoreCase(UUID tenantId, String terminalName);
    Optional<Terminal> findTopByTenantIdOrderByTerminalNumberDesc(UUID tenantId);
}
