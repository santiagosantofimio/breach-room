package dev.santiagosantofimio.breachroom.config;

import dev.santiagosantofimio.breachroom.security.BodySizeLimitFilter;
import dev.santiagosantofimio.breachroom.security.ClientIpResolver;
import dev.santiagosantofimio.breachroom.security.RateLimitFilter;
import dev.santiagosantofimio.breachroom.security.RateLimiter;
import dev.santiagosantofimio.breachroom.security.SecurityHeadersFilter;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import dev.santiagosantofimio.breachroom.session.SessionTokens;
import jakarta.servlet.Filter;
import java.time.Duration;
import java.util.List;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration(proxyBeanMethods = false)
public class FilterConfig {

    private static final String ALL_PATHS = "/*";
    private static final String API_PATHS = "/api/*";
    private static final String ROOM_PATHS = "/api/rooms/*";
    private static final Duration PREFLIGHT_CACHE = Duration.ofMinutes(10);

    @Bean
    FilterRegistrationBean<SecurityHeadersFilter> securityHeadersFilter() {
        return registration(new SecurityHeadersFilter(), 1, ALL_PATHS);
    }

    @Bean
    FilterRegistrationBean<CorsFilter> corsFilter(BreachProperties properties) {
        return registration(new CorsFilter(corsSource(properties.allowedOrigin())), 2, ALL_PATHS);
    }

    @Bean
    FilterRegistrationBean<RateLimitFilter> ipRateLimitFilter(BreachProperties properties) {
        BreachProperties.RateLimit limits = properties.rateLimit();
        RateLimiter limiter = new RateLimiter(
                limits.ipCapacity(), limits.ipRefillPerSecond(), limits.maxTrackedKeys(), System::nanoTime);
        ClientIpResolver clientIps = new ClientIpResolver(properties.trustedProxyHops());
        return registration(new RateLimitFilter(limiter, clientIps::resolve), 3, API_PATHS);
    }

    @Bean
    FilterRegistrationBean<BodySizeLimitFilter> bodySizeLimitFilter() {
        return registration(new BodySizeLimitFilter(), 4, API_PATHS);
    }

    @Bean
    FilterRegistrationBean<SessionFilter> sessionFilter(SessionTokens tokens) {
        return registration(new SessionFilter(tokens), 5, ROOM_PATHS);
    }

    @Bean
    FilterRegistrationBean<RateLimitFilter> sessionRateLimitFilter(BreachProperties properties) {
        BreachProperties.RateLimit limits = properties.rateLimit();
        RateLimiter limiter = new RateLimiter(
                limits.sessionCapacity(), limits.sessionRefillPerSecond(), limits.maxTrackedKeys(), System::nanoTime);
        return registration(
                new RateLimitFilter(limiter, request -> (String) request.getAttribute(SessionFilter.SESSION_ATTRIBUTE)),
                6,
                ROOM_PATHS);
    }

    private static UrlBasedCorsConfigurationSource corsSource(String allowedOrigin) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(allowedOrigin));
        configuration.setAllowedMethods(List.of("GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"));
        configuration.setAllowedHeaders(List.of(CorsConfiguration.ALL));
        configuration.setExposedHeaders(List.of(CorsConfiguration.ALL));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(PREFLIGHT_CACHE);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }

    private static <F extends Filter> FilterRegistrationBean<F> registration(F filter, int order, String pathPattern) {
        FilterRegistrationBean<F> registration = new FilterRegistrationBean<>(filter);
        registration.setOrder(order);
        registration.addUrlPatterns(pathPattern);
        return registration;
    }
}
