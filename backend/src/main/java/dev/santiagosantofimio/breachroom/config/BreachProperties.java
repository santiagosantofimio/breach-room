package dev.santiagosantofimio.breachroom.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("breach")
public record BreachProperties(
        String flagSecret,
        String sessionSecret,
        String allowedOrigin,
        int trustedProxyHops,
        RateLimit rateLimit) {

    private static final int MINIMUM_SECRET_LENGTH = 32;
    private static final String ANY_ORIGIN = "*";

    public BreachProperties {
        requireStrongSecret("FLAG_SECRET", flagSecret);
        requireStrongSecret("SESSION_SECRET", sessionSecret);
        requireSingleOrigin(allowedOrigin);
    }

    private static void requireStrongSecret(String name, String secret) {
        if (secret == null || secret.length() < MINIMUM_SECRET_LENGTH) {
            throw new IllegalArgumentException(
                    name + " must have at least " + MINIMUM_SECRET_LENGTH + " characters");
        }
    }

    private static void requireSingleOrigin(String origin) {
        if (origin == null || origin.isBlank() || origin.contains(ANY_ORIGIN)) {
            throw new IllegalArgumentException("ALLOWED_ORIGIN must be one explicit origin");
        }
    }

    public record RateLimit(
            long ipCapacity,
            double ipRefillPerSecond,
            long sessionCapacity,
            double sessionRefillPerSecond,
            int maxTrackedKeys) {
    }
}
