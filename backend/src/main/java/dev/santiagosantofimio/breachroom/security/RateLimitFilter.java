package dev.santiagosantofimio.breachroom.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.function.Function;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.filter.OncePerRequestFilter;

public class RateLimitFilter extends OncePerRequestFilter {

    private static final String RETRY_AFTER_SECONDS = "1";

    private final RateLimiter limiter;
    private final Function<HttpServletRequest, String> limitKey;

    public RateLimitFilter(RateLimiter limiter, Function<HttpServletRequest, String> limitKey) {
        this.limiter = limiter;
        this.limitKey = limitKey;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String key = limitKey.apply(request);
        if (key == null || limiter.tryAcquire(key)) {
            chain.doFilter(request, response);
            return;
        }
        response.setHeader(HttpHeaders.RETRY_AFTER, RETRY_AFTER_SECONDS);
        JsonError.write(response, HttpStatus.TOO_MANY_REQUESTS, "rate_limited");
    }
}
