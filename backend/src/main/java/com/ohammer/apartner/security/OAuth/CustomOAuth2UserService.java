package com.ohammer.apartner.security.OAuth;


import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.security.service.AuthService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * OAuth2 인증 요청을 처리하는 서비스
 * 주의: 실제 로그인 및 회원가입 로직은 CustomOAuth2SuccessHandler에서 처리함
 * 이 클래스는 OAuth2 인증 정보를 가져오는 역할만 수행
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final AuthService authService;

    @Transactional
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) {
        // OAuth2에서 가져온 유저 정보
        OAuth2User oAuth2User = super.loadUser(userRequest);
        log.debug("OAuth2 인증 성공. 사용자 정보: {}", oAuth2User.getAttributes());
        
        // 인증 공급자(카카오, 구글 등) 확인
        String providerType = userRequest
                .getClientRegistration()
                .getRegistrationId()
                .toLowerCase(Locale.getDefault());
        
        log.debug("OAuth2 공급자: {}", providerType);
        
        /* 
         * ======== 중요 ========
         * 기존에는 여기서 사용자 정보를 확인하고 회원가입을 처리했으나,
         * 이 로직은 CustomOAuth2SuccessHandler로 이동했습니다.
         * 
         * 아래 코드는 참고용으로 주석 처리합니다.
         */
        /*
        // 인증 아이디를 이름에서 가져온다
        String oauthId = oAuth2User.getName();

        // 인증의 공급자를 가져온다
        String providerTypeCode = userRequest
                .getClientRegistration() // ClientRegistration
                .getRegistrationId()     // String
                .toUpperCase(Locale.getDefault());

        // 유저의 정보를 가져온다
        Map<String, Object> attributes = oAuth2User.getAttributes();
        Map<String, String> attributesProperties = (Map<String, String>) attributes.get("properties");

        // 가져온 정보에서 닉네임과 프사를 가져온다
        String userName = attributesProperties.get("nickname");
        String profileImgUrl = attributesProperties.get("profile_image");
        // 유저명은 이렇게 설정을 해둔다
        String socialId = providerTypeCode + "__" + oauthId;
      
        System.out.println("이미지 : " + profileImgUrl);

        // 그리고 가입
        User user = authService.modifyOrJoin(userName, profileImgUrl, providerTypeCode, socialId);
        */
        
        // OAuth2User 그대로 반환하여 SuccessHandler에서 처리하도록 함
        return oAuth2User;
    }
}
