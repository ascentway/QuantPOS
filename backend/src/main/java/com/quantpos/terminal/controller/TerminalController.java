package com.quantpos.terminal.controller;

import com.quantpos.common.ApiResponse;
import com.quantpos.multitenancy.TenantContext;
import com.quantpos.terminal.dto.CreateTerminalRequest;
import com.quantpos.terminal.dto.TerminalDto;
import com.quantpos.terminal.service.TerminalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/terminals")
@RequiredArgsConstructor
public class TerminalController {

    private final TerminalService terminalService;

    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<TerminalDto>> createTerminal(@Valid @RequestBody CreateTerminalRequest request) {
        TerminalDto created = terminalService.createTerminal(TenantContext.getTenantId(), request);
        return ResponseEntity.ok(ApiResponse.success(created, "Terminal created successfully"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<List<TerminalDto>>> getAllTerminals() {
        List<TerminalDto> terminals = terminalService.getAllTerminals(TenantContext.getTenantId());
        return ResponseEntity.ok(ApiResponse.success(terminals, "Terminals retrieved successfully"));
    }

    @PatchMapping("/{terminalId}/lock")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<TerminalDto>> toggleLock(@PathVariable UUID terminalId) {
        TerminalDto updated = terminalService.toggleLock(TenantContext.getTenantId(), terminalId);
        return ResponseEntity.ok(ApiResponse.success(updated, "Terminal status updated"));
    }
}
