package dev.santiagosantofimio.breachroom.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PerimeterApiTest {

    private static final String GAME_ORIGIN = "https://game.example.test";
    private static final String FOREIGN_ORIGIN = "https://elsewhere.example.test";

    @Autowired
    private MockMvc mvc;

    @Autowired
    private SessionTokens tokens;

    @Test
    void healthAnswersWithoutSession() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }

    @Test
    void everyResponseCarriesSecurityHeaders() throws Exception {
        mvc.perform(get("/api/health"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string(
                        "Content-Security-Policy",
                        "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"));
    }

    @Test
    void preflightFromGameOriginAllowsRoomHeaders() throws Exception {
        mvc.perform(options("/api/rooms/recon/flag")
                        .header("Origin", GAME_ORIGIN)
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "x-breach-session, x-room-cookie, authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", GAME_ORIGIN))
                .andExpect(header().string(
                        "Access-Control-Allow-Headers", "x-breach-session, x-room-cookie, authorization"));
    }

    @Test
    void preflightFromForeignOriginIsRefused() throws Exception {
        mvc.perform(options("/api/session")
                        .header("Origin", FOREIGN_ORIGIN)
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void requestFromForeignOriginIsRefused() throws Exception {
        mvc.perform(post("/api/session").header("Origin", FOREIGN_ORIGIN))
                .andExpect(status().isForbidden());
    }

    @Test
    void responseHeadersAreReadableFromGameOrigin() throws Exception {
        mvc.perform(get("/api/health").header("Origin", GAME_ORIGIN))
                .andExpect(header().string("Access-Control-Allow-Origin", GAME_ORIGIN))
                .andExpect(header().string("Access-Control-Expose-Headers", "*"))
                .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }

    @Test
    void sessionRejectionStaysReadableFromGameOrigin() throws Exception {
        mvc.perform(post("/api/rooms/recon/flag").header("Origin", GAME_ORIGIN))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Access-Control-Allow-Origin", GAME_ORIGIN));
    }

    @Test
    void bodyAtTheLimitReachesTheController() throws Exception {
        mvc.perform(post("/api/rooms/recon/flag")
                        .header(SessionFilter.SESSION_HEADER, tokens.issue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(flagBodyOfBytes(BodySizeLimitFilter.MAX_BODY_BYTES)))
                .andExpect(status().isOk());
    }

    @Test
    void bodyOverTheLimitIsRejected() throws Exception {
        mvc.perform(post("/api/rooms/recon/flag")
                        .header(SessionFilter.SESSION_HEADER, tokens.issue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(flagBodyOfBytes(BodySizeLimitFilter.MAX_BODY_BYTES + 1)))
                .andExpect(status().isContentTooLarge())
                .andExpect(jsonPath("$.error").value("body_too_large"));
    }

    private static String flagBodyOfBytes(int totalBytes) {
        String prefix = "{\"flag\":\"";
        String suffix = "\"}";
        return prefix + "x".repeat(totalBytes - prefix.length() - suffix.length()) + suffix;
    }
}
