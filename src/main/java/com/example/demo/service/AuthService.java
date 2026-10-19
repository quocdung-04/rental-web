package com.example.demo.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Minimal manager sign-in (single shared account, in-memory tokens).
 * Credentials come from MANAGER_USERNAME / MANAGER_PASSWORD. If no password is set, a random one is generated
 * and printed in the console at startup, so nothing is ever committed to Git.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final Duration TOKEN_LIFETIME = Duration.ofHours(8);

    private final String username;
    private final String password;
    private final SecureRandom random = new SecureRandom();
    private final Map<String, Instant> tokens = new ConcurrentHashMap<>();

    public AuthService(@Value("${app.manager.username:manager}") String username,
                       @Value("${app.manager.password:}") String password) {
        this.username = username;
        if (password == null || password.isBlank()) {
            byte[] bytes = new byte[9];
            random.nextBytes(bytes);
            this.password = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
            log.warn("MANAGER_PASSWORD is not set. Generated manager login -> username: '{}'  password: '{}'",
                    this.username, this.password);
        } else {
            this.password = password;
        }
    }

    public String login(String user, String pass) {
        boolean ok = safeEquals(user, username) & safeEquals(pass, password);
        if (!ok) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wrong username or password");
        }
        Instant now = Instant.now();
        tokens.values().removeIf(expiry -> expiry.isBefore(now));
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tokens.put(token, now.plus(TOKEN_LIFETIME));
        return token;
    }

    public boolean isValid(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        Instant expiry = tokens.get(token);
        if (expiry == null) {
            return false;
        }
        if (expiry.isBefore(Instant.now())) {
            tokens.remove(token);
            return false;
        }
        return true;
    }

    public void logout(String token) {
        if (token != null) {
            tokens.remove(token);
        }
    }

    private static boolean safeEquals(String a, String b) {
        return MessageDigest.isEqual(
                (a == null ? "" : a).getBytes(StandardCharsets.UTF_8),
                (b == null ? "" : b).getBytes(StandardCharsets.UTF_8));
    }
}
