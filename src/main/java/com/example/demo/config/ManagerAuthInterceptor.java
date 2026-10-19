package com.example.demo.config;

import com.example.demo.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;

/**
 * Everything under /api needs the X-Manager-Token header, except what tenants and visitors must reach:
 * reading properties, submitting a report, and signing in.
 */
@Component
public class ManagerAuthInterceptor implements HandlerInterceptor {

    public static final String HEADER = "X-Manager-Token";

    private final AuthService authService;

    public ManagerAuthInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String method = request.getMethod();
        String path = request.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(method) || isPublic(method, path)) {
            return true;
        }
        if (authService.isValid(request.getHeader(HEADER))) {
            return true;
        }
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"status\":401,\"message\":\"Please sign in as a manager to do this.\"}");
        return false;
    }

    private boolean isPublic(String method, String path) {
        if (path.equals("/api/auth/login") && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        if (path.equals("/api/reports") && "POST".equalsIgnoreCase(method)) {
            return true;
        }
        return "GET".equalsIgnoreCase(method)
                && (path.equals("/api/properties") || path.startsWith("/api/properties/"));
    }
}
