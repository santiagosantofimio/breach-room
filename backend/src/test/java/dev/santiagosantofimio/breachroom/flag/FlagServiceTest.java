package dev.santiagosantofimio.breachroom.flag;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dev.santiagosantofimio.breachroom.config.BreachProperties;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import org.junit.jupiter.api.Test;

class FlagServiceTest {

    private static final String SESSION = "session-a";
    private static final String OTHER_SESSION = "session-b";

    private final FlagService flags = new FlagService(new BreachProperties(
            "flag-secret-used-only-in-this-unit-test!",
            "session-secret-used-only-in-this-unit-test",
            "https://game.example.test",
            0,
            null));

    @Test
    void flagFollowsPublishedFormat() {
        assertTrue(flags.flagFor(SESSION, RoomSlug.IDOR).matches("BREACH\\{idor-[0-9a-f]{16}}"));
    }

    @Test
    void flagIsStableForSameSessionAndRoom() {
        assertEquals(flags.flagFor(SESSION, RoomSlug.SQLI), flags.flagFor(SESSION, RoomSlug.SQLI));
    }

    @Test
    void flagDiffersBetweenSessions() {
        assertNotEquals(flags.flagFor(SESSION, RoomSlug.XSS), flags.flagFor(OTHER_SESSION, RoomSlug.XSS));
    }

    @Test
    void flagDiffersBetweenRooms() {
        assertNotEquals(flags.flagFor(SESSION, RoomSlug.XSS), flags.flagFor(SESSION, RoomSlug.JWT));
    }

    @Test
    void matchesOnlyTheExactFlag() {
        String flag = flags.flagFor(SESSION, RoomSlug.RECON);

        assertTrue(flags.matches(SESSION, RoomSlug.RECON, flag));
        assertFalse(flags.matches(SESSION, RoomSlug.RECON, flag.toUpperCase()));
        assertFalse(flags.matches(SESSION, RoomSlug.RECON, flag + " "));
        assertFalse(flags.matches(SESSION, RoomSlug.RECON, ""));
    }
}
