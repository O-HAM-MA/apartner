package com.ohammer.apartner.security.jwt;


import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.security.CustomUserDetails;
import com.ohammer.apartner.security.service.AuthService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
// JWT를 사용하여 인증을 처리하는 Provider
public class JwtAuthenticationProvider {

    private final JwtTokenizer jwtTokenizer; // JWT 생성 및 파싱
    private final AuthService authService; // 사용자 정보 조회 서비스
    private final RedisTemplate<String, String> redisTemplate; // Redis 연동 (토큰 블랙리스트 등)

    // JWT 클레임에서 User 엔티티 조회 및 상태 검증
    public User getUserFromClaims(Claims claims) {
        Long userId = extractUserId(claims); // 클레임에서 userId 추출
        User user = authService.findByIdWithRoles(userId)
                .orElseThrow(() -> new RuntimeException("존재하지 않는 사용자입니다"));

        // 사용자 계정 상태 확인 및 상태별 메시지 처리
        switch (user.getStatus()) {
            case ACTIVE:
                // 활성 상태이면 정상 진행
                break;
            case INACTIVE:
                log.warn("INACTIVE 계정으로 인증 시도: userId={}, status={}", userId, user.getStatus());
                throw new RuntimeException("비활성화된 계정입니다. 관리자에게 문의하세요.");
            case PENDING:
                log.warn("PENDING 계정으로 인증 시도: userId={}, status={}", userId, user.getStatus());
                throw new RuntimeException("계정이 정지되었습니다. 관리자에게 문의하세요.");
            case WITHDRAWN:
                log.warn("WITHDRAWN 계정으로 인증 시도: userId={}, status={}", userId, user.getStatus());
                throw new RuntimeException("이미 탈퇴한 계정입니다.");
            default:
                // 혹시 모를 다른 상태값에 대한 처리
                log.warn("알 수 없는 계정 상태로 인증 시도: userId={}, status={}", userId, user.getStatus());
                throw new RuntimeException("계정 상태를 확인할 수 없습니다. 관리자에게 문의하세요.");
        }

        return user;
    }

    // RefreshToken으로 새로운 AccessToken 생성
    public String genNewAccessToken(String refreshToken) {
        Claims claims;
        try {
            // RefreshToken 파싱 및 유효성 검증
            claims = jwtTokenizer.parseRefreshToken(refreshToken);
        } catch (Exception e) {
            throw new RuntimeException("유효하지 않은 토큰입니다", e);
        }
        User user = getUserFromClaims(claims); // 클레임 기반 User 조회
        return authService.genAccessToken(user); // 새 AccessToken 생성
    }

    // AccessToken을 검증하고 Authentication 객체 생성
    public Authentication getAuthentication(String token) {
        Claims claims;
        try {
            claims = jwtTokenizer.parseAccessToken(token); // AccessToken 파싱
        } catch (ExpiredJwtException e) {
            throw new RuntimeException("토큰이 만료되었습니다", e);
        } catch (Exception e) {
            throw new RuntimeException("유효하지 않은 토큰입니다", e);
        }

        try {
            // Redis를 사용한 토큰 블랙리스트 확인
            Boolean isBlacklisted = redisTemplate.hasKey(token);
            if (Boolean.TRUE.equals(isBlacklisted)) {
                log.warn("🚫 블랙리스트 토큰 사용: {}", token);
                throw new RuntimeException("로그아웃된 토큰입니다");
            }
        } catch (Exception e) {
            log.error("❌ Redis 연결 실패 또는 확인 중 오류: {}", e.getMessage(), e);
            throw new RuntimeException("인증 서버 오류 (Redis 확인 실패)", e);
        }

        User user = getUserFromClaims(claims); // 클레임 기반 User 조회

        // User의 Role 정보를 GrantedAuthority 컬렉션으로 변환
        Collection<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.name())) // Role enum의 name() 사용 가정
                .collect(Collectors.toList());

        // JwtAuthenticationToken 생성 (인증된 사용자 정보 포함)
        return new JwtAuthenticationToken(authorities, new CustomUserDetails(user), null);
    }

    // JWT 클레임에서 userId 추출 (타입 변환 처리 포함)
    private Long extractUserId(Claims claims) {
        Object userIdRaw = claims.get("userId");
        if (userIdRaw instanceof Integer) return ((Integer) userIdRaw).longValue();
        if (userIdRaw instanceof Long) return (Long) userIdRaw;
        if (userIdRaw instanceof String) return Long.parseLong((String) userIdRaw);
        throw new IllegalStateException("JWT에 userId 없음");
    }

}
