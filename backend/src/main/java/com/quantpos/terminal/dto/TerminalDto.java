package com.quantpos.terminal.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TerminalDto {
    private UUID id;
    private String terminalName;
    private Integer terminalNumber;
    private String location;
    private Boolean isActive;
    private String status;
    private String operatorName; // Current logged-in operator if any
    private LocalDateTime sessionStart;
    private LocalDateTime lastConnectedAt;
}
