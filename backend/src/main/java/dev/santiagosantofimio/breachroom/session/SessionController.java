package dev.santiagosantofimio.breachroom.session;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SessionController {

    public record NewSession(String token) {
    }

    private final SessionTokens tokens;

    public SessionController(SessionTokens tokens) {
        this.tokens = tokens;
    }

    @PostMapping("/api/session")
    @ResponseStatus(HttpStatus.CREATED)
    public NewSession create() {
        return new NewSession(tokens.issue());
    }
}
