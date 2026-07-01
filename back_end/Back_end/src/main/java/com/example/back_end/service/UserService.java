package com.example.back_end.service;

import com.example.back_end.customize.AppException;
import com.example.back_end.dto.request.UserLoginRequest;
import com.example.back_end.dto.request.UserRegisterRequest;
import com.example.back_end.dto.response.AuthResponse;
import com.example.back_end.entity.RevokedToken;
import com.example.back_end.entity.UserEntity;
import com.example.back_end.mapper.UserMapper;
import com.example.back_end.repository.RevokedTokenRepository;
import com.example.back_end.repository.UserRepository;
import com.example.back_end.repository.FavoriteListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.example.back_end.entity.FavoriteList;
import java.util.Date;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final RevokedTokenRepository revokedTokenRepository;
    private final FavoriteListRepository favoriteListRepository;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

    public UserService(UserRepository userRepository, UserMapper userMapper, PasswordEncoder passwordEncoder, JwtService jwtService, AuthenticationManager authenticationManager, UserDetailsService userDetailsService, RevokedTokenRepository revokedTokenRepository, FavoriteListRepository favoriteListRepository) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.revokedTokenRepository = revokedTokenRepository;
        this.favoriteListRepository = favoriteListRepository;
    }

    public UserDetailsService getUserDetailsService() {
        return userDetailsService;
    }

    public long getRefreshTokenExpirationMillis() {
        return jwtService.getRefreshTokenExpirationMillis();
    }

    @Transactional
    public AuthResponse registerUser(UserRegisterRequest request) {
        logger.info("Attempting to register user: {}", request.getUsername());
        if (userRepository.existsByUsername(request.getUsername())) {
            logger.warn("Registration failed: Username already exists - {}", request.getUsername());
            throw new AppException(HttpStatus.BAD_REQUEST, "Username already exists");
        }

        UserEntity user = userMapper.toUserEntity(request);
        logger.debug("User entity created for: {}", request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        logger.debug("Password encoded for user: {}", request.getUsername());
        // Save the user first to get an ID
        UserEntity registeredUser = userRepository.save(user);
        logger.debug("User saved, ID: {}", registeredUser.getId());

        // Initialize an empty FavoriteList for the new user and link it
        FavoriteList favoriteList = FavoriteList.builder().user(registeredUser).build();
        registeredUser.setFavoriteList(favoriteList);
        // Explicitly save the favorite list
        favoriteListRepository.save(favoriteList);
        logger.debug("FavoriteList created and saved for user: {}", registeredUser.getUsername());

        // Save the user again to ensure the bidirectional relationship is persisted if not already cascaded
        userRepository.save(registeredUser);
        logger.info("User registered successfully: {}", registeredUser.getUsername());

        UserDetails userDetails = userDetailsService.loadUserByUsername(registeredUser.getUsername());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        long refreshTokenExpiration = jwtService.getRefreshTokenExpirationMillis();

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .refreshTokenExpiration(refreshTokenExpiration)
                .build();
    }

    @Transactional
    public AuthResponse loginUser(UserLoginRequest request) {
        logger.info("Attempting to log in user: {}", request.getUsername());
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );
        logger.debug("User authenticated: {}", request.getUsername());
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        logger.debug("User details loaded from authentication for: {}", request.getUsername());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);
        long refreshTokenExpiration = jwtService.getRefreshTokenExpirationMillis();
        logger.info("User logged in successfully, tokens generated for: {}", request.getUsername());
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .refreshTokenExpiration(refreshTokenExpiration)
                .build();
    }

    @Transactional
    public void logoutUser(String refreshToken) {
        if (jwtService.isTokenRevoked(refreshToken)) {
            throw new AppException(HttpStatus.BAD_REQUEST, "Refresh token already revoked");
        }
        RevokedToken revokedToken = new RevokedToken();
        revokedToken.setToken(refreshToken);
        revokedToken.setExpiryDate(jwtService.extractExpiration(refreshToken));
        revokedTokenRepository.save(revokedToken);
        logger.info("Refresh token revoked: {}", refreshToken);
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        if (jwtService.isTokenRevoked(refreshToken)) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Refresh token revoked");
        }

        String username = jwtService.extractUsername(refreshToken);
        if (username == null) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new AppException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        // Revoke the old refresh token
        logoutUser(refreshToken);

        // Generate new tokens
        String newAccessToken = jwtService.generateToken(userDetails);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails);
        long newRefreshTokenExpiration = jwtService.getRefreshTokenExpirationMillis();

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .refreshTokenExpiration(newRefreshTokenExpiration)
                .build();
    }
}
