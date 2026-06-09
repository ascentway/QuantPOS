package com.quantpos.terminal.repository;

import com.quantpos.terminal.model.Terminal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TerminalRepository extends JpaRepository<Terminal, UUID> {
    long countByTenantIdAndIsActiveTrue(UUID tenantId);
}
