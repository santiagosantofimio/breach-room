package dev.santiagosantofimio.breachroom.rooms.cookiejar;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

final class ProfileCookie {

    static final String NAME = "profile";

    record Profile(String user, String role) {
    }

    private static final String NAME_PREFIX = NAME + "=";
    private static final String GUEST_JSON = "{\"user\":\"guest\",\"role\":\"guest\"}";

    private ProfileCookie() {
    }

    static String guestValue() {
        return Base64.getEncoder().encodeToString(GUEST_JSON.getBytes(StandardCharsets.UTF_8));
    }

    static Optional<Profile> read(String cookieHeader, ObjectMapper json) {
        if (cookieHeader == null || !cookieHeader.startsWith(NAME_PREFIX)) {
            return Optional.empty();
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(cookieHeader.substring(NAME_PREFIX.length()).strip());
            return Optional.of(json.readValue(decoded, Profile.class));
        } catch (IllegalArgumentException | JacksonException malformedCookie) {
            return Optional.empty();
        }
    }
}
