package com.quantpos.terminal.controller;

import com.quantpos.common.ApiResponse;
import com.quantpos.multitenancy.TenantContext;
import com.quantpos.terminal.model.Terminal;
import com.quantpos.terminal.service.TerminalService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/terminals")
@RequiredArgsConstructor
public class TerminalController {

    private final TerminalService terminalService;

    @PostMapping("/register")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    public ResponseEntity<ApiResponse<Terminal>> registerTerminal(@Valid @RequestBody RegisterTerminalRequest request) {
        Terminal terminal = terminalService.registerTerminal(
                TenantContext.getTenantId(),
                request.getTerminalName(),
                request.getLocation(),
                request.getDeviceId()
        );
        return ResponseEntity.ok(ApiResponse.success(terminal, "Terminal registered successfully"));
    }
}

@Data
class RegisterTerminalRequest {
    @NotBlank
    private String terminalName;
    @NotBlank
    private String location;
    @NotBlank
    private String deviceId;
}
