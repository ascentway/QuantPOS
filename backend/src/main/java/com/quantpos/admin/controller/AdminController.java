package com.quantpos.admin.controller;

import com.quantpos.common.ApiResponse;
import com.quantpos.common.ApiException;
import com.quantpos.common.ErrorCodes;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SUPER_ADMIN')")
public class AdminController {

    private final TenantRepository tenantRepository;

    public AdminController(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @GetMapping("/tenants")
    public ResponseEntity<ApiResponse<Page<Tenant>>> getTenants(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<Tenant> tenants = tenantRepository.findAll(PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(tenants, "Tenants retrieved successfully"));
    }

    @GetMapping("/tenants/{id}")
    public ResponseEntity<ApiResponse<Tenant>> getTenant(@PathVariable UUID id) {
        return tenantRepository.findById(id)
                .map(tenant -> ResponseEntity.ok(ApiResponse.success(tenant, "Tenant retrieved successfully")))
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found", ErrorCodes.TENANT_NOT_FOUND, "Tenant not found"));
    }

    @PutMapping("/tenants/{id}/status")
    public ResponseEntity<ApiResponse<Tenant>> updateTenantStatus(@PathVariable UUID id, @RequestBody Map<String, Boolean> payload) {
        Boolean isActive = payload.get("active");
        if (isActive == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Missing 'active' field in payload", ErrorCodes.VALIDATION_FAILED, "Missing 'active' field");
        }

        return tenantRepository.findById(id)
                .map(tenant -> {
                    tenant.setActive(isActive);
                    Tenant updatedTenant = tenantRepository.save(tenant);
                    return ResponseEntity.ok(ApiResponse.success(updatedTenant, "Tenant status updated"));
                })
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tenant not found", ErrorCodes.TENANT_NOT_FOUND, "Tenant not found"));
    }
}
