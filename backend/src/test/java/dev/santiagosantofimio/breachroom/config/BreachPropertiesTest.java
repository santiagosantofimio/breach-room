package dev.santiagosantofimio.breachroom.config;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class BreachPropertiesTest {

    private static final String STRONG_SECRET = "a-secret-with-at-least-thirty-two-chars";
    private static final String ORIGIN = "https://game.example.test";

    @Test
    void strongSecretsAndOneOriginAreAccepted() {
        assertDoesNotThrow(() -> new BreachProperties(STRONG_SECRET, STRONG_SECRET, ORIGIN, 0, null));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "too-short")
    void weakFlagSecretStopsStartup(String weakSecret) {
        assertThrows(
                IllegalArgumentException.class,
                () -> new BreachProperties(weakSecret, STRONG_SECRET, ORIGIN, 0, null));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = "too-short")
    void weakSessionSecretStopsStartup(String weakSecret) {
        assertThrows(
                IllegalArgumentException.class,
                () -> new BreachProperties(STRONG_SECRET, weakSecret, ORIGIN, 0, null));
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"*", "https://*.example.test"})
    void wildcardOrMissingOriginStopsStartup(String origin) {
        assertThrows(
                IllegalArgumentException.class,
                () -> new BreachProperties(STRONG_SECRET, STRONG_SECRET, origin, 0, null));
    }
}
