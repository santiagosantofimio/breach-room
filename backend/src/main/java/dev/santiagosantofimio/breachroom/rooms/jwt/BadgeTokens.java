package dev.santiagosantofimio.breachroom.rooms.jwt;

import dev.santiagosantofimio.breachroom.security.HmacSha256;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
class BadgeTokens {

    record Badge(String sub, String role) {
    }

    private static final String WEAK_ROOM_SECRET = "kryptelia2019";
    private static final String SIGNED_ALGORITHM = "HS256";
    private static final String UNSIGNED_ALGORITHM = "none";
    private static final int TOKEN_PARTS = 3;
    private static final String HEADER = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder DECODER = Base64.getUrlDecoder();

    private final ObjectMapper json;

    BadgeTokens(ObjectMapper json) {
        this.json = json;
    }

    String issue(Badge badge) {
        String signedPart = encode(HEADER.getBytes(StandardCharsets.UTF_8)) + "." + encode(json.writeValueAsBytes(badge));
        return signedPart + "." + encode(signatureOf(signedPart));
    }

    Optional<Badge> read(String token) {
        String[] parts = token.split("\\.", -1);
        if (parts.length != TOKEN_PARTS) {
            return Optional.empty();
        }
        try {
            String algorithm = algorithmOf(parts[0]);
            boolean trusted = UNSIGNED_ALGORITHM.equalsIgnoreCase(algorithm)
                    || (SIGNED_ALGORITHM.equals(algorithm) && signatureMatches(parts));
            return trusted ? Optional.of(json.readValue(DECODER.decode(parts[1]), Badge.class)) : Optional.empty();
        } catch (IllegalArgumentException | JacksonException malformedToken) {
            return Optional.empty();
        }
    }

    private String algorithmOf(String encodedHeader) {
        JsonNode header = json.readTree(DECODER.decode(encodedHeader));
        return header.path("alg").asString("");
    }

    private static boolean signatureMatches(String[] parts) {
        byte[] expected = signatureOf(parts[0] + "." + parts[1]);
        return MessageDigest.isEqual(expected, DECODER.decode(parts[2]));
    }

    private static byte[] signatureOf(String signedPart) {
        return HmacSha256.sign(WEAK_ROOM_SECRET, signedPart.getBytes(StandardCharsets.UTF_8));
    }

    private static String encode(byte[] bytes) {
        return ENCODER.encodeToString(bytes);
    }
}
