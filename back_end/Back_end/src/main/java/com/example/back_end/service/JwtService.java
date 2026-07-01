package com.example.back_end.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.PostConstruct;

import java.security.Key;
import com.example.back_end.repository.RevokedTokenRepository;
import lombok.RequiredArgsConstructor;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);

    private final RevokedTokenRepository revokedTokenRepository;

    @Value("${jwt.secretKey}")
    private String secretKey;
    @Value("${jwt.accessTokenExpiration}")
    private String accessTokenExpiration;
    @Value("${jwt.refreshTokenExpiration}")
    private String refreshTokenExpiration;

    private Key cachedSignInKey; // Cache the signing key

    @PostConstruct
    public void init() {
        logger.info("JWT_SECRET_KEY: {}", secretKey);
        logger.info("JWT_ACCESS_TOKEN_EXPIRATION: {}", accessTokenExpiration);
        logger.info("JWT_REFRESH_TOKEN_EXPIRATION: {}", refreshTokenExpiration);
    }

    public long getRefreshTokenExpirationMillis() {
        return parseExpiration(refreshTokenExpiration);
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails
    ) {
        return buildToken(extraClaims, userDetails, parseExpiration(accessTokenExpiration));
    }

    public String generateRefreshToken(
            UserDetails userDetails
    ) {
        return buildToken(new HashMap<>(), userDetails, parseExpiration(refreshTokenExpiration));
    }

    private String buildToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails,
            long expiration
    ) {
        // Add user ID to claims
        if (userDetails instanceof com.example.back_end.entity.UserEntity) {
            extraClaims.put("userId", ((com.example.back_end.entity.UserEntity) userDetails).getId());
        }

        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token) && !isTokenRevoked(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public boolean isTokenRevoked(String token) {
        return revokedTokenRepository.findByToken(token).isPresent();
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        if (cachedSignInKey == null) {
            byte[] keyBytes = Decoders.BASE64.decode(secretKey);
            cachedSignInKey = Keys.hmacShaKeyFor(keyBytes);
        }
        return cachedSignInKey;
    }

    private long parseExpiration(String expiration) {
        if (expiration.endsWith("m")) {
            return Long.parseLong(expiration.substring(0, expiration.length() - 1)) * 60 * 1000; // minutes to milliseconds
        } else if (expiration.endsWith("h")) {
            return Long.parseLong(expiration.substring(0, expiration.length() - 1)) * 60 * 60 * 1000; // hours to milliseconds
        } else if (expiration.endsWith("d")) {
            return Long.parseLong(expiration.substring(0, expiration.length() - 1)) * 24 * 60 * 60 * 1000; // days to milliseconds
        } else {
            throw new IllegalArgumentException("Invalid expiration format: " + expiration);
        }
    }
}
