package dev.santiagosantofimio.breachroom.session;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dev.santiagosantofimio.breachroom.config.BreachProperties;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class SessionTokensTest {

    private static final String SESSION_SECRET = "session-secret-used-only-in-this-unit-test";
    private static final String OTHER_SESSION_SECRET = "another-session-secret-used-only-in-this-test";

    private final SessionTokens tokens = tokensSignedWith(SESSION_SECRET);

    private static SessionTokens tokensSignedWith(String sessionSecret) {
        return new SessionTokens(new BreachProperties(
                "flag-secret-used-only-in-this-unit-test!",
                sessionSecret,
                "https://game.example.test",
                0,
                null));
    }

    @Test
    void issuedTokenVerifiesToItsSessionId() {
        String token = tokens.issue();
        String expectedSessionId = token.substring(0, token.indexOf('.'));

        assertEquals(expectedSessionId, tokens.verify(token).orElseThrow());
    }

    @Test
    void sessionIdCarries128RandomBits() {
        String first = tokens.verify(tokens.issue()).orElseThrow();
        String second = tokens.verify(tokens.issue()).orElseThrow();

        assertEquals(16, Base64.getUrlDecoder().decode(first).length);
        assertNotEquals(first, second);
    }

    @Test
    void tokenSignedWithAnotherSecretIsRejected() {
        String forgedToken = tokensSignedWith(OTHER_SESSION_SECRET).issue();

        assertTrue(tokens.verify(forgedToken).isEmpty());
    }

    @Test
    void sessionIdSwappedUnderValidSignatureIsRejected() {
        String victim = tokens.issue();
        String attacker = tokens.issue();
        String spliced = attacker.substring(0, attacker.indexOf('.')) + victim.substring(victim.indexOf('.'));

        assertTrue(tokens.verify(spliced).isEmpty());
    }

    @Test
    void missingTokenIsRejected() {
        assertTrue(tokens.verify(null).isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"", ".", "a.b", "no-separator", "a.b.c", "%%%.%%%", "AAAAAAAAAAAAAAAAAAAAAA."})
    void malformedTokenIsRejected(String malformedToken) {
        assertTrue(tokens.verify(malformedToken).isEmpty());
    }
}
