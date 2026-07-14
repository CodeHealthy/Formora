package com.formora;

import com.formora.config.FormoraProperties;
import com.formora.config.DotEnvLoader;
import java.nio.file.Path;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(FormoraProperties.class)
public class FormoraApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(FormoraApplication.class);
        application.setDefaultProperties(DotEnvLoader.load(Path.of("").toAbsolutePath()));
        application.run(args);
    }
}
