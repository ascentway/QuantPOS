package com.quantpos.terminal.service;

import com.quantpos.billing.model.Subscription;
import com.quantpos.billing.repository.SubscriptionRepository;
import com.quantpos.common.ApiException;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import com.quantpos.terminal.dto.CreateTerminalRequest;
import com.quantpos.terminal.dto.TerminalDto;
import com.quantpos.terminal.model.Terminal;
import com.quantpos.terminal.repository.TerminalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TerminalService {

    private final TerminalRepository terminalRepository;
    private final TenantRepository tenantRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Transactional
    public TerminalDto createTerminal(UUID tenantId, CreateTerminalRequest request) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found", "TENANT_NOT_FOUND", null));

        // Enforce Subscription Limit
        Subscription subscription = subscriptionRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ApiException(HttpStatus.PAYMENT_REQUIRED, "Active subscription required to add terminals", "SUBSCRIPTION_REQUIRED", null));

        if (subscription.getStatus() != com.quantpos.tenant.model.SubscriptionStatus.ACTIVE) {
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED, "Your subscription is not active", "SUBSCRIPTION_INACTIVE", null);
        }

        long activeTerminals = terminalRepository.countByTenantIdAndIsActiveTrue(tenantId);
        if (activeTerminals >= subscription.getTerminalLimit()) {
            throw new ApiException(HttpStatus.FORBIDDEN, 
                "Terminal limit reached. Your plan allows " + subscription.getTerminalLimit() + " terminals.", 
                "TERMINAL_LIMIT_EXCEEDED", null);
        }

        // Validate uniqueness of terminal name
        if (terminalRepository.existsByTenantIdAndTerminalNameIgnoreCase(tenantId, request.getTerminalName())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Terminal name already in use", "TERMINAL_NAME_EXISTS", null);
        }

        // Auto-assign the next terminal number
        int nextNumber = terminalRepository.findTopByTenantIdOrderByTerminalNumberDesc(tenantId)
                .map(t -> t.getTerminalNumber() + 1)
                .orElse(1);

        Terminal terminal = new Terminal();
        terminal.setTenant(tenant);
        terminal.setTerminalName(request.getTerminalName());
        terminal.setTerminalNumber(nextNumber);
        terminal.setLocation(request.getLocation());
        terminal.setDeviceId(request.getDeviceId());
        terminal.setStatus("IDLE"); // IDLE when first created
        terminal.setIsActive(true);

        Terminal saved = terminalRepository.save(terminal);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<TerminalDto> getAllTerminals(UUID tenantId) {
        return terminalRepository.findByTenantId(tenantId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TerminalDto toggleLock(UUID tenantId, UUID terminalId) {
        Terminal terminal = terminalRepository.findByTenantIdAndId(tenantId, terminalId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Terminal not found", "TERMINAL_NOT_FOUND", null));

        if ("LOCKED".equals(terminal.getStatus())) {
            terminal.setStatus("IDLE");
        } else {
            terminal.setStatus("LOCKED");
            // Here you would also kill any active websocket session or JWT tied to this terminal
        }

        return mapToDto(terminalRepository.save(terminal));
    }

    private TerminalDto mapToDto(Terminal t) {
        return TerminalDto.builder()
                .id(t.getId())
                .terminalName(t.getTerminalName())
                .terminalNumber(t.getTerminalNumber())
                .location(t.getLocation())
                .isActive(t.getIsActive())
                .status(t.getStatus())
                .lastConnectedAt(t.getLastConnectedAt())
                .build();
    }
}
