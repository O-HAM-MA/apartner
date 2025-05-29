package com.ohammer.apartner.security.OAuth;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.jwt.JwtTokenizer;
import com.ohammer.apartner.security.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import com.ohammer.apartner.domain.user.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.RequestScope;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.Cookie;


//응답, 요청, 쿠키, 세션등을 다룬다
@RequestScope
@Component
@RequiredArgsConstructor
public class CustomRequest {
    private final HttpServletRequest req;
    private final HttpServletResponse resp;
    private final AuthService authService;
    private static final Logger log = LoggerFactory.getLogger(CustomRequest.class);

    //로그인 처리를 위하여 SecurityContextHolder에 유저를 넣음
    public void setLogin(User member) {
        //userDetails와 구분하기 위하여 이렇게 썼습니다
        UserDetails user = new SecurityUser(
                member.getId(),
                member.getUserName(),
                member.getEmail(),
                "",
                member.getStatus(),
                List.of(new SimpleGrantedAuthority("ROLE_" + member.getStatus().getValue().toUpperCase()))

        );

        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user,
                user.getPassword(),
                user.getAuthorities()
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    //로그인한 사용자 정보 가져오기
    public User getActor() {
        return Optional.ofNullable(
                        SecurityContextHolder
                                .getContext()
                                .getAuthentication()
                )
                .map(Authentication::getPrincipal)
                .filter(principal -> principal instanceof SecurityUser)
                .map(principal -> (SecurityUser) principal)
                //원본은 그냥 유저 객체를 생성하는데, 엔티티에 해당 생성자를 만드는 것 보다 findById가 더 구현하기 깔끔하다고 생각
                //하지만 속도를 생각한다면 그냥 생성자 하나 만드는게 더 빠를듯
               // .map(securityUser -> authService.findById(securityUser.getId()).get())
               .map(securityUser -> {
                   Set<Role> roles = securityUser.getAuthorities().stream()
                           .map(grantedAuthority ->
                                   // "ROLE_ACTIVE" -> Role.ACTIVE 로 변환 가정
                                   // Role enum의 실제 값에 따라 수정 필요할 수 있음
                                   Role.valueOf(grantedAuthority.getAuthority().substring("ROLE_".length()))
                           )
                           .collect(Collectors.toSet());
                   return new User(
                           securityUser.getId(),
                           securityUser.getUsername(),
                           securityUser.getEmail(),
                           securityUser.getPassword(), // SecurityUser 생성 시 "" 로 설정됨
                           securityUser.getStatus(),
                           roles);
                   }
               )
                .orElse(null);
    }

    //쿠키 세팅
    public void setCookie(String name, String value, Long maxAge) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .path("/")
                .secure(true)
                .sameSite("Lax") // Strict 대신 Lax로 완화
                .httpOnly(true)
                .maxAge(maxAge / 1000) // 밀리초 → 초 변환
                .build();
        resp.addHeader("Set-Cookie", cookie.toString());
    }

    //쿠키 가져오기(이미 쿠키가 있다면)
    public String getCookieValue(String name) {
        return Optional
                .ofNullable(req.getCookies())
                .stream() // 1 ~ 0
                .flatMap(cookies -> Arrays.stream(cookies))
                .filter(cookie -> cookie.getName().equals(name))
                .map(cookie -> cookie.getValue())
                .findFirst()
                .orElse(null);
    }

    //쿠키 삭제하기(로그아웃시 필요한들?)
    public void deleteCookie(String name) {
        ResponseCookie cookie = ResponseCookie.from(name, null)
                .path("/")
                .sameSite("Lax")
                .secure(true)
                .httpOnly(true)
                .maxAge(0)
                .build();

        resp.addHeader("Set-Cookie", cookie.toString());
    }

    //헤더 설정
    public void setHeader(String name, String value) {
        resp.setHeader(name, value);
    }

    //헤더 조회
    public String getHeader(String name) {
        return req.getHeader(name);
    }

    //토큰 만들고 헤더에 등록시키기
    //얜 jwt인가
//    public void refreshAccessToken(Member member) {
//        String newAccessToken = memberService.genAccessToken(member);
//
//        setHeader("Authorization", "Bearer " + member.getApiKey() + " " + newAccessToken);
//        setCookie("accessToken", newAccessToken);
//    }

    //인증 쿠키 만들기
    public void makeAuthCookies(User user) {
        log.info("[makeAuthCookies] Creating JWT cookies for user: {}, ID: {}", user.getEmail(), user.getId());
        
        // 기존 인증 쿠키가 있으면 제거
        Cookie[] cookies = req.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("accessToken".equals(cookie.getName()) || "refreshToken".equals(cookie.getName())) {
                    cookie.setValue("");
                    cookie.setPath("/");
                    cookie.setMaxAge(0);
                    resp.addCookie(cookie);
                    log.info("[makeAuthCookies] Removed existing cookie: {}", cookie.getName());
                }
            }
        }
        
        // JWT 토큰 발급 및 쿠키에 저장
        String accessToken = authService.genAccessToken(user);
        String refreshToken = authService.genRefreshToken(user);
        authService.addRefreshToken(user, refreshToken); // 리프레시 토큰 DB에 저장
        
        // accessToken 쿠키 설정
        setCookie("accessToken", accessToken, JwtTokenizer.ACCESS_TOKEN_EXPIRE_COUNT);
        setCookie("refreshToken", refreshToken, JwtTokenizer.REFRESH_TOKEN_EXPIRE_COUNT);
        
        log.info("[makeAuthCookies] JWT cookies created successfully for user: {}", user.getEmail());
    }

    //세션에 데이터 저장
    public void setSessionAttribute(String name, Object value) {
        HttpSession session = req.getSession(true);
        session.setAttribute(name, value);
        log.info("[Session] Attribute set: {}", name);
    }
    
    //세션에서 데이터 조회
    @SuppressWarnings("unchecked")
    public <T> T getSessionAttribute(String name) {
        HttpSession session = req.getSession(false);
        if (session == null) {
            log.info("[Session] No session exists when trying to get attribute: {}", name);
            return null;
        }
        
        Object value = session.getAttribute(name);
        log.info("[Session] Retrieved attribute: {}, exists: {}", name, value != null);
        return (T) value;
    }
    
    //세션에서 데이터 삭제
    public void removeSessionAttribute(String name) {
        HttpSession session = req.getSession(false);
        if (session != null) {
            session.removeAttribute(name);
            log.info("[Session] Removed attribute: {}", name);
        }
    }
    
    //세션 무효화
    public void invalidateSession() {
        HttpSession session = req.getSession(false);
        if (session != null) {
            session.invalidate();
            log.info("[Session] Session invalidated");
        }
    }
}
