package com.ohammer.apartner.security.jwt;

import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.global.Status;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Set;

@Component
@Slf4j
// JWT 토큰 생성, 파싱 및 유효성 검증 담당
public class JwtTokenizer {
    private final byte[] accessSecret;
    private final byte[] refreshSecret;

    // AccessToken 만료 시간: 24시간
    public static Long ACCESS_TOKEN_EXPIRE_COUNT= 1000 * 60 * 60 * 24L;
    // RefreshToken 만료 시간: 7일
    public static Long REFRESH_TOKEN_EXPIRE_COUNT=7*24*60*60*1000L;

    // 생성자: application.yml에서 JWT secretKey, refreshKey 주입
    public JwtTokenizer(@Value("${jwt.secretKey}") String accessSecret, @Value("${jwt.refreshKey}") String refreshSecret) {
        this.accessSecret = accessSecret.getBytes(StandardCharsets.UTF_8);
        this.refreshSecret = refreshSecret.getBytes(StandardCharsets.UTF_8);
    }

    // 내부 토큰 생성 로직
    private String createToken(Long id, String email, Status status // Status import 필요
    , Long expire, byte[] secretKey, Set<Role> roles) { // Role import 필요

        Claims claims = Jwts.claims().setSubject(email); // Subject: email
        claims.put("status", status);
        claims.put("userId", id);
        claims.put("roles", roles); // 사용자 권한
        // email을 넣었으니 phoneNum도 claims에 추가해줄 수 있음 (선택 사항)
        // claims.put("phoneNum", phoneNum);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(new Date()) // 발행 시간
                .setExpiration(new Date(new Date().getTime()+expire)) // 만료 시간
                .signWith(getSignKey(secretKey)) // 서명
                .compact();
    }

    // AccessToken 생성
    public String createAccessToken(Long id, String email, Status status, Set<Role> roles) {
        return createToken(id, email, status, ACCESS_TOKEN_EXPIRE_COUNT, accessSecret, roles);
    }

    // RefreshToken 생성
    public String createRefreshToken(Long id, String email, Status status, Set<Role> roles) {
        return createToken(id, email, status, REFRESH_TOKEN_EXPIRE_COUNT, refreshSecret, roles);
    }

    // JWT 서명 키 생성
    private static Key getSignKey(byte[] secretKey) {
        return Keys.hmacShaKeyFor(secretKey);
    }

    // AccessToken 파싱 및 검증 (유효시간 오차 7초 허용)
    public Claims parseAccessToken(String token) {
        return Jwts.parserBuilder()
                .setAllowedClockSkewSeconds(7) // 시간 오차 허용
                .setSigningKey(getSignKey(accessSecret))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // RefreshToken 파싱 및 검증 (유효시간 오차 2초 허용)
    public Claims parseRefreshToken(String token) {
        return Jwts.parserBuilder()
                .setAllowedClockSkewSeconds(2) // 시간 오차 허용
                .setSigningKey(getSignKey(refreshSecret))
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 토큰의 남은 유효 시간 계산 (AccessToken 기준)
    public long getRemainingTime(String token) {
        Claims claims = parseAccessToken(token);
        Date expiration = claims.getExpiration();
        return expiration.getTime() - System.currentTimeMillis();
    }

}
