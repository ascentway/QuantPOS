package com.quantpos.config;

/**
 * @deprecated Moved to {@link com.quantpos.common.RedisService}.
 * This class is intentionally empty and kept only to prevent stale import errors
 * during incremental migration. Remove this file once all imports are updated.
 */
@Deprecated(forRemoval = true)
public final class RedisService {
    private RedisService() {
        throw new UnsupportedOperationException(
            "Use com.quantpos.common.RedisService instead.");
    }
}
