package com.quantpos.terminal.service;

import com.quantpos.common.ApiException;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import com.quantpos.terminal.model.Terminal;
import com.quantpos.terminal.repository.TerminalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TerminalService {

    private final TerminalRepository terminalRepository;
    private final TenantRepository tenantRepository;

    @Transactional
    public Terminal registerTerminal(UUID tenantId, String terminalName, String location, String deviceId) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found", "TENANT_NOT_FOUND", null));

        long activeTerminals = terminalRepository.countByTenantIdAndIsActiveTrue(tenantId);
        if (activeTerminals >= tenant.getTerminalLimit()) {
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED, 
                    "Terminal limit reached. Upgrade your subscription to add more terminals.", 
                    "TERMINAL_LIMIT_EXCEEDED", null);
        }

        int nextTerminalNumber = (int) activeTerminals + 1;

        Terminal terminal = Terminal.builder()
                .tenant(tenant)
                .terminalName(terminalName)
                .terminalNumber(nextTerminalNumber)
                .location(location)
                .deviceId(deviceId)
                .isActive(true)
                .status("ONLINE")
                .build();

        return terminalRepository.save(terminal);
    }
}
