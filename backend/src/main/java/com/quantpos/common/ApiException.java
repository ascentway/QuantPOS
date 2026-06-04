package com.quantpos.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String code;
    private final String details;

    public ApiException(HttpStatus status, String message, String code, String details) {
        super(message);
        this.status = status;
        this.code = code;
        this.details = details;
    }
}
