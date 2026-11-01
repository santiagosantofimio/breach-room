package dev.santiagosantofimio.breachroom.rooms.jwt;

import dev.santiagosantofimio.breachroom.flag.FlagService;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms/jwt")
public class AccessControlController {

    public record IssuedBadge(String token, String door, String presentAs) {
    }

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String CLEARED_ROLE = "director";
    private static final String DOOR_PATH = "/api/rooms/jwt/door";

    private final BadgeTokens badges;
    private final FlagService flags;

    public AccessControlController(BadgeTokens badges, FlagService flags) {
        this.badges = badges;
        this.flags = flags;
    }

    @GetMapping("/badge")
    public IssuedBadge badge() {
        String token = badges.issue(new BadgeTokens.Badge("contractor-1043", "contractor"));
        return new IssuedBadge(token, DOOR_PATH, HttpHeaders.AUTHORIZATION + ": " + BEARER_PREFIX + "<token>");
    }

    @GetMapping(value = "/door", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> door(
            @RequestAttribute(SessionFilter.SESSION_ATTRIBUTE) String sessionId,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        if (authorization == null || !authorization.startsWith(BEARER_PREFIX)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("DOOR\nPresent a badge.\n");
        }
        Optional<BadgeTokens.Badge> badge = badges.read(authorization.substring(BEARER_PREFIX.length()).strip());
        if (badge.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("DOOR\nThat badge is not valid.\n");
        }
        if (!CLEARED_ROLE.equals(badge.get().role())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("DOOR\nRole on badge: " + badge.get().role() + ". This door opens for directors only.\n");
        }
        return ResponseEntity.ok("DOOR OPEN\nGood evening, Director.\n" + flags.flagFor(sessionId, RoomSlug.JWT) + "\n");
    }
}
