package com.neomore.workshophub.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.PrintWriter;
import java.io.StringWriter;

import org.junit.jupiter.api.Test;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

class WorkshopPasswordFilterTest {

    private WorkshopProperties properties(String password) {
        WorkshopProperties props = new WorkshopProperties();
        props.setPassword(password);
        return props;
    }

    @Test
    void passesThroughWhenNoPasswordConfigured() throws Exception {
        WorkshopPasswordFilter filter = new WorkshopPasswordFilter(properties(""));
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/sessions/demo/events");

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        verify(response, never()).setStatus(401);
    }

    @Test
    void rejectsProtectedWriteWithoutPassword() throws Exception {
        WorkshopPasswordFilter filter = new WorkshopPasswordFilter(properties("secret"));
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        StringWriter body = new StringWriter();
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/sessions/demo/events");
        when(request.getHeader(WorkshopPasswordFilter.HEADER)).thenReturn(null);
        when(request.getParameter("password")).thenReturn(null);
        when(response.getWriter()).thenReturn(new PrintWriter(body));

        filter.doFilter(request, response, chain);

        verify(chain, never()).doFilter(request, response);
        verify(response).setStatus(401);
        assertThat(body.toString()).contains("Workshop password required");
    }

    @Test
    void allowsProtectedWriteWithCorrectHeader() throws Exception {
        WorkshopPasswordFilter filter = new WorkshopPasswordFilter(properties("secret"));
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        when(request.getMethod()).thenReturn("POST");
        when(request.getRequestURI()).thenReturn("/sessions/demo/events");
        when(request.getHeader(WorkshopPasswordFilter.HEADER)).thenReturn("secret");

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
    }

    @Test
    void allowsDashboardWithPasswordQueryParam() throws Exception {
        WorkshopPasswordFilter filter = new WorkshopPasswordFilter(properties("secret"));
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/dashboard/index.html");
        when(request.getHeader(WorkshopPasswordFilter.HEADER)).thenReturn(null);
        when(request.getParameter("password")).thenReturn("secret");

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
    }

    @Test
    void leavesReadEndpointsOpenEvenWhenProtected() throws Exception {
        WorkshopPasswordFilter filter = new WorkshopPasswordFilter(properties("secret"));
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);
        when(request.getMethod()).thenReturn("GET");
        when(request.getRequestURI()).thenReturn("/sessions/demo/feed");

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
    }
}
