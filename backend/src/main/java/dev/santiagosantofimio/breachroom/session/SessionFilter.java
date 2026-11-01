package dev.santiagosantofimio.breachroom.session;

import dev.santiagosantofimio.breachroom.security.JsonError;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

public class SessionFilter extends OncePerRequestFilter {

    public static final String SESSION_HEADER = "X-Breach-Session";
    public static final String SESSION_ATTRIBUTE = "breach.sessionId";

    private final SessionTokens tokens;

    public SessionFilter(SessionTokens tokens) {
        this.tokens = tokens;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Optional<String> sessionId = tokens.verify(request.getHeader(SESSION_HEADER));
        if (sessionId.isEmpty()) {
            JsonError.write(response, HttpStatus.UNAUTHORIZED, "invalid_session");
            return;
        }
        request.setAttribute(SESSION_ATTRIBUTE, sessionId.get());
        chain.doFilter(request, response);
    }
}
