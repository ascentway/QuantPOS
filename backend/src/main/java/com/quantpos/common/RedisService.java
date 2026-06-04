package com.quantpos.common;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.concurrent.TimeUnit;

/**
 * General-purpose Redis cache service for storing, retrieving, and expiring key-value pairs.
 */
@Service
public class RedisService {

    private final RedisTemplate<String, String> redisTemplate;

    public RedisService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void save(String key, String value, long ttlSeconds) {
        redisTemplate.opsForValue().set(key, value, ttlSeconds, TimeUnit.SECONDS);
    }

    public Optional<String> get(String key) {
        return Optional.ofNullable(redisTemplate.opsForValue().get(key));
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public boolean exists(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    /**
     * Atomically increments the counter at key.
     * On first call (value becomes 1) the TTL is set; subsequent increments
     * do NOT reset the TTL, preserving the sliding window.
     *
     * @param ttlSeconds TTL applied only on first creation.
     * @return the value after increment.
     */
    public long increment(String key, long ttlSeconds) {
        Long value = redisTemplate.opsForValue().increment(key);
        if (value == null) value = 1L;
        if (value == 1L) {
            redisTemplate.expire(key, ttlSeconds, TimeUnit.SECONDS);
        }
        return value;
    }

    /**
     * Returns the value at key as long, or 0 if the key does not exist.
     */
    public long getAsLong(String key) {
        return get(key).map(v -> {
            try { return Long.parseLong(v); } catch (NumberFormatException e) { return 0L; }
        }).orElse(0L);
    }

    /**
     * Returns remaining TTL in seconds. -1 if key has no TTL, -2 if key does not exist.
     */
    public long getExpire(String key) {
        Long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        return ttl != null ? ttl : -2L;
    }
}
