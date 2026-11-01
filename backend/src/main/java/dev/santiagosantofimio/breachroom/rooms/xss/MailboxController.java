package dev.santiagosantofimio.breachroom.rooms.xss;

import dev.santiagosantofimio.breachroom.flag.FlagService;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.security.FramedDocument;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MailboxController {

    public record Proof(String flag) {
    }

    static final String SANDBOX_POLICY =
            "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; "
                    + "style-src 'unsafe-inline'; img-src data:";

    private static final String SUBJECT_SLOT = "__SUBJECT__";

    private static final String INBOX_PAGE = """
            <!doctype html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <title>Kryptelia Webmail</title>
                <style>
                  body { margin: 0; padding: 12px; font-family: Courier, monospace; font-size: 15px; color: #14213d; }
                  h1 { margin: 0 0 8px; font-size: 18px; }
                </style>
                <script>
                  function reportExecution() {
                    parent.postMessage({ type: "breach-proof" }, "*");
                  }
                  window.alert = reportExecution;
                  window.confirm = reportExecution;
                  window.prompt = reportExecution;
                </script>
              </head>
              <body>
                <h1>Kryptelia Webmail</h1>
                <p>Results for: __SUBJECT__</p>
                <p>No messages found. Your mailbox was archived in 2019.</p>
              </body>
            </html>
            """;

    private final FlagService flags;

    public MailboxController(FlagService flags) {
        this.flags = flags;
    }

    @GetMapping(FramedDocument.PATH)
    public ResponseEntity<String> inbox(@RequestParam(defaultValue = "") String subject) {
        return ResponseEntity.ok()
                .header("Content-Security-Policy", SANDBOX_POLICY)
                .contentType(MediaType.parseMediaType("text/html;charset=UTF-8"))
                .body(INBOX_PAGE.replace(SUBJECT_SLOT, subject));
    }

    @PostMapping("/api/rooms/xss/proof")
    public Proof proof(@RequestAttribute(SessionFilter.SESSION_ATTRIBUTE) String sessionId) {
        return new Proof(flags.flagFor(sessionId, RoomSlug.XSS));
    }
}
