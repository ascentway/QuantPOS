package com.quantpos.common;

public final class ErrorCodes {

    private ErrorCodes() {}

    public static final String INVALID_CREDENTIALS   = "INVALID_CREDENTIALS";
    public static final String TOKEN_EXPIRED         = "TOKEN_EXPIRED";
    public static final String TOKEN_INVALID         = "TOKEN_INVALID";
    public static final String EMAIL_NOT_VERIFIED    = "EMAIL_NOT_VERIFIED";
    public static final String ACCOUNT_INACTIVE      = "ACCOUNT_INACTIVE";
    public static final String EMAIL_ALREADY_EXISTS  = "EMAIL_ALREADY_EXISTS";
    public static final String TENANT_NOT_FOUND      = "TENANT_NOT_FOUND";
    public static final String USER_NOT_FOUND        = "USER_NOT_FOUND";
    public static final String VALIDATION_FAILED     = "VALIDATION_FAILED";
    public static final String UNAUTHORIZED          = "UNAUTHORIZED";
    public static final String FORBIDDEN             = "FORBIDDEN";

    // OTP / 2FA / Rate-limiting codes
    public static final String OTP_INVALID           = "OTP_INVALID";
    public static final String OTP_LOCKED            = "OTP_LOCKED";
    public static final String TWO_FA_REQUIRED       = "TWO_FA_REQUIRED";
    public static final String RATE_LIMITED          = "RATE_LIMITED";
}
