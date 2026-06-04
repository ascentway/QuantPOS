package com.quantpos.tenant.service;

import com.quantpos.common.ApiException;
import com.quantpos.common.ApiResponse;
import com.quantpos.common.ErrorCodes;
import com.quantpos.tenant.dto.UpdateTenantRequest;
import com.quantpos.tenant.model.Tenant;
import com.quantpos.tenant.repository.TenantRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Service layer for tenant profile operations.
 * Encapsulates all business logic so the controller stays thin.
 */
@Service
@Transactional
public class TenantService {

    private final TenantRepository tenantRepository;

    public TenantService(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Transactional(readOnly = true)
    public ApiResponse<Tenant> getProfile(UUID tenantId) {
        return tenantRepository.findById(tenantId)
                .map(tenant -> ApiResponse.success(tenant, "Tenant profile retrieved"))
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "Tenant not found",
                        ErrorCodes.TENANT_NOT_FOUND, "Tenant not found"));
    }

    public ApiResponse<Tenant> updateProfile(UUID tenantId, UpdateTenantRequest request) {
        return tenantRepository.findById(tenantId)
                .map(tenant -> {
                    tenant.setBusinessName(request.getBusinessName());
                    tenant.setPhoneNumber(request.getPhoneNumber());
                    tenant.setGstin(request.getGstin());
                    tenant.setAddressStreet(request.getAddressStreet());
                    tenant.setAddressCity(request.getAddressCity());
                    tenant.setAddressState(request.getAddressState());
                    tenant.setAddressPincode(request.getAddressPincode());
                    tenant.setTimezone(request.getTimezone());
                    Tenant updatedTenant = tenantRepository.save(tenant);
                    return ApiResponse.success(updatedTenant, "Tenant profile updated");
                })
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "Tenant not found",
                        ErrorCodes.TENANT_NOT_FOUND, "Tenant not found"));
    }
}
