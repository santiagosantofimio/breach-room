package dev.santiagosantofimio.breachroom.security;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.LongSupplier;

public class RateLimiter {

    private static final int INITIAL_CAPACITY = 256;
    private static final float LOAD_FACTOR = 0.75f;

    private final long capacity;
    private final double refillPerSecond;
    private final LongSupplier nanoClock;
    private final Map<String, TokenBucket> bucketsByKey;

    public RateLimiter(long capacity, double refillPerSecond, int maxTrackedKeys, LongSupplier nanoClock) {
        this.capacity = capacity;
        this.refillPerSecond = refillPerSecond;
        this.nanoClock = nanoClock;
        this.bucketsByKey = new LinkedHashMap<>(INITIAL_CAPACITY, LOAD_FACTOR, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, TokenBucket> eldest) {
                return size() > maxTrackedKeys;
            }
        };
    }

    public synchronized boolean tryAcquire(String key) {
        long nowNanos = nanoClock.getAsLong();
        TokenBucket bucket = bucketsByKey.get(key);
        if (bucket == null) {
            bucket = new TokenBucket(capacity, refillPerSecond, nowNanos);
            bucketsByKey.put(key, bucket);
        }
        return bucket.tryConsume(nowNanos);
    }
}
