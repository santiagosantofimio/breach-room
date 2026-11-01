package dev.santiagosantofimio.breachroom.security;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

public final class JsonError {

    private JsonError() {
    }

    public static void write(HttpServletResponse response, HttpStatus status, String code) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"error\":\"" + code + "\"}");
    }
}
