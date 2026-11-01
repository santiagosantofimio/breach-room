package dev.santiagosantofimio.breachroom.rooms;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public final class VirtualFileSystem {

    private static final String SEPARATOR = "/";
    private static final String CURRENT = ".";
    private static final String PARENT = "..";

    private final Map<String, String> filesByPath;

    public VirtualFileSystem(Map<String, String> filesByPath) {
        this.filesByPath = Map.copyOf(filesByPath);
    }

    public Optional<String> read(String path) {
        return Optional.ofNullable(filesByPath.get(normalize(path)));
    }

    public List<String> list(String directory) {
        String prefix = normalize(directory).replaceAll("/$", "") + SEPARATOR;
        return filesByPath.keySet().stream()
                .filter(path -> path.startsWith(prefix))
                .map(path -> path.substring(prefix.length()).split(SEPARATOR)[0])
                .distinct()
                .sorted()
                .toList();
    }

    public static String normalize(String path) {
        List<String> resolved = new ArrayList<>();
        for (String segment : path.split(SEPARATOR)) {
            if (segment.equals(PARENT)) {
                if (!resolved.isEmpty()) {
                    resolved.removeLast();
                }
            } else if (!segment.isEmpty() && !segment.equals(CURRENT)) {
                resolved.add(segment);
            }
        }
        return SEPARATOR + String.join(SEPARATOR, resolved);
    }
}
