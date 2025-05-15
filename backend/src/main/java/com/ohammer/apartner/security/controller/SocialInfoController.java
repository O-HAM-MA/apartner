package com.ohammer.apartner.security.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
@Slf4j
public class SocialInfoController {

    @GetMapping("/check-social-session")
    public ResponseEntity<?> checkSocialSession(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        
        if (session == null) {
            log.warn("세션 없음");
            return ResponseEntity.ok(new HashMap<>());
        }
        
        @SuppressWarnings("unchecked")
        Map<String, Object> kakaoUserInfo = (Map<String, Object>) session.getAttribute("kakaoUserInfo");
        
        if (kakaoUserInfo == null) {
            log.warn("카카오 사용자 세션에 kakaoUserInfo 없음");
            return ResponseEntity.ok(new HashMap<>());
        }
        
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("socialProvider", kakaoUserInfo.get("socialProvider"));
        responseData.put("nickname", kakaoUserInfo.get("nickname"));
        responseData.put("profileImage", kakaoUserInfo.get("profileImage"));
        // socialId는 보안상의 이유로 클라이언트에 전달하지 않음
        // responseData.put("socialId", kakaoUserInfo.get("socialId"));
        
        // 필요한 경우 email 정보도 전달
        if (kakaoUserInfo.containsKey("email")) {
            responseData.put("email", kakaoUserInfo.get("email"));
        }
        
        log.info("소셜 정보 반환 (socialId 제외): {}", responseData);
        
        return ResponseEntity.ok(responseData);
    }
} 