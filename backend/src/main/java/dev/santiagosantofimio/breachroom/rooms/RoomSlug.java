package dev.santiagosantofimio.breachroom.rooms;

import java.util.Arrays;
import java.util.Optional;

public enum RoomSlug {
    RECON("recon"),
    CHECKOUT("checkout"),
    COOKIEJAR("cookiejar"),
    IDOR("idor"),
    SQLI("sqli"),
    XSS("xss"),
    TRAVERSAL("traversal"),
    JWT("jwt"),
    CMDINJECTION("cmdinjection");

    private final String slug;

    RoomSlug(String slug) {
        this.slug = slug;
    }

    public String slug() {
        return slug;
    }

    public static Optional<RoomSlug> fromSlug(String slug) {
        return Arrays.stream(values())
                .filter(room -> room.slug.equals(slug))
                .findFirst();
    }
}
