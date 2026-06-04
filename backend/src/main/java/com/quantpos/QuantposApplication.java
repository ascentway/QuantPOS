package com.quantpos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * QuantPOS main application entry point.
 *
 * @EnableAsync activates Spring's async task execution, enabling
 * {@code @Async} on EmailService methods so SMTP calls run in a
 * separate thread pool and do not block the HTTP request thread.
 */
@SpringBootApplication
@EnableAsync
public class QuantposApplication {

	public static void main(String[] args) {
		SpringApplication.run(QuantposApplication.class, args);
	}
}
