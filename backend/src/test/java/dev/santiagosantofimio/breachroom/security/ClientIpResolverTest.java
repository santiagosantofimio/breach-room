package dev.santiagosantofimio.breachroom.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

class ClientIpResolverTest {

    private static final String SOCKET_ADDRESS = "10.0.0.1";

    private static MockHttpServletRequest requestForwardedFor(String... headerValues) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(SOCKET_ADDRESS);
        for (String value : headerValues) {
            request.addHeader("X-Forwarded-For", value);
        }
        return request;
    }

    @Test
    void withoutTrustedProxiesTheHeaderIsIgnored() {
        assertEquals(SOCKET_ADDRESS, new ClientIpResolver(0).resolve(requestForwardedFor("203.0.113.9")));
    }

    @Test
    void withoutTheHeaderTheSocketAddressIsUsed() {
        assertEquals(SOCKET_ADDRESS, new ClientIpResolver(1).resolve(requestForwardedFor()));
    }

    @Test
    void valuesAddedByTheClientCannotShiftTheResolvedAddress() {
        String spoofedChain = "1.1.1.1, 2.2.2.2, 203.0.113.9";

        assertEquals("203.0.113.9", new ClientIpResolver(1).resolve(requestForwardedFor(spoofedChain)));
    }

    @Test
    void hopsCountFromTheRightAcrossRepeatedHeaders() {
        assertEquals(
                "203.0.113.9",
                new ClientIpResolver(2).resolve(requestForwardedFor("1.1.1.1, 203.0.113.9", "198.51.100.7")));
    }

    @Test
    void hopsLongerThanTheChainFallBackToItsFirstEntry() {
        assertEquals("203.0.113.9", new ClientIpResolver(5).resolve(requestForwardedFor("203.0.113.9")));
    }
}
