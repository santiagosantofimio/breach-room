package dev.santiagosantofimio.breachroom.rooms.recon;

import dev.santiagosantofimio.breachroom.flag.FlagService;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/rooms/recon", produces = MediaType.TEXT_PLAIN_VALUE)
public class ReconController {

    static final String DEBUG_HEADER = "X-Kryptelia-Debug";

    private static final String FRONT_DESK = """
            KRYPTELIA SYSTEMS
            Visitor reception

            Please take a seat. Someone will ignore you shortly.
            All public pages of this site are listed for search engines in the usual place.
            """;

    private static final String ROBOTS = """
            User-agent: *
            Disallow: /api/rooms/recon/internal/front-desk-terminal
            """;

    private static final String TERMINAL = """
            FRONT DESK TERMINAL
            Staff only. If you are not staff, please stop reading this.
            """;

    private final FlagService flags;

    public ReconController(FlagService flags) {
        this.flags = flags;
    }

    @GetMapping("/")
    public String frontDesk() {
        return FRONT_DESK;
    }

    @GetMapping("/robots.txt")
    public String robots() {
        return ROBOTS;
    }

    @GetMapping("/internal/front-desk-terminal")
    public ResponseEntity<String> terminal(@RequestAttribute(SessionFilter.SESSION_ATTRIBUTE) String sessionId) {
        return ResponseEntity.ok()
                .header(DEBUG_HEADER, flags.flagFor(sessionId, RoomSlug.RECON))
                .body(TERMINAL);
    }
}
