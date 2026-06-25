package com.quantpos.terminal.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateTerminalRequest {
    
    @NotBlank(message = "Terminal name is required")
    private String terminalName;
    
    private String location;
    
    private String deviceId;
}
