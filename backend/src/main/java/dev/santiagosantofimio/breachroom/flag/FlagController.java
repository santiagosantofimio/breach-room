package dev.santiagosantofimio.breachroom.flag;

import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class FlagController {

    public record FlagSubmission(String flag) {
    }

    public record FlagVerdict(boolean correct) {
    }

    private final FlagService flags;

    public FlagController(FlagService flags) {
        this.flags = flags;
    }

    @PostMapping("/api/rooms/{slug}/flag")
    public FlagVerdict submit(
            @PathVariable String slug,
            @RequestAttribute(SessionFilter.SESSION_ATTRIBUTE) String sessionId,
            @RequestBody FlagSubmission submission) {
        RoomSlug room = RoomSlug.fromSlug(slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        boolean correct = submission.flag() != null && flags.matches(sessionId, room, submission.flag());
        return new FlagVerdict(correct);
    }
}
