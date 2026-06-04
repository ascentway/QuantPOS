package com.quantpos.tenant.controller;

import com.quantpos.common.ApiResponse;
import com.quantpos.multitenancy.TenantContext;
import com.quantpos.tenant.dto.UpdateTenantRequest;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.service.TenantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tenant")
@Tag(name = "Tenant Management", description = "Endpoints for retrieving and updating tenant profile details")
public class TenantController {

    private final TenantService tenantService;

    public TenantController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    @GetMapping("/profile")
    @PreAuthorize("hasAnyRole('OWNER', 'MANAGER')")
    @Operation(summary = "Get the profile of the current tenant")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tenant profile retrieved successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tenant not found")
    public ResponseEntity<ApiResponse<Tenant>> getProfile() {
        return ResponseEntity.ok(tenantService.getProfile(TenantContext.getTenantId()));
    }

    @PutMapping("/profile")
    @PreAuthorize("hasRole('OWNER')")
    @Operation(summary = "Update the profile of the current tenant")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Tenant profile updated successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Tenant not found")
    public ResponseEntity<ApiResponse<Tenant>> updateProfile(@Valid @RequestBody UpdateTenantRequest request) {
        return ResponseEntity.ok(tenantService.updateProfile(TenantContext.getTenantId(), request));
    }
}
