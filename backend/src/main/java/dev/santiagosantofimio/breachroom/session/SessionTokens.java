package dev.santiagosantofimio.breachroom.session;

import dev.santiagosantofimio.breachroom.config.BreachProperties;
import dev.santiagosantofimio.breachroom.security.HmacSha256;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class SessionTokens {

    private static final int SESSION_ID_BYTES = 16;
    private static final String TOKEN_SEPARATOR = ".";
    private static final String TOKEN_SEPARATOR_PATTERN = "\\.";
    private static final int TOKEN_PARTS = 2;
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

    private final SecureRandom random = new SecureRandom();
    private final String secret;

    public SessionTokens(BreachProperties properties) {
        this.secret = properties.sessionSecret();
    }

    public String issue() {
        byte[] sessionId = new byte[SESSION_ID_BYTES];
        random.nextBytes(sessionId);
        byte[] signature = HmacSha256.sign(secret, sessionId);
        return ENCODER.encodeToString(sessionId) + TOKEN_SEPARATOR + ENCODER.encodeToString(signature);
    }

    public Optional<String> verify(String token) {
        if (token == null) {
            return Optional.empty();
        }
        String[] parts = token.split(TOKEN_SEPARATOR_PATTERN, -1);
        if (parts.length != TOKEN_PARTS) {
            return Optional.empty();
        }
        try {
            byte[] sessionId = DECODER.decode(parts[0]);
            byte[] signature = DECODER.decode(parts[1]);
            if (sessionId.length != SESSION_ID_BYTES
                    || !MessageDigest.isEqual(signature, HmacSha256.sign(secret, sessionId))) {
                return Optional.empty();
            }
            return Optional.of(ENCODER.encodeToString(sessionId));
        } catch (IllegalArgumentException malformedBase64) {
            return Optional.empty();
        }
    }
}
