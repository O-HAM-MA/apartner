package com.ohammer.apartner.domain.auth.service;

import com.ohammer.apartner.domain.auth.dto.EmailCheckResponseDto;
import com.ohammer.apartner.domain.auth.dto.PhoneCheckResponseDto;
import com.ohammer.apartner.domain.auth.dto.VerificationCodeResponseDto;
import com.ohammer.apartner.domain.auth.dto.VerifyCodeResponseDto;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final RedisTemplate<String, String> redisTemplate;

    // 이메일 중복 체크
    public EmailCheckResponseDto checkEmail(String email) {
        boolean isAvailable = !userRepository.existsByEmail(email);
        
        return EmailCheckResponseDto.builder()
                .available(isAvailable)
                .message(isAvailable ? "사용 가능한 이메일입니다." : "이미 사용중인 이메일입니다.")
                .build();
    }
    
    // 휴대폰 번호 중복 체크
    public PhoneCheckResponseDto checkPhoneNumber(String phoneNumber) {
        boolean isAvailable = !userRepository.existsByPhoneNum(phoneNumber);
        
        return PhoneCheckResponseDto.builder()
                .available(isAvailable)
                .message(isAvailable ? "사용 가능한 휴대폰 번호입니다." : "이미 사용중인 휴대폰 번호입니다.")
                .build();
    }
    
    // 인증번호 발송
    public VerificationCodeResponseDto sendVerificationCode(String email) {
        // 인증번호 생성 (6자리 숫자)
        String code = generateRandomCode(6);
        
        // 인증번호 Redis에 저장 (5분 유효)
        redisTemplate.opsForValue().set("verification:" + email, code, 5, TimeUnit.MINUTES);
        
        // 이메일 발송
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("아파트너 <tt6311242@gmail.com>"); 
        message.setTo(email);
        message.setSubject("[아파트너] 회원가입 인증번호");
        message.setText("회원가입 인증번호: " + code + "\n\n인증번호는 5분간 유효합니다.");
        
        try {
            mailSender.send(message);
            return VerificationCodeResponseDto.builder()
                    .success(true)
                    .message("인증번호가 발송되었습니다. 이메일을 확인해주세요.")
                    .build();
        } catch (Exception e) {
            return VerificationCodeResponseDto.builder()
                    .success(false)
                    .message("인증번호 발송에 실패했습니다. 다시 시도해주세요.")
                    .build();
        }
    }
    
    // 인증번호 확인
    public VerifyCodeResponseDto verifyCode(String email, String code) {
        String storedCode = redisTemplate.opsForValue().get("verification:" + email);
        
        if (storedCode == null) {
            return VerifyCodeResponseDto.builder()
                    .verified(false)
                    .message("인증번호가 만료되었습니다. 다시 인증번호를 발송해주세요.")
                    .build();
        }
        
        if (storedCode.equals(code)) {
            // 인증 성공 시 Redis에서 해당 인증번호 삭제
            redisTemplate.delete("verification:" + email);
            
            // 인증 완료 상태 저장 (30분 유효)
            redisTemplate.opsForValue().set("verified:" + email, "true", 30, TimeUnit.MINUTES);
            
            return VerifyCodeResponseDto.builder()
                    .verified(true)
                    .message("인증이 완료되었습니다.")
                    .build();
        } else {
            return VerifyCodeResponseDto.builder()
                    .verified(false)
                    .message("인증번호가 일치하지 않습니다.")
                    .build();
        }
    }
    
    // 이메일 인증 여부 확인
    public boolean isEmailVerified(String email) {
        String verified = redisTemplate.opsForValue().get("verified:" + email);
        return "true".equals(verified);
    }
    
    // 랜덤 인증번호 생성 메서드
    private String generateRandomCode(int length) {
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(random.nextInt(10)); // 0-9 사이의 숫자
        }
        return sb.toString();
    }
} 