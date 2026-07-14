package com.formora.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class DotEnvLoader {

    private static final Map<String, String> DEVELOPMENT_DEFAULTS = Map.of(
            "PORT", "3000",
            "LOG_LEVEL", "INFO",
            "CORS_ORIGIN", "http://localhost:5173",
            "MONGODB_URI", "mongodb://localhost:27017",
            "MONGODB_DB_NAME", "formora",
            "SESSION_TTL_HOURS", "168",
            "SECURE_COOKIES", "false"
    );

    private DotEnvLoader() {
    }

    public static Map<String, Object> load(Path workingDirectory) {
        Map<String, Object> properties = new HashMap<>(DEVELOPMENT_DEFAULTS);
        Path envFile = findEnvFile(workingDirectory);
        if (envFile == null) {
            return properties;
        }

        try {
            for (String line : Files.readAllLines(envFile)) {
                addProperty(line, properties);
            }
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to read " + envFile, exception);
        }
        return properties;
    }

    private static Path findEnvFile(Path workingDirectory) {
        List<Path> candidates = List.of(
                workingDirectory.resolve(".env"),
                workingDirectory.resolve("../.env").normalize()
        );
        return candidates.stream().filter(Files::isRegularFile).findFirst().orElse(null);
    }

    private static void addProperty(String rawLine, Map<String, Object> properties) {
        String line = rawLine.trim();
        if (line.isEmpty() || line.startsWith("#")) {
            return;
        }

        int separator = line.indexOf('=');
        if (separator <= 0) {
            return;
        }
        String key = line.substring(0, separator).trim();
        String value = removeMatchingQuotes(line.substring(separator + 1).trim());
        if (DEVELOPMENT_DEFAULTS.containsKey(key)) {
            properties.put(key, value);
        }
    }

    private static String removeMatchingQuotes(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }
}
