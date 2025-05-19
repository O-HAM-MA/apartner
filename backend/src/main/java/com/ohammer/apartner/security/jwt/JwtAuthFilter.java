package com.ohammer.apartner.security.jwt;

//시큐리티에게 jwt를 넘겨주기 위한 필터

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.util.AntPathMatcher;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor
// Spring Security Filter Chain에서 JWT 인증을 처리하는 필터
// OncePerRequestFilter를 상속받아 요청당 한 번만 실행됨
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtAuthenticationProvider jwtAuthenticationProvider; // JWT 인증 로직 처리기
    private final AntPathMatcher pathMatcher = new AntPathMatcher(); // 경로 패턴 매칭용

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String requestURI = request.getRequestURI();
        log.info("[JwtAuthFilter] Received Request: Method={}, URI={}", request.getMethod(), requestURI);

        // API 요청이 아니거나 인증이 필요 없는 API 경로인 경우 필터 스킵
        if (!requestURI.startsWith("/api/") || 
            (requestURI.startsWith("/api/v1/auth/") && !requestURI.equals("/api/v1/auth/me")) ||  // /api/v1/auth/** 경로 제외 (단, /api/v1/auth/me는 인증 필요)
            requestURI.startsWith("/api/v1/apartments/") ||  // /api/v1/apartments/** 경로 제외
            requestURI.startsWith("/api/v1/auth/login") ||  // 로그인 API 제외
            requestURI.startsWith("/api/v1/auth/logout") ||  // 로그아웃 API 제외
            requestURI.startsWith("/api/v1/users/userreg") ||  // 사용자 등록 API 제외
            requestURI.startsWith("/api/v1/users/check-") ||  // 사용자 정보 중복 체크 API 제외
            requestURI.startsWith("/api/v1/admin/login") ||  // 관리자 로그인 API 제외
            requestURI.startsWith("/api/v1/admin/register") ||  // 관리자 등록 API 제외
            requestURI.startsWith("/api/v1/admin/check") ||  // 관리자 체크 API 제외
            requestURI.startsWith("/api/v1/sms/") ||  // SMS API 제외
            requestURI.contains("/signup") ||  // 회원가입 페이지 제외
            requestURI.contains("/login") ||  // 로그인 페이지 제외
            requestURI.startsWith("/oauth2/") ||  // OAuth2 인증 시작점 제외
            requestURI.startsWith("/login/oauth2/") ||  // 로그인 페이지 제외
            requestURI.startsWith("/api/v1/entry-records/enter") ||  //
            requestURI.startsWith("/api/v1/entry-records/exit")) {  //
            log.info("[JwtAuthFilter] Skipping authentication for public endpoint: {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        // 여기부터는 인증이 필요한 API 경로에 대한 처리
        String accessToken = getAccessToken(request); // 요청에서 AccessToken 추출
        String refreshToken = getRefreshToken(request); // 요청에서 RefreshToken 추출 (쿠키)

        // AccessToken 없고 RefreshToken도 없으면 인증 시도 없이 다음 필터로
        if (accessToken == null && refreshToken == null) {
            log.info("[JwtAuthFilter] No tokens found, proceeding unauthenticated for: {}", requestURI);
            filterChain.doFilter(request, response);
            return;
        }

        // AccessToken 없고 RefreshToken만 있으면 AccessToken 재발급 시도
        if (accessToken == null && refreshToken != null) {
            try {
                accessToken = jwtAuthenticationProvider.genNewAccessToken(refreshToken); // 새 AccessToken 생성

                // 새로 발급된 AccessToken을 쿠키에 설정
                Cookie newAccessTokenCookie = new Cookie("accessToken", accessToken);
                newAccessTokenCookie.setHttpOnly(true); // JavaScript 접근 방지
                newAccessTokenCookie.setPath("/"); // 모든 경로에서 사용 가능
                newAccessTokenCookie.setMaxAge(Math.toIntExact(JwtTokenizer.ACCESS_TOKEN_EXPIRE_COUNT / 1000)); // 만료 시간 설정 (초 단위)
                response.addCookie(newAccessTokenCookie);
                response.setHeader("X-Token-Refreshed", "true"); // 응답 헤더에 토큰 재발급 플래그 설정
            } catch (Exception e) {
                // RefreshToken이 유효하지 않거나 재발급 실패 시, 로그만 남기고 다음으로 진행 (AccessToken이 여전히 null인 상태)
                log.warn("Failed to refresh access token with refresh token: {}", refreshToken, e);
            }
        }

        // AccessToken이 있는 경우 (재발급 포함) 유효성 검증 및 인증 처리
        if (accessToken != null) {
            try {
                Authentication authentication = jwtAuthenticationProvider.getAuthentication(accessToken); // AccessToken으로 Authentication 객체 생성
                SecurityContextHolder.getContext().setAuthentication(authentication); // SecurityContext에 인증 정보 저장
            } catch (Exception e) {
                // AccessToken 검증 실패 또는 인증 처리 중 예외 발생 시
                log.warn("JWT Authentication failed for token: {}. Error: {}", accessToken, e.getMessage());
                SecurityContextHolder.clearContext(); // 기존 인증 정보 클리어
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401 Unauthorized 응답
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"error\": \"인증 실패: " + e.getMessage() + "\"}");
                return; // 필터 체인 중단
            }
        }

        filterChain.doFilter(request, response); // 다음 필터 실행
    }

    // 요청 헤더(Authorization Bearer) 또는 쿠키에서 AccessToken 추출
    private String getAccessToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7); // "Bearer " 접두사 제거
        }
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    // 쿠키에서 RefreshToken 추출
    private String getRefreshToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("refreshToken".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}