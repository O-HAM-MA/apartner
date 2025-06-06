package com.ohammer.apartner.domain.user.service;

import com.ohammer.apartner.domain.user.exception.UserErrorCode;
import com.ohammer.apartner.domain.user.exception.UserException;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.entity.UserLog;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.domain.user.repository.UserLogRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;
import com.ohammer.apartner.domain.user.dto.PasswordResetRequestDTO;
import com.ohammer.apartner.security.dto.FindEmailRequest;
import com.ohammer.apartner.security.dto.FindEmailResponse;
import org.springframework.data.redis.core.RedisTemplate;
import com.ohammer.apartner.security.exception.AuthException;
import com.ohammer.apartner.security.exception.AuthErrorCode;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserFindService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserLogRepository userLogRepository;
    private final RedisTemplate<String, String> redisTemplate;

    // 아이디(Username) 찾기
    public String findUserNameByPhoneNum(String phoneNum) {
        return userRepository.findByPhoneNum(phoneNum)
                .map(User::getUserName)
                .orElseThrow(() -> new IllegalArgumentException("해당 전화번호로 등록된 아이디가 없습니다."));
    }

    //비밀번호 변경 (로그인한 사용자가 내 정보에서 비밀번호 변경)
    public void changePasswordWithOldPassword(Long userId, String currentPassword, String newPassword,
                                              String newPasswordConfirm) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        // 현재 비밀번호 일치 확인
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new UserException(UserErrorCode.WRONG_CURRENT_PASSWORD);
        }

        // 새 비밀번호 확인
        if (!newPassword.equals(newPasswordConfirm)) {
            throw new UserException(UserErrorCode.PASSWORD_CONFIRM_NOT_MATCH);
        }

        user.setPassword(passwordEncoder.encode(newPassword));     
        user.setModifiedAt(LocalDateTime.now());
        userRepository.save(user);
        
        // 비밀번호 변경 로그 추가
        UserLog passwordChangeLog = UserLog.builder()
                .user(user)
                .logType(UserLog.LogType.PASSWORD_CHANGE)
                .description("비밀번호 변경")
                .ipAddress(getClientIp())
                .createdAt(LocalDateTime.now())
                .build();
        userLogRepository.save(passwordChangeLog);
    }

    //비밀번호 찾기 후 문자 인증이 완료된 경우 비밀번호 재설정
    public void resetPassword(PasswordResetRequestDTO request) {
        String verified = redisTemplate.opsForValue().get("verified:" + request.getEmail());
    if (!"true".equals(verified)) {
        throw new AuthException(AuthErrorCode.INVALID_VERIFICATION_CODE);
    }
        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new AuthException(AuthErrorCode.USER_NOT_FOUND));
        if (user.getSocialProvider() != null && !user.getSocialProvider().isEmpty()) {
            throw new AuthException(AuthErrorCode.SOCIAL_USER_CANNOT_CHANGE_PASSWORD);
        }
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setModifiedAt(LocalDateTime.now());
        userRepository.save(user);
        redisTemplate.delete("verified:" + request.getEmail());
    }

    // 클라이언트 IP 주소 가져오는 유틸리티 메서드 추가
    private String getClientIp() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attributes.getRequest();
            
            String forwardedHeader = request.getHeader("X-Forwarded-For");
            if (forwardedHeader != null && !forwardedHeader.isEmpty()) {
                return forwardedHeader.split(",")[0].trim();
            }
            
            return request.getRemoteAddr();
        } catch (Exception e) {
            return "unknown";
        }
    }

    // 아이디(이메일) 찾기
    public FindEmailResponse findEmail(FindEmailRequest request) {
        Optional<User> userOpt = userRepository.findByUserNameAndPhoneNum(
                request.getUserName(), request.getPhoneNum());
        if (userOpt.isEmpty()) {
            return null;
        }
        User user = userOpt.get();
        return FindEmailResponse.builder().email(user.getEmail()).build();
    }
}