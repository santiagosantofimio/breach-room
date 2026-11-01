package dev.santiagosantofimio.breachroom.rooms.traversal;

import dev.santiagosantofimio.breachroom.flag.FlagService;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.rooms.VirtualFileSystem;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/rooms/traversal", produces = MediaType.TEXT_PLAIN_VALUE)
public class BackupsController {

    private static final String PUBLIC_DIRECTORY = "/srv/backups/public/";
    private static final String KEY_MARKER = "BACKUP-KEY-SEALED";

    private static final String INDEX = """
            KRYPTELIA BACKUPS
            Self-service restore portal. Download any public file:

              /api/rooms/traversal/download?file=readme.txt
              /api/rooms/traversal/download?file=q3-morale-survey.txt
            """;

    private static final VirtualFileSystem FILES = new VirtualFileSystem(Map.of(
            PUBLIC_DIRECTORY + "readme.txt", """
                    Backups are served from /srv/backups/public/ on this host.
                    IT moved the encryption key to /vault/backup.key, far outside this folder,
                    where nobody could possibly reach it.
                    """,
            PUBLIC_DIRECTORY + "q3-morale-survey.txt", """
                    Responses received: 1
                    Respondent: the Director
                    Morale: excellent
                    """,
            "/srv/backups/private/payroll.txt", "Redacted by Facilities with a marker pen.\n",
            "/vault/backup.key", "-----BEGIN KRYPTELIA KEY-----\n" + KEY_MARKER + "\n-----END KRYPTELIA KEY-----\n"));

    private final FlagService flags;

    public BackupsController(FlagService flags) {
        this.flags = flags;
    }

    @GetMapping("/")
    public String index() {
        return INDEX;
    }

    @GetMapping("/download")
    public ResponseEntity<String> download(
            @RequestAttribute(SessionFilter.SESSION_ATTRIBUTE) String sessionId,
            @RequestParam String file) {
        return FILES.read(PUBLIC_DIRECTORY + file)
                .map(content -> content.replace(KEY_MARKER, flags.flagFor(sessionId, RoomSlug.TRAVERSAL)))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("No such file.\n"));
    }
}
