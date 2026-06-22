package com.neomore.workshophub.config;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Enforces the optional shared workshop password. When {@code workshop.password}
 * is blank the filter is a no-op (fully open). When configured it requires the
 * password on:
 * <ul>
 *   <li>write endpoints: {@code POST /sessions/**} (via {@code X-Workshop-Password} header)</li>
 *   <li>the projector dashboard: {@code /} and {@code /dashboard/**}
 *       (via header or {@code ?password=} query param, since EventSource/static
 *       requests cannot set headers)</li>
 * </ul>
 * Read endpoints (feed, stream, tasks, health) stay open so the gated dashboard
 * can stream updates without custom headers.
 */
@Component
public class WorkshopPasswordFilter extends OncePerRequestFilter {

    static final String HEADER = "X-Workshop-Password";
    private static final String QUERY_PARAM = "password";

    private final WorkshopProperties properties;

    public WorkshopPasswordFilter(WorkshopProperties properties) {
        this.properties = properties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        if (!properties.isPasswordProtected() || isPreflight(request) || !isProtected(request)) {
            chain.doFilter(request, response);
            return;
        }

        if (isAuthorized(request)) {
            chain.doFilter(request, response);
        } else {
            reject(response);
        }
    }

    private boolean isProtected(HttpServletRequest request) {
        String path = request.getRequestURI();
        boolean writeEndpoint = "POST".equalsIgnoreCase(request.getMethod()) && path.startsWith("/sessions/");
        boolean dashboard = path.equals("/") || path.startsWith("/dashboard");
        return writeEndpoint || dashboard;
    }

    private boolean isAuthorized(HttpServletRequest request) {
        String expected = properties.getPassword();
        String header = request.getHeader(HEADER);
        if (expected.equals(header)) {
            return true;
        }
        String query = request.getParameter(QUERY_PARAM);
        return expected.equals(query);
    }

    private boolean isPreflight(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    private void reject(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\","
                + "\"message\":\"Workshop password required\"}");
    }
}
