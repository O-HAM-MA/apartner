package com.ohammer.apartner.security.jwt;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

// Spring Security의 Authentication 객체를 JWT용으로 확장한 클래스
// 인증된 사용자의 정보(principal), 권한(authorities) 등을 저장
public class JwtAuthenticationToken extends AbstractAuthenticationToken {
    private String token; // 실제 JWT 문자열 (필요시 저장)
    private Object principal; // 인증된 사용자 객체 (UserDetails 등)
    private Object credentials; // 자격 증명 (일반적으로 JWT에서는 사용 안 함, 토큰 자체가 자격 증명)

    // 생성자: 인증된 사용자의 권한, principal, credentials를 받아 초기화
    public JwtAuthenticationToken(Collection<? extends GrantedAuthority> authorities,
                                  Object principal, Object credentials) {
        super(authorities); // 부모 클래스에 권한 목록 전달
        this.principal = principal; // 사용자 정보 저장
        this.credentials = credentials; // 자격 증명 저장 (보통 null 또는 빈 값)
        this.setAuthenticated(true); // 생성 시점에서 인증 완료 상태로 설정
    }

    @Override
    public Object getCredentials() {
        // 자격 증명 반환
        return this.credentials;
    }

    @Override
    public Object getPrincipal() {
        // 인증된 사용자 정보 반환
        return this.principal;
    }
}
