package dev.santiagosantofimio.breachroom.security;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Collections;
import java.util.List;

public class ClientIpResolver {

    private static final String FORWARDED_FOR_HEADER = "X-Forwarded-For";

    private final int trustedProxyHops;

    public ClientIpResolver(int trustedProxyHops) {
        this.trustedProxyHops = trustedProxyHops;
    }

    public String resolve(HttpServletRequest request) {
        List<String> headerValues = Collections.list(request.getHeaders(FORWARDED_FOR_HEADER));
        if (trustedProxyHops == 0 || headerValues.isEmpty()) {
            return request.getRemoteAddr();
        }
        String[] forwardingChain = String.join(",", headerValues).split(",");
        int clientPosition = Math.max(0, forwardingChain.length - trustedProxyHops);
        return forwardingChain[clientPosition].strip();
    }
}
