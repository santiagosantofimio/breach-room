package dev.santiagosantofimio.breachroom.rooms.cookiejar;

import dev.santiagosantofimio.breachroom.flag.FlagService;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping(value = "/api/rooms/cookiejar", produces = MediaType.TEXT_PLAIN_VALUE)
public class CookieJarController {

    static final String ROOM_COOKIE_HEADER = "X-Room-Cookie";
    static final String SET_ROOM_COOKIE_HEADER = "X-Set-Room-Cookie";

    private static final String ADMIN_ROLE = "admin";

    private final FlagService flags;
    private final ObjectMapper json;

    public CookieJarController(FlagService flags, ObjectMapper json) {
        this.flags = flags;
        this.json = json;
    }

    @GetMapping("/locker")
    public ResponseEntity<String> locker(
            @RequestAttribute(SessionFilter.SESSION_ATTRIBUTE) String sessionId,
            @RequestHeader(value = ROOM_COOKIE_HEADER, required = false) String cookieHeader) {
        if (cookieHeader == null) {
            return ResponseEntity.ok()
                    .header(SET_ROOM_COOKIE_HEADER, ProfileCookie.NAME + "=" + ProfileCookie.guestValue())
                    .body("LOCKER ROOM\nWelcome, guest. A profile has been issued to you. Visit again.\n");
        }
        Optional<ProfileCookie.Profile> profile = ProfileCookie.read(cookieHeader, json);
        if (profile.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("LOCKER ROOM\nThat profile is unreadable.\n");
        }
        if (ADMIN_ROLE.equals(profile.get().role())) {
            return ResponseEntity.ok("EXECUTIVE LOCKER\nContents: one flag.\n"
                    + flags.flagFor(sessionId, RoomSlug.COOKIEJAR) + "\n");
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body("LOCKER ROOM\nHello, " + profile.get().role() + ". The executive locker is for admins.\n");
    }
}
