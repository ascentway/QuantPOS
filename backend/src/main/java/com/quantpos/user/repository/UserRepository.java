package com.quantpos.user.repository;

import com.quantpos.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.id = :id AND u.tenant.id = :tenantId")
    Optional<User> findByIdAndTenantId(@Param("id") UUID id, @Param("tenantId") UUID tenantId);

    @Query("SELECT u FROM User u WHERE u.tenant.id = :tenantId")
    List<User> findAllByTenantId(@Param("tenantId") UUID tenantId);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE u.tenant.id = :tenantId AND u.role IN :roles")
    List<User> findByTenantIdAndRoleIn(@Param("tenantId") UUID tenantId, @Param("roles") List<com.quantpos.user.model.Role> roles);
}
