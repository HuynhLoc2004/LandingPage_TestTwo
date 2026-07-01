package com.example.back_end.controller;

import com.example.back_end.dto.request.UserLoginRequest;
import com.example.back_end.dto.request.UserRegisterRequest;
import com.example.back_end.dto.response.AuthResponse;
import com.example.back_end.service.UserService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody UserRegisterRequest request) {
        AuthResponse response = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody UserLoginRequest request, HttpServletResponse response) {
        AuthResponse authResponse = userService.loginUser(request);

        // Set refresh token in a secure, HTTP-only cookie
        Cookie refreshTokenCookie = new Cookie("auth_token", authResponse.getRefreshToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true); // Only send over HTTPS
        refreshTokenCookie.setPath("/"); // Accessible from all paths
        refreshTokenCookie.setMaxAge((int) (userService.getRefreshTokenExpirationMillis() / 1000)); // Max age in seconds
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response, @CookieValue(name = "auth_token", required = false) String refreshToken) {
        if (refreshToken != null) {
            userService.logoutUser(refreshToken);
        }

        // Invalidate the refresh token cookie
        Cookie refreshTokenCookie = new Cookie("auth_token", null);
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge(0); // Set max age to 0 to delete the cookie
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(@CookieValue(name = "auth_token", required = false) String refreshToken, HttpServletResponse response) {
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        AuthResponse authResponse = userService.refreshToken(refreshToken);

        // Update refresh token in cookie
        Cookie refreshTokenCookie = new Cookie("auth_token", authResponse.getRefreshToken());
        refreshTokenCookie.setHttpOnly(true);
        refreshTokenCookie.setSecure(true);
        refreshTokenCookie.setPath("/");
        refreshTokenCookie.setMaxAge((int) (userService.getRefreshTokenExpirationMillis() / 1000));
        response.addCookie(refreshTokenCookie);

        return ResponseEntity.ok(authResponse);
    }
}