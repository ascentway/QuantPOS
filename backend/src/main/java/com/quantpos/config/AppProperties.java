package com.quantpos.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
@Data
public class AppProperties {

    private String baseUrl;
    private final JwtProperties jwt = new JwtProperties();
    private final MailProperties mail = new MailProperties();

    @Data
    public static class MailProperties {
        private String senderName;
        private String senderEmail;
    }

    @Data
    public static class JwtProperties {
        private String secret;
        private long accessExpiryMs;
        private int refreshExpiryDays;
    }
}
