package dev.santiagosantofimio.breachroom.rooms.sqli;

import java.util.List;
import java.util.concurrent.Semaphore;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class EmployeeSearch {

    public record Row(String id, String name, String department) {
    }

    public static final class DirectoryBusy extends RuntimeException {
    }

    public static final class RejectedSearch extends RuntimeException {
    }

    static final int MAX_SEARCH_LENGTH = 200;
    static final int MAX_ROWS = 50;
    static final int MAX_CELL_LENGTH = 200;

    private static final int QUERY_TIMEOUT_SECONDS = 2;
    private static final int CONCURRENT_QUERIES = 2;
    private static final String STATEMENT_SEPARATOR = ";";
    private static final Pattern MEMORY_HEAVY_FUNCTIONS =
            Pattern.compile("\\b(REPEAT|SPACE|RPAD|LPAD|SECURE_RAND)\\s*\\(", Pattern.CASE_INSENSITIVE);

    private final JdbcTemplate player;
    private final Semaphore querySlots = new Semaphore(CONCURRENT_QUERIES);

    public EmployeeSearch(DirectoryDatabase database) {
        this.player = new JdbcTemplate(database.playerConnections());
        this.player.setQueryTimeout(QUERY_TIMEOUT_SECONDS);
        this.player.setMaxRows(MAX_ROWS);
    }

    public List<Row> search(String term) {
        if (term.length() > MAX_SEARCH_LENGTH
                || term.contains(STATEMENT_SEPARATOR)
                || MEMORY_HEAVY_FUNCTIONS.matcher(term).find()) {
            throw new RejectedSearch();
        }
        if (!querySlots.tryAcquire()) {
            throw new DirectoryBusy();
        }
        try {
            String sql = "SELECT id, name, department FROM employees WHERE name LIKE '%" + term + "%' ORDER BY name";
            return player.query(sql, (row, index) -> new Row(cell(row.getString(1)), cell(row.getString(2)), cell(row.getString(3))));
        } finally {
            querySlots.release();
        }
    }

    private static String cell(String value) {
        return value == null || value.length() <= MAX_CELL_LENGTH ? value : value.substring(0, MAX_CELL_LENGTH);
    }
}
