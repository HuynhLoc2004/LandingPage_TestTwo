package com.example.back_end.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final String PRODUCTION_FRONTEND_ORIGIN =
            "https://landing-page-test-two-git-main-huynhtanloc.vercel.app";

    @Value("${FRONTEND_URL:http://localhost:5173}")
    private String frontendUrls;

    @Bean
    @Primary
    public TaskScheduler stompBrokerTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.setThreadNamePrefix("StompBrokerScheduler-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(10);
        scheduler.initialize();
        return scheduler;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic")
              .setTaskScheduler(stompBrokerTaskScheduler());
        config.setApplicationDestinationPrefixes("/app");
    }

    @Bean
    public HandshakeInterceptor webSocketHandshakeLoggingInterceptor() {
        return new HandshakeInterceptor() {
            @Override
            public boolean beforeHandshake(
                    ServerHttpRequest request,
                    org.springframework.http.server.ServerHttpResponse response,
                    WebSocketHandler wsHandler,
                    Map<String, Object> attributes
            ) {
                System.out.println("[WS HANDSHAKE] endpoint=" + request.getURI()
                        + ", origin=" + request.getHeaders().getOrigin());
                return true;
            }

            @Override
            public void afterHandshake(
                    ServerHttpRequest request,
                    org.springframework.http.server.ServerHttpResponse response,
                    WebSocketHandler wsHandler,
                    Exception exception
            ) {
                if (exception != null) {
                    System.out.println("[WS ERROR] endpoint=" + request.getURI()
                            + ", origin=" + request.getHeaders().getOrigin()
                            + ", message=" + exception.getMessage());
                }
            }
        };
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .addInterceptors(webSocketHandshakeLoggingInterceptor())
                .setAllowedOriginPatterns(allowedOriginPatterns())
                .withSockJS();
    }

    private String[] allowedOriginPatterns() {
        List<String> origins = new ArrayList<>(Arrays.asList(frontendUrls.split(",")));
        origins.add(PRODUCTION_FRONTEND_ORIGIN);
        origins.add("https://*.vercel.app");
        origins.add("http://localhost:5173");
        origins.add("http://localhost:5174");
        origins.add("http://127.0.0.1:5173");
        origins.add("http://127.0.0.1:5174");
        origins.add("http://localhost:*");
        origins.add("http://127.0.0.1:*");
        origins.add("*");

        return origins.stream()
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .distinct()
                .toArray(String[]::new);
    }
}
