package dev.santiagosantofimio.breachroom.flag;

import dev.santiagosantofimio.breachroom.config.BreachProperties;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.security.HmacSha256;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import org.springframework.stereotype.Service;

@Service
public class FlagService {

    private static final int FLAG_HEX_LENGTH = 16;

    private final String secret;

    public FlagService(BreachProperties properties) {
        this.secret = properties.flagSecret();
    }

    public String flagFor(String sessionId, RoomSlug room) {
        byte[] message = (sessionId + ":" + room.slug()).getBytes(StandardCharsets.UTF_8);
        String hex = HexFormat.of().formatHex(HmacSha256.sign(secret, message));
        return "BREACH{" + room.slug() + "-" + hex.substring(0, FLAG_HEX_LENGTH) + "}";
    }

    public boolean matches(String sessionId, RoomSlug room, String submittedFlag) {
        byte[] expected = flagFor(sessionId, room).getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, submittedFlag.getBytes(StandardCharsets.UTF_8));
    }
}
