package dev.santiagosantofimio.breachroom.flag;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import dev.santiagosantofimio.breachroom.session.SessionTokens;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class FlagApiTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private FlagService flags;

    @Autowired
    private SessionTokens tokens;

    @Test
    void sessionEndpointIssuesVerifiableToken() throws Exception {
        String body = mvc.perform(post("/api/session"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String token = JsonPath.read(body, "$.token");
        org.junit.jupiter.api.Assertions.assertTrue(tokens.verify(token).isPresent());
    }

    @Test
    void correctFlagIsAccepted() throws Exception {
        String token = tokens.issue();
        String flag = flags.flagFor(sessionIdOf(token), RoomSlug.RECON);

        submit("recon", token, flagBody(flag))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(true));
    }

    @Test
    void wrongFlagIsRefused() throws Exception {
        submit("recon", tokens.issue(), flagBody("BREACH{recon-0000000000000000}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(false));
    }

    @Test
    void flagOfAnotherSessionIsRefused() throws Exception {
        String otherSessionFlag = flags.flagFor(sessionIdOf(tokens.issue()), RoomSlug.RECON);

        submit("recon", tokens.issue(), flagBody(otherSessionFlag))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(false));
    }

    @Test
    void flagOfAnotherRoomIsRefused() throws Exception {
        String token = tokens.issue();
        String otherRoomFlag = flags.flagFor(sessionIdOf(token), RoomSlug.IDOR);

        submit("recon", token, flagBody(otherRoomFlag))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(false));
    }

    @Test
    void missingFlagFieldIsRefused() throws Exception {
        submit("recon", tokens.issue(), "{}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correct").value(false));
    }

    @Test
    void unknownRoomIsNotFound() throws Exception {
        submit("does-not-exist", tokens.issue(), flagBody("BREACH{x}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void malformedJsonIsBadRequest() throws Exception {
        submit("recon", tokens.issue(), "{not json")
                .andExpect(status().isBadRequest());
    }

    @Test
    void requestWithoutSessionIsRejected() throws Exception {
        mvc.perform(post("/api/rooms/recon/flag")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(flagBody("BREACH{x}")))
                .andExpect(status().isUnauthorized())
                .andExpect(content().json("{\"error\":\"invalid_session\"}"));
    }

    @Test
    void requestWithTamperedSignatureIsRejected() throws Exception {
        String token = tokens.issue();
        String tampered = token.substring(0, token.length() - 2) + "AA";

        submit("recon", tampered, flagBody("BREACH{x}"))
                .andExpect(status().isUnauthorized());
    }

    private ResultActions submit(String slug, String token, String body) throws Exception {
        return mvc.perform(post("/api/rooms/{slug}/flag", slug)
                .header(SessionFilter.SESSION_HEADER, token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private String sessionIdOf(String token) {
        return tokens.verify(token).orElseThrow();
    }

    private static String flagBody(String flag) {
        return "{\"flag\":\"" + flag + "\"}";
    }
}
