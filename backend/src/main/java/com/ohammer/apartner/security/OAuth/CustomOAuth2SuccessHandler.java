package com.ohammer.apartner.security.OAuth;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.service.AuthService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SavedRequestAwareAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import java.util.Optional;


//로그인 처리하고 프론트에게 던져주는거
@Component
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2SuccessHandler extends SavedRequestAwareAuthenticationSuccessHandler {
    private final AuthService authService;
    private final CustomRequest customRequest;

    @SneakyThrows
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws ServletException, IOException {
        String requestUrl = request.getParameter("state"); // SavedRequestAwareAuthenticationSuccessHandler가 사용할 state
        OAuth2User oauth2User = ((OAuth2AuthenticationToken) authentication).getPrincipal();
        String registrationId = ((OAuth2AuthenticationToken) authentication).getAuthorizedClientRegistrationId();

        if ("kakao".equals(registrationId)) {
            handleKakaoLogin(request, response, oauth2User, requestUrl);
        } else {
            log.info("[OAuth2SuccessHandler] {} 로그인 처리 중: {}", registrationId, oauth2User.getName());
            Optional<User> userOptional = authService.findBySocialProviderAndSocialId(registrationId, oauth2User.getName());

            if (userOptional.isPresent()) {
                User user = userOptional.get();
                customRequest.makeAuthCookies(user);
                log.info("[OAuth2SuccessHandler] JWT 쿠키 생성: {}", user.getEmail());
            } else {
                log.warn("[OAuth2SuccessHandler] 소셜 로그인 사용자 없음: {} - {}. 회원가입 페이지로 리다이렉트 또는 기본 페이지로 리다이렉트.", registrationId, oauth2User.getName());
            }
            
            HttpSession session = request.getSession(false);
            if (session != null) {
                log.info("[OAuth2SuccessHandler] {} 로그인 전 세션 무효화. 세션 ID: {}", registrationId, session.getId());
                session.invalidate();
            }
            super.onAuthenticationSuccess(request, response, authentication);
        }
    }

    private void handleKakaoLogin(HttpServletRequest request, HttpServletResponse response, OAuth2User oauth2User, String requestUrl) throws IOException {
        Map<String, Object> attributes = oauth2User.getAttributes();
        log.info("[KakaoLogin] ===== 카카오 OAuth2 사용자 처리 시작 =====");
        log.info("[KakaoLogin] OAuth2User Principal Name: {}", oauth2User.getName());
        log.info("[KakaoLogin] OAuth2User Attributes: {}", attributes);
        
        Long id = null;
        try {
            id = Long.valueOf(oauth2User.getName()); 
            log.info("[KakaoLogin] 추출된 카카오 ID: {}", id);
        } catch (NumberFormatException e) {
            log.error("[KakaoLogin] 카카오 ID를 Long으로 변환 실패: {}", oauth2User.getName());
        }
        
        String kakaoId = oauth2User.getName(); 
        
        Map<String, Object> properties = attributes.get("properties") instanceof Map ? 
                                        (Map<String, Object>) attributes.get("properties") : 
                                        new HashMap<>();
        log.info("[KakaoLogin] Kakao properties: {}", properties);
        
        String nickname = properties.get("nickname") != null ? 
                         (String) properties.get("nickname") : null;
        log.info("[KakaoLogin] Nickname from properties: {}", nickname);
        
        String profileImage = properties.get("profile_image") != null ? 
                            (String) properties.get("profile_image") : null;
        log.info("[KakaoLogin] 프로필 이미지 속성: {}", profileImage);
        
        Map<String, Object> kakaoAccount = attributes.get("kakao_account") instanceof Map ? 
                                         (Map<String, Object>) attributes.get("kakao_account") : 
                                         new HashMap<>();
        log.info("[KakaoLogin] 카카오 계정 정보: {}", kakaoAccount);
        
        String email = kakaoAccount.get("email") instanceof String ? 
                      (String) kakaoAccount.get("email") : null;
        log.info("[KakaoLogin] 카카오 계정 이메일: {}", email);
        
        User existingUser = null;

        if (kakaoId != null && !kakaoId.isEmpty()) {
            Optional<User> userBySocialId = authService.findBySocialProviderAndSocialId("kakao", kakaoId);
            if (userBySocialId.isPresent()) {
                existingUser = userBySocialId.get();
                log.info("[KakaoLogin] 카카오 ID로 존재하는 사용자 찾음: {}", kakaoId);
            }
        }

        if (existingUser != null) {
            customRequest.makeAuthCookies(existingUser);
            log.info("[KakaoLogin] 기존 사용자 존재. JWT 쿠키 생성: {}. 이메일 (있으면): {}", 
                     existingUser.getSocialId(), existingUser.getEmail() != null ? existingUser.getEmail() : "N/A");

            log.info("[KakaoLogin] 기존 사용자 로그인 - 세션 사용 없음");
            
            String targetUrl = requestUrl != null ? requestUrl : "/";
            clearAuthenticationAttributes(request); 
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
            return;
        }

        log.info("[KakaoLogin] 신규 사용자 존재. 회원가입 페이지로 리다이렉트 - 세션에 정보 저장: {}", kakaoId);
        
        Map<String, String> kakaoUserInfo = new HashMap<>();
        kakaoUserInfo.put("socialProvider", "kakao");
        kakaoUserInfo.put("socialId", kakaoId);
        kakaoUserInfo.put("nickname", nickname != null ? nickname : "");
        kakaoUserInfo.put("profileImage", profileImage != null ? profileImage : "");
        if (email != null) {
            kakaoUserInfo.put("email", email);
        }
        
        customRequest.setSessionAttribute("kakaoUserInfo", kakaoUserInfo);
        
        StringBuilder redirectBuilder = new StringBuilder(requestUrl);
        if (!redirectBuilder.toString().endsWith("/signup")) {
            if (!redirectBuilder.toString().endsWith("/")) {
                redirectBuilder.append("/");
            }
            redirectBuilder.append("signup");
        }
        
        // URL에 authSource=kakao 파라미터 추가하여 프론트엔드가 세션에서 사용자 정보를 가져오도록 함
        redirectBuilder.append("?authSource=kakao");
        
        log.info("[KakaoLogin] 신규 사용자. 회원가입 정보를 세션에 저장했습니다.");
        log.info("[KakaoLogin] ===== 카카오 OAuth2 사용자 처리 종료 =====");
        response.sendRedirect(redirectBuilder.toString());
    }
}
