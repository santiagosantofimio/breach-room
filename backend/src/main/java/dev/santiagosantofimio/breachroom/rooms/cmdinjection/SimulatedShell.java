package dev.santiagosantofimio.breachroom.rooms.cmdinjection;

import dev.santiagosantofimio.breachroom.rooms.VirtualFileSystem;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class SimulatedShell {

    private record Result(String output, boolean succeeded) {

        static Result ok(String output) {
            return new Result(output, true);
        }

        static Result failed(String output) {
            return new Result(output, false);
        }
    }

    private record Step(String separator, String command) {
    }

    static final int MAX_COMMANDS = 10;

    private static final Pattern SEPARATOR = Pattern.compile("&&|;|\\|");
    private static final String AND_THEN = "&&";
    private static final String WORKING_DIRECTORY = "/home/diag";

    private final VirtualFileSystem files;
    private final Map<String, Function<List<String>, Result>> commands = Map.of(
            "ping", this::ping,
            "ls", this::list,
            "cat", this::concatenate,
            "whoami", arguments -> Result.ok("diag\n"),
            "id", arguments -> Result.ok("uid=1000(diag) gid=1000(diag) groups=1000(diag)\n"),
            "pwd", arguments -> Result.ok(WORKING_DIRECTORY + "\n"));

    SimulatedShell(VirtualFileSystem files) {
        this.files = files;
    }

    String run(String line) {
        StringBuilder output = new StringBuilder();
        boolean previousSucceeded = true;
        for (Step step : stepsOf(line).stream().limit(MAX_COMMANDS).toList()) {
            if (AND_THEN.equals(step.separator()) && !previousSucceeded) {
                continue;
            }
            Result result = execute(step.command());
            output.append(result.output());
            previousSucceeded = result.succeeded();
        }
        return output.toString();
    }

    private static List<Step> stepsOf(String line) {
        List<Step> steps = new ArrayList<>();
        Matcher separators = SEPARATOR.matcher(line);
        String pendingSeparator = "";
        int commandStart = 0;
        while (separators.find()) {
            steps.add(new Step(pendingSeparator, line.substring(commandStart, separators.start())));
            pendingSeparator = separators.group();
            commandStart = separators.end();
        }
        steps.add(new Step(pendingSeparator, line.substring(commandStart)));
        return steps.stream().filter(step -> !step.command().isBlank()).toList();
    }

    private Result execute(String command) {
        List<String> words = Arrays.asList(command.strip().split("\\s+"));
        String name = words.getFirst();
        Function<List<String>, Result> handler = commands.get(name);
        if (handler == null) {
            return Result.failed("sh: 1: " + name + ": command not found\n");
        }
        return handler.apply(words.subList(1, words.size()));
    }

    private Result ping(List<String> arguments) {
        if (arguments.isEmpty()) {
            return Result.failed("ping: usage error: destination address required\n");
        }
        String host = arguments.getLast();
        return Result.ok("PING " + host + ": 3 packets transmitted, 3 received, 0% packet loss\n");
    }

    private Result list(List<String> arguments) {
        String directory = arguments.isEmpty() ? WORKING_DIRECTORY : resolve(arguments.getFirst());
        List<String> entries = files.list(directory);
        if (entries.isEmpty()) {
            return Result.failed("ls: cannot access '" + directory + "': No such file or directory\n");
        }
        return Result.ok(String.join("\n", entries) + "\n");
    }

    private Result concatenate(List<String> arguments) {
        if (arguments.isEmpty()) {
            return Result.failed("cat: missing operand\n");
        }
        String path = arguments.getFirst();
        Optional<String> content = files.read(resolve(path));
        return content
                .map(Result::ok)
                .orElseGet(() -> Result.failed("cat: " + path + ": No such file or directory\n"));
    }

    private static String resolve(String path) {
        return path.startsWith("/") ? path : WORKING_DIRECTORY + "/" + path;
    }
}
