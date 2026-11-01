package dev.santiagosantofimio.breachroom.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.santiagosantofimio.breachroom.session.SessionFilter;
import dev.santiagosantofimio.breachroom.session.SessionTokens;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
        "breach.rate-limit.ip-capacity=4",
        "breach.rate-limit.ip-refill-per-second=0",
        "breach.rate-limit.session-capacity=1",
        "breach.rate-limit.session-refill-per-second=0"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RateLimitApiTest {

    private static final String FIRST_CLIENT = "198.51.100.1";
    private static final String SECOND_CLIENT = "198.51.100.2";
    private static final String THIRD_CLIENT = "198.51.100.3";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private SessionTokens tokens;

    @Test
    void clientOverItsIpBudgetIsThrottledWithoutAffectingOthers() throws Exception {
        for (int request = 0; request < 4; request++) {
            mvc.perform(get("/api/health").with(remoteAddress(FIRST_CLIENT))).andExpect(status().isOk());
        }

        mvc.perform(get("/api/health").with(remoteAddress(FIRST_CLIENT)))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "1"))
                .andExpect(jsonPath("$.error").value("rate_limited"));

        mvc.perform(get("/api/health").with(remoteAddress(SECOND_CLIENT))).andExpect(status().isOk());
    }

    @Test
    void sessionOverItsBudgetIsThrottledEvenFromAFreshIp() throws Exception {
        String token = tokens.issue();
        mvc.perform(flagSubmission(token).with(remoteAddress(THIRD_CLIENT))).andExpect(status().isOk());

        mvc.perform(flagSubmission(token).with(remoteAddress("198.51.100.4")))
                .andExpect(status().isTooManyRequests());
    }

    private static org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder flagSubmission(
            String token) {
        return post("/api/rooms/recon/flag")
                .header(SessionFilter.SESSION_HEADER, token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"flag\":\"BREACH{x}\"}");
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor remoteAddress(String address) {
        return request -> {
            request.setRemoteAddr(address);
            return request;
        };
    }
}
