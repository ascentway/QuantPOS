package com.quantpos.multitenancy;

import com.quantpos.user.model.Role;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Central helper that enables and disables the Hibernate {@code tenantFilter}
 * on the current JPA Session for all annotated entities.
 *
 * <p>Called by {@link com.quantpos.auth.security.JwtFilter} after successful
 * JWT validation to automatically scope all JPA queries to the authenticated
 * tenant without requiring developers to add {@code WHERE tenant_id = ?}
 * manually to every repository method.
 *
 * <p><b>SUPER_ADMIN bypass:</b> When the authenticated user has the
 * {@link Role#SUPER_ADMIN} role, the filter is intentionally NOT enabled,
 * allowing cross-tenant reads for administrative operations.
 */
@Component
@Slf4j
public class TenantFilterActivator {

    /** Name must match the @FilterDef name on each entity */
    public static final String TENANT_FILTER_NAME = "tenantFilter";

    private final EntityManager entityManager;

    public TenantFilterActivator(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    /**
     * Enables the Hibernate tenant filter for the current session.
     * Call this after setting TenantContext but before any JPA queries.
     *
     * @param tenantId   The authenticated tenant UUID
     * @param userRole   The authenticated user's role — SUPER_ADMIN skips the filter
     */
    public void enableForSession(UUID tenantId, Role userRole) {
        if (userRole == Role.SUPER_ADMIN) {
            log.debug("SUPER_ADMIN detected — tenant filter bypassed (cross-tenant access allowed)");
            return;
        }
        Session session = entityManager.unwrap(Session.class);
        Filter filter   = session.enableFilter(TENANT_FILTER_NAME);
        filter.setParameter("tenantId", tenantId);
        log.debug("Tenant Hibernate filter enabled | tenantId={}", tenantId);
    }

    /**
     * Disables the Hibernate tenant filter for the current session.
     * Called in the finally block of JwtFilter.
     */
    public void disableForSession() {
        try {
            Session session = entityManager.unwrap(Session.class);
            session.disableFilter(TENANT_FILTER_NAME);
        } catch (Exception e) {
            // Session may already be closed — log at debug, do not rethrow
            log.debug("Could not disable tenant filter (session may be closed): {}", e.getMessage());
        }
    }
}
