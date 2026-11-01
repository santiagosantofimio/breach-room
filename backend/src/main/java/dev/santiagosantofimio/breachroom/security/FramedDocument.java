package dev.santiagosantofimio.breachroom.security;

import jakarta.servlet.http.HttpServletRequest;

public final class FramedDocument {

    public static final String PATH = "/api/rooms/xss/inbox";

    private FramedDocument() {
    }

    public static boolean isRequestFor(HttpServletRequest request) {
        return PATH.equals(request.getRequestURI());
    }
}
