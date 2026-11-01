package dev.santiagosantofimio.breachroom.security;

final class TokenBucket {

    private static final double NANOS_PER_SECOND = 1_000_000_000d;

    private final double capacity;
    private final double refillPerNano;
    private double availableTokens;
    private long lastRefillNanos;

    TokenBucket(long capacity, double refillPerSecond, long nowNanos) {
        this.capacity = capacity;
        this.refillPerNano = refillPerSecond / NANOS_PER_SECOND;
        this.availableTokens = capacity;
        this.lastRefillNanos = nowNanos;
    }

    boolean tryConsume(long nowNanos) {
        refill(nowNanos);
        if (availableTokens < 1) {
            return false;
        }
        availableTokens -= 1;
        return true;
    }

    private void refill(long nowNanos) {
        long elapsedNanos = nowNanos - lastRefillNanos;
        availableTokens = Math.min(capacity, availableTokens + elapsedNanos * refillPerNano);
        lastRefillNanos = nowNanos;
    }
}
