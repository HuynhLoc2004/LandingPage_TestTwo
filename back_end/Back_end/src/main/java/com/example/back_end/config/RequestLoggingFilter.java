package com.example.back_end.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String origin = request.getHeader("Origin");
        boolean hasAuthorizationHeader = request.getHeader("Authorization") != null;

        try {
            filterChain.doFilter(request, response);
        } finally {
            System.out.println("[HTTP REQUEST] method=" + method
                    + ", uri=" + uri
                    + ", origin=" + origin
                    + ", hasAuthorizationHeader=" + hasAuthorizationHeader
                    + ", status=" + response.getStatus());
        }
    }
}