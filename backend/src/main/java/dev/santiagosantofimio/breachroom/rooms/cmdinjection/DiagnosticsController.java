package dev.santiagosantofimio.breachroom.rooms.cmdinjection;

import dev.santiagosantofimio.breachroom.flag.FlagService;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.rooms.VirtualFileSystem;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms/cmdinjection")
public class DiagnosticsController {

    public record PingRequest(String host) {
    }

    public record DiagnosticsReport(String output) {
    }

    public record Refusal(String error) {
    }

    private static final int MAX_HOST_LENGTH = 200;
    private static final String ESCAPE_KEY_MARKER = "ESCAPE-KEY-SEALED";

    private static final String INDEX = """
            NETWORK DIAGNOSTICS
            Confirm the building is still connected to the outside world.

            POST /api/rooms/cmdinjection/ping
            Content-Type: application/json

            {"host":"127.0.0.1"}
            """;

    private static final VirtualFileSystem FILES = new VirtualFileSystem(Map.of(
            "/home/diag/notes.txt", """
                    Ticket 4471: the exit needs the key in /vault/escape.key.
                    Ticket 4472: nobody may read the key. Status: wishful.
                    """,
            "/home/diag/ping.log", "Everything is fine. Everything has always been fine.\n",
            "/etc/hostname", "diagnostics-01\n",
            "/etc/passwd", "root:x:0:0:Facilities:/root:/bin/false\ndiag:x:1000:1000:Diagnostics:/home/diag:/bin/sh\n",
            "/vault/escape.key", "-----BEGIN EXIT KEY-----\n" + ESCAPE_KEY_MARKER + "\n-----END EXIT KEY-----\n"));

    private final SimulatedShell shell = new SimulatedShell(FILES);
    private final FlagService flags;

    public DiagnosticsController(FlagService flags) {
        this.flags = flags;
    }

    @GetMapping(value = "/", produces = MediaType.TEXT_PLAIN_VALUE)
    public String index() {
        return INDEX;
    }

    @PostMapping("/ping")
    public ResponseEntity<?> ping(
            @RequestAttribute(SessionFilter.SESSION_ATTRIBUTE) String sessionId,
            @RequestBody PingRequest request) {
        if (request.host() == null || request.host().isBlank() || request.host().length() > MAX_HOST_LENGTH) {
            return ResponseEntity.badRequest().body(new Refusal("invalid_host"));
        }
        String output = shell.run("ping -c 3 " + request.host())
                .replace(ESCAPE_KEY_MARKER, flags.flagFor(sessionId, RoomSlug.CMDINJECTION));
        return ResponseEntity.ok(new DiagnosticsReport(output));
    }
}
