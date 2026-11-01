package dev.santiagosantofimio.breachroom.rooms.sqli;

import dev.santiagosantofimio.breachroom.flag.FlagService;
import dev.santiagosantofimio.breachroom.rooms.RoomSlug;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import java.util.List;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms/sqli")
public class DirectoryController {

    public record SearchResults(int count, List<EmployeeSearch.Row> results) {
    }

    public record SearchFailure(String error, String detail) {
    }

    private static final int MAX_DETAIL_LENGTH = 300;

    private final EmployeeSearch employees;
    private final FlagService flags;

    public DirectoryController(EmployeeSearch employees, FlagService flags) {
        this.employees = employees;
        this.flags = flags;
    }

    @GetMapping("/employees")
    public ResponseEntity<?> search(
            @RequestAttribute(SessionFilter.SESSION_ATTRIBUTE) String sessionId,
            @RequestParam(defaultValue = "") String search) {
        try {
            String flag = flags.flagFor(sessionId, RoomSlug.SQLI);
            List<EmployeeSearch.Row> rows = employees.search(search).stream()
                    .map(row -> withFlagRevealed(row, flag))
                    .toList();
            return ResponseEntity.ok(new SearchResults(rows.size(), rows));
        } catch (EmployeeSearch.RejectedSearch rejected) {
            return ResponseEntity.badRequest()
                    .body(new SearchFailure("search_rejected", "One short statement at a time."));
        } catch (EmployeeSearch.DirectoryBusy busy) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new SearchFailure("directory_busy", "The Directory is helping someone else."));
        } catch (DataAccessException failure) {
            return ResponseEntity.badRequest().body(new SearchFailure("query_failed", detailOf(failure)));
        } catch (OutOfMemoryError exhausted) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new SearchFailure("directory_busy", "That result would not fit in the building."));
        }
    }

    private static EmployeeSearch.Row withFlagRevealed(EmployeeSearch.Row row, String flag) {
        return new EmployeeSearch.Row(reveal(row.id(), flag), reveal(row.name(), flag), reveal(row.department(), flag));
    }

    private static String reveal(String cell, String flag) {
        return cell == null ? null : cell.replace(DirectoryDatabase.VAULT_FLAG_MARKER, flag);
    }

    private static String detailOf(DataAccessException failure) {
        String detail = String.valueOf(failure.getMostSpecificCause().getMessage());
        return detail.length() <= MAX_DETAIL_LENGTH ? detail : detail.substring(0, MAX_DETAIL_LENGTH);
    }
}
