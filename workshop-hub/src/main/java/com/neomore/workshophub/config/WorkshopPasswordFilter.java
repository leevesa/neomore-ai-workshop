package com.neomore.workshophub.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import org.springframework.http.HttpHeaders;
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
 *   <li>write endpoints: any {@code POST} (via {@code X-Workshop-Password} header)</li>
 *   <li>the projector dashboard: {@code /} and {@code /dashboard/**}
 *       (via HTTP Basic auth, the {@code X-Workshop-Password} header, or a
 *       {@code ?password=} query param)</li>
 * </ul>
 * The dashboard challenges with HTTP Basic auth ({@code WWW-Authenticate: Basic}),
 * so a plain browser shows a native login prompt and then replays the cached
 * credentials on the dashboard's static assets — no header tricks required. Any
 * username is accepted; only the password is checked.
 * <p>
 * Read endpoints (feed, stream, tasks, health) stay open so the gated dashboard
 * can stream updates without custom headers.
 */
@Component
public class WorkshopPasswordFilter extends OncePerRequestFilter {

    static final String HEADER = "X-Workshop-Password";
    private static final String QUERY_PARAM = "password";
    private static final String BASIC_PREFIX = "Basic ";
    private static final String REALM = "Workshop Hub Dashboard";

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
        } else if (isDashboard(request)) {
            challenge(response);
        } else {
            reject(response);
        }
    }

    private boolean isProtected(HttpServletRequest request) {
        return isWriteEndpoint(request) || isDashboard(request);
    }

    private boolean isWriteEndpoint(HttpServletRequest request) {
        return "POST".equalsIgnoreCase(request.getMethod());
    }

    private boolean isDashboard(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/") || path.startsWith("/dashboard");
    }

    private boolean isAuthorized(HttpServletRequest request) {
        String expected = properties.getPassword();
        if (expected.equals(request.getHeader(HEADER))) {
            return true;
        }
        if (expected.equals(request.getParameter(QUERY_PARAM))) {
            return true;
        }
        return expected.equals(basicAuthPassword(request));
    }

    /**
     * Extract the password from an HTTP Basic {@code Authorization} header. The
     * username is ignored — only the password portion is compared. Returns
     * {@code null} when the header is absent or malformed.
     */
    private String basicAuthPassword(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.regionMatches(true, 0, BASIC_PREFIX, 0, BASIC_PREFIX.length())) {
            return null;
        }
        try {
            String decoded = new String(
                    Base64.getDecoder().decode(header.substring(BASIC_PREFIX.length()).trim()),
                    StandardCharsets.UTF_8);
            int separator = decoded.indexOf(':');
            return separator >= 0 ? decoded.substring(separator + 1) : decoded;
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private boolean isPreflight(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    /**
     * Challenge the browser with HTTP Basic auth so it shows a native login
     * prompt for the dashboard.
     */
    private void challenge(HttpServletResponse response) throws IOException {
        response.setHeader(HttpHeaders.WWW_AUTHENTICATE, "Basic realm=\"" + REALM + "\", charset=\"UTF-8\"");
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.TEXT_PLAIN_VALUE);
        response.getWriter().write("Workshop password required");
    }

    private void reject(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"status\":401,\"error\":\"Unauthorized\","
                + "\"message\":\"Workshop password required\"}");
    }
}
