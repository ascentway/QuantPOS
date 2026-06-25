package com.quantpos.terminal.model;

import com.quantpos.tenant.model.Tenant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "terminals")
@Getter
@Setter
public class Terminal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private Tenant tenant;

    @Column(name = "terminal_name", nullable = false, length = 100)
    private String terminalName;

    @Column(name = "terminal_number", nullable = false)
    private Integer terminalNumber;

    @Column(length = 255)
    private String location;

    @Column(name = "device_id", length = 255)
    private String deviceId;

    @Column(name = "last_ip_address", length = 45)
    private String lastIpAddress;

    @Column(name = "last_connected_at")
    private LocalDateTime lastConnectedAt;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(length = 50)
    private String status; // ONLINE, OFFLINE, ERROR, LOCKED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
