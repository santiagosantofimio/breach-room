package dev.santiagosantofimio.breachroom.rooms.sqli;

import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.UUID;
import javax.sql.DataSource;
import org.springframework.context.annotation.Lazy;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Component;

@Component
@Lazy(false)
public class DirectoryDatabase {

    static final String VAULT_FLAG_MARKER = "VAULT-ENTRY-SEALED";

    private static final int PASSWORD_BYTES = 24;
    private static final String ADMIN_USER = "directory_admin";
    private static final String PLAYER_USER = "player";

    private final DataSource playerConnections;

    public DirectoryDatabase() {
        String url = "jdbc:h2:mem:directory-" + UUID.randomUUID();
        String playerPassword = randomPassword();
        JdbcClient admin = JdbcClient.create(
                new DriverManagerDataSource(url + ";DB_CLOSE_DELAY=-1", ADMIN_USER, randomPassword()));
        createSchema(admin);
        admin.sql("CREATE USER " + PLAYER_USER + " PASSWORD '" + playerPassword + "'").update();
        admin.sql("GRANT SELECT ON employees, vault TO " + PLAYER_USER).update();
        this.playerConnections = new DriverManagerDataSource(url + ";IFEXISTS=TRUE", PLAYER_USER, playerPassword);
    }

    public DataSource playerConnections() {
        return playerConnections;
    }

    private static void createSchema(JdbcClient admin) {
        admin.sql("""
                CREATE TABLE employees (
                    id INT PRIMARY KEY,
                    name VARCHAR(80) NOT NULL,
                    department VARCHAR(80) NOT NULL
                )
                """).update();
        admin.sql("""
                INSERT INTO employees (id, name, department) VALUES
                    (1001, 'Director', 'Executive Suite'),
                    (1002, 'Mara Quill', 'Internal Morale'),
                    (1007, 'Tobias Venn', 'Facilities'),
                    (1013, 'Ines Carrow', 'Human Resources'),
                    (1018, 'Otto Lindqvist', 'Compliance'),
                    (1021, 'Priya Raman', 'Accounting'),
                    (1029, 'Hugo Fenn', 'The Archive'),
                    (1034, 'Lena Duarte', 'Reception, vacant'),
                    (1043, 'Contractor 1043', 'Temporary')
                """).update();
        admin.sql("""
                CREATE TABLE vault (
                    id INT PRIMARY KEY,
                    label VARCHAR(80) NOT NULL,
                    secret VARCHAR(80) NOT NULL
                )
                """).update();
        admin.sql("""
                INSERT INTO vault (id, label, secret) VALUES
                    (1, 'Petty cash', 'One IOU, signed by the Director'),
                    (2, 'Severance fund', 'See petty cash'),
                    (3, 'Directory access token', ?)
                """).param(VAULT_FLAG_MARKER).update();
    }

    private static String randomPassword() {
        byte[] password = new byte[PASSWORD_BYTES];
        new SecureRandom().nextBytes(password);
        return HexFormat.of().formatHex(password);
    }
}
