package dev.santiagosantofimio.breachroom.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;

class RateLimiterTest {

    private static final long ONE_SECOND_NANOS = 1_000_000_000L;

    private final AtomicLong clock = new AtomicLong();

    @Test
    void burstIsLimitedToCapacity() {
        RateLimiter limiter = new RateLimiter(2, 1, 10, clock::get);

        assertTrue(limiter.tryAcquire("client"));
        assertTrue(limiter.tryAcquire("client"));
        assertFalse(limiter.tryAcquire("client"));
    }

    @Test
    void tokensRefillOverTime() {
        RateLimiter limiter = new RateLimiter(1, 1, 10, clock::get);
        assertTrue(limiter.tryAcquire("client"));
        assertFalse(limiter.tryAcquire("client"));

        clock.addAndGet(ONE_SECOND_NANOS);

        assertTrue(limiter.tryAcquire("client"));
    }

    @Test
    void refillNeverExceedsCapacity() {
        RateLimiter limiter = new RateLimiter(1, 1, 10, clock::get);
        assertTrue(limiter.tryAcquire("client"));

        clock.addAndGet(60 * ONE_SECOND_NANOS);

        assertTrue(limiter.tryAcquire("client"));
        assertFalse(limiter.tryAcquire("client"));
    }

    @Test
    void trackedKeysStayBoundedByEvictingTheLeastRecentlyUsed() {
        RateLimiter limiter = new RateLimiter(1, 0, 2, clock::get);
        assertTrue(limiter.tryAcquire("first"));
        assertTrue(limiter.tryAcquire("second"));
        assertTrue(limiter.tryAcquire("third"));

        assertTrue(limiter.tryAcquire("first"));
        assertFalse(limiter.tryAcquire("third"));
    }
}
