package com.formora.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class DotEnvLoaderTest {

    @TempDir
    Path temporaryDirectory;

    @Test
    void loadsSupportedPropertiesFromTheCurrentDirectory() throws IOException {
        Files.writeString(temporaryDirectory.resolve(".env"), """
                MONGODB_URI=mongodb://example:27017
                MONGODB_DB_NAME=formora-test
                IGNORED_PROPERTY=value
                """);

        Map<String, Object> properties = DotEnvLoader.load(temporaryDirectory);

        assertThat(properties.get("MONGODB_URI")).isEqualTo("mongodb://example:27017");
        assertThat(properties.get("MONGODB_DB_NAME")).isEqualTo("formora-test");
        assertThat(properties).doesNotContainKey("IGNORED_PROPERTY");
    }

    @Test
    void usesDevelopmentDefaultsWhenNoFileExists() {
        Map<String, Object> properties = DotEnvLoader.load(temporaryDirectory);

        assertThat(properties.get("MONGODB_URI")).isEqualTo("mongodb://localhost:27017");
        assertThat(properties.get("PORT")).isEqualTo("3000");
    }
}
