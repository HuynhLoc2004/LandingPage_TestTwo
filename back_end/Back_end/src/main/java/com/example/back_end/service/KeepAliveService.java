package com.example.back_end.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@ConditionalOnProperty(prefix = "keep-alive", name = "enabled", havingValue = "true")
public class KeepAliveService {

    private static final Logger logger = LoggerFactory.getLogger(KeepAliveService.class);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Value("${keep-alive.url:}")
    private String keepAliveUrl;

    private boolean missingUrlLogged;

    @Scheduled(
            initialDelayString = "${keep-alive.initial-delay-ms:60000}",
            fixedDelayString = "${keep-alive.fixed-delay-ms:240000}"
    )
    public void ping() {
        if (keepAliveUrl == null || keepAliveUrl.isBlank()) {
            if (!missingUrlLogged) {
                logger.warn("Keep-alive is enabled but KEEP_ALIVE_URL is empty");
                missingUrlLogged = true;
            }
            return;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(keepAliveUrl.trim()))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            if (response.statusCode() >= 400) {
                logger.warn("Keep-alive ping returned HTTP {}", response.statusCode());
            } else {
                logger.debug("Keep-alive ping returned HTTP {}", response.statusCode());
            }
        } catch (Exception exception) {
            logger.warn("Keep-alive ping failed: {}", exception.getMessage());
        }
    }
}
