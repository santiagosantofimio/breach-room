package dev.santiagosantofimio.breachroom.rooms.idor;

import dev.santiagosantofimio.breachroom.flag.FlagService;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms/idor")
public class ArchiveController {

    static final int PLAYER_DOCUMENT_ID = 1043;
    static final int DIRECTOR_DOCUMENT_ID = 1001;

    public record DocumentSummary(int id, String title) {
    }

    public record Inbox(int employee, List<DocumentSummary> documents) {
    }

    public record Document(int id, String owner, String title, String body) {
    }

    private static final Map<Integer, Document> DOCUMENTS = Map.of(
            1002, new Document(1002, "Chief Morale Officer", "Morale forecast", "Morale is expected to remain."),
            PLAYER_DOCUMENT_ID, new Document(
                    PLAYER_DOCUMENT_ID,
                    "Contractor 1043",
                    "Temporary contract",
                    "Your contract is temporary. Staff records are numbered by seniority, starting with the Director."));

    private final FlagService flags;

    public ArchiveController(FlagService flags) {
        this.flags = flags;
    }

    @GetMapping("/documents")
    public Inbox inbox() {
        return new Inbox(
                PLAYER_DOCUMENT_ID,
                List.of(new DocumentSummary(PLAYER_DOCUMENT_ID, DOCUMENTS.get(PLAYER_DOCUMENT_ID).title())));
    }

    @GetMapping("/documents/{id}")
    public ResponseEntity<Document> document(
            @PathVariable int id,
            @RequestAttribute(SessionFilter.SESSION_ATTRIBUTE) String sessionId) {
        if (id == DIRECTOR_DOCUMENT_ID) {
            return ResponseEntity.ok(new Document(
                    id, "Director", "Exit interview notes", flags.flagFor(sessionId, RoomSlug.IDOR)));
        }
        Document document = DOCUMENTS.get(id);
        return document == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(document);
    }
}
