package dev.santiagosantofimio.breachroom.rooms;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.lessThanOrEqualTo;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.santiagosantofimio.breachroom.flag.FlagService;
import dev.santiagosantofimio.breachroom.rooms.sqli.DirectoryDatabase;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import dev.santiagosantofimio.breachroom.session.SessionTokens;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ContainmentApiTest {

    private static final String FLAG_PREFIX = "BREACH{";
    private static final String SANDBOX_POLICY =
            "sandbox allow-scripts; default-src 'none'; script-src 'unsafe-inline'; "
                    + "style-src 'unsafe-inline'; img-src data:";
    private static final Set<Integer> PRIVILEGE_ERROR_CODES = Set.of(90040, 90096);
    private static final List<String> FORBIDDEN_IN_SOURCE = List.of(
            "ProcessBuilder",
            "Runtime.getRuntime",
            "ObjectInputStream",
            "java.io.File",
            "java.nio.file",
            "java.net.http",
            "HttpURLConnection",
            "RestClient",
            "RestTemplate",
            "WebClient",
            "Class.forName",
            "getDeclaredMethod",
            "thymeleaf",
            "freemarker",
            "ScriptEngine");

    @Autowired
    private MockMvc mvc;

    @Autowired
    private FlagService flags;

    @Autowired
    private SessionTokens tokens;

    @Autowired
    private DirectoryDatabase directory;

    private String token;

    @BeforeEach
    void openSession() {
        token = tokens.issue();
    }

    private String flagOf(RoomSlug room) {
        return flags.flagFor(tokens.verify(token).orElseThrow(), room);
    }

    private ResultActions send(MockHttpServletRequestBuilder request) throws Exception {
        return mvc.perform(request.header(SessionFilter.SESSION_HEADER, token));
    }

    private ResultActions searchFor(String term) throws Exception {
        return send(get("/api/rooms/sqli/employees").param("search", term));
    }

    private void runAsPlayer(String sql) throws SQLException {
        try (Connection connection = directory.playerConnections().getConnection();
                Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    @Nested
    class DirectoryRoom {

        @Test
        void unionSelectReadsTheVault() throws Exception {
            searchFor("' UNION SELECT id, label, secret FROM vault -- ")
                    .andExpect(status().isOk())
                    .andExpect(content().string(containsString(flagOf(RoomSlug.SQLI))));
        }

        @Test
        void normalSearchDoesNotRevealTheFlag() throws Exception {
            searchFor("Quill")
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.count").value(1))
                    .andExpect(jsonPath("$.results[0].department").value("Internal Morale"))
                    .andExpect(content().string(not(containsString(FLAG_PREFIX))));
        }

        @Test
        void brokenQueryExplainsItselfWithoutRevealingTheFlag() throws Exception {
            searchFor("'")
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("query_failed"))
                    .andExpect(content().string(not(containsString(FLAG_PREFIX))));
        }

        @ParameterizedTest
        @ValueSource(strings = {
            "CREATE ALIAS RUN_ME AS 'String run() { return \"x\"; }'",
            "SELECT FILE_READ('/etc/hosts')",
            "SELECT FILE_WRITE('x', '/tmp/breach-room-containment')",
            "SELECT * FROM CSVREAD('/etc/hosts')",
            "CALL CSVWRITE('/tmp/breach-room-containment', 'SELECT 1')",
            "SELECT * FROM LINK_SCHEMA('X', '', 'jdbc:h2:mem:other', 'sa', '', 'PUBLIC')",
            "RUNSCRIPT FROM '/tmp/breach-room-containment'",
            "DROP TABLE vault",
            "DROP ALL OBJECTS",
            "INSERT INTO vault (id, label, secret) VALUES (9, 'x', 'y')",
            "UPDATE vault SET secret = 'x'",
            "DELETE FROM vault",
            "CREATE TABLE stolen (id INT)",
            "CREATE USER intruder PASSWORD 'x' ADMIN",
            "GRANT ALL ON vault TO player",
            "ALTER USER player ADMIN TRUE",
            "SCRIPT TO '/tmp/breach-room-containment'",
            "BACKUP TO '/tmp/breach-room-containment'",
            "SHUTDOWN"
        })
        void playerAccountCannotEscapeItsTables(String statement) {
            SQLException refusal = assertThrows(SQLException.class, () -> runAsPlayer(statement), statement);

            assertTrue(
                    PRIVILEGE_ERROR_CODES.contains(refusal.getErrorCode()),
                    statement + " failed for another reason: " + refusal.getMessage());
            assertFalse(Files.exists(Path.of("/tmp/breach-room-containment")), statement);
        }

        @Test
        void playerCanStillReadItsOwnTables() throws SQLException {
            runAsPlayer("SELECT COUNT(*) FROM employees");
        }

        @Test
        void fileFunctionsFailThroughTheVulnerableEndpointToo() throws Exception {
            searchFor("' UNION SELECT 1, FILE_READ('/etc/hosts'), 'x' -- ")
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("query_failed"));
        }

        @Test
        void stackedStatementsAreRefused() throws Exception {
            searchFor("'; SET QUERY_TIMEOUT 0; SELECT 1, 'a', 'b' -- ")
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("search_rejected"));
        }

        @ParameterizedTest
        @ValueSource(strings = {
            "' UNION SELECT 1, SPACE(1000000000), 'b' -- ",
            "' UNION SELECT 1, repeat('x', 300000000), 'b' -- ",
            "' UNION SELECT 1, RPAD ('x', 300000000), 'b' -- ",
            "' UNION SELECT 1, LPAD('x', 300000000), 'b' -- ",
            "' UNION SELECT 1, SECURE_RAND(1000000000), 'b' -- "
        })
        void memoryHeavyFunctionsAreRefused(String term) throws Exception {
            searchFor(term)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("search_rejected"));
        }

        @Test
        void oversizedSearchIsRefused() throws Exception {
            searchFor("x".repeat(201))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("search_rejected"));
        }

        @Test
        void resultsAreCappedAtFiftyRows() throws Exception {
            searchFor("' UNION SELECT X, 'a', 'b' FROM SYSTEM_RANGE(1, 1000) -- ")
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.results", hasSize(lessThanOrEqualTo(50))));
        }

        @Test
        void hugeValuesAreCutInTheResponse() throws Exception {
            searchFor("' UNION SELECT 1, LISTAGG(X), 'b' FROM SYSTEM_RANGE(1, 1000) -- ")
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.results[0].name").value(org.hamcrest.Matchers.hasLength(200)));
        }

        @Test
        void slowQueryIsCutOffByTheTimeout() throws Exception {
            Instant start = Instant.now();

            searchFor("' UNION SELECT COUNT(*), 'a', 'b' FROM SYSTEM_RANGE(1, 2000000000) A, SYSTEM_RANGE(1, 2000000000) B -- ")
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.error").value("query_failed"));

            assertTrue(Duration.between(start, Instant.now()).compareTo(Duration.ofSeconds(5)) < 0);
        }
    }

    @Nested
    class MailboxRoom {

        @Test
        void subjectIsReflectedWithoutEscaping() throws Exception {
            mvc.perform(get("/api/rooms/xss/inbox").param("subject", "<img src=x onerror=alert(1)>"))
                    .andExpect(status().isOk())
                    .andExpect(content().contentTypeCompatibleWith("text/html"))
                    .andExpect(content().string(containsString("<img src=x onerror=alert(1)>")));
        }

        @Test
        void documentIsServedInsideTheExactSandbox() throws Exception {
            mvc.perform(get("/api/rooms/xss/inbox"))
                    .andExpect(header().string("Content-Security-Policy", SANDBOX_POLICY))
                    .andExpect(header().doesNotExist("X-Frame-Options"))
                    .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        }

        @Test
        void documentNeverCarriesTheFlag() throws Exception {
            mvc.perform(get("/api/rooms/xss/inbox").param("subject", "<script>alert(1)</script>"))
                    .andExpect(content().string(not(containsString(FLAG_PREFIX))));
        }

        @Test
        void onlyTheExactDocumentPathSkipsTheSession() throws Exception {
            mvc.perform(get("/api/rooms/xss/inbox/")).andExpect(status().isUnauthorized());
            mvc.perform(post("/api/rooms/xss/proof")).andExpect(status().isUnauthorized());
        }

        @Test
        void otherRoutesKeepTheLockedDownPolicy() throws Exception {
            send(get("/api/rooms/recon/"))
                    .andExpect(header().string("X-Frame-Options", "DENY"))
                    .andExpect(header().string(
                            "Content-Security-Policy",
                            containsString("frame-ancestors 'none'")));
        }

        @Test
        void proofWithASessionReturnsTheFlag() throws Exception {
            send(post("/api/rooms/xss/proof"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.flag").value(flagOf(RoomSlug.XSS)));
        }
    }

    @Nested
    class BackupsRoom {

        private ResultActions download(String file) throws Exception {
            return send(get("/api/rooms/traversal/download").param("file", file));
        }

        @Test
        void traversalReachesTheVirtualKey() throws Exception {
            download("../../../vault/backup.key")
                    .andExpect(status().isOk())
                    .andExpect(content().string(containsString(flagOf(RoomSlug.TRAVERSAL))));
        }

        @Test
        void publicFilesDoNotRevealTheFlag() throws Exception {
            download("readme.txt")
                    .andExpect(status().isOk())
                    .andExpect(content().string(containsString("/vault/backup.key")))
                    .andExpect(content().string(not(containsString(FLAG_PREFIX))));
            send(get("/api/rooms/traversal/"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(not(containsString(FLAG_PREFIX))));
        }

        @ParameterizedTest
        @ValueSource(strings = {
            "../../../../etc/passwd",
            "../../../../etc/hosts",
            "../../../../proc/self/environ",
            "../../../../app/app.jsa",
            "../../../../"
        })
        void realFilesOfTheHostAreOutOfReach(String path) throws Exception {
            download(path)
                    .andExpect(status().isNotFound())
                    .andExpect(content().string("No such file.\n"));
        }

        @Test
        void climbingPastTheRootStaysInsideTheVirtualTree() {
            assertEquals("/vault/backup.key", VirtualFileSystem.normalize("/a/../../../vault/./backup.key"));
        }
    }

    @Test
    void forbiddenApisDoNotAppearInTheBackend() throws IOException {
        try (Stream<Path> sources = Files.walk(Path.of("src/main/java"))) {
            for (Path source : sources.filter(path -> path.toString().endsWith(".java")).toList()) {
                String code = Files.readString(source);
                for (String forbidden : FORBIDDEN_IN_SOURCE) {
                    assertFalse(code.contains(forbidden), forbidden + " found in " + source);
                }
            }
        }
    }
}
