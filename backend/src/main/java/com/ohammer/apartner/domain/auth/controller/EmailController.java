package com.ohammer.apartner.domain.auth.controller;

import com.ohammer.apartner.domain.auth.dto.EmailCheckRequestDto;
import com.ohammer.apartner.domain.auth.dto.EmailCheckResponseDto;
import com.ohammer.apartner.domain.auth.dto.PhoneCheckRequestDto;
import com.ohammer.apartner.domain.auth.dto.PhoneCheckResponseDto;
import com.ohammer.apartner.domain.auth.dto.VerificationCodeRequestDto;
import com.ohammer.apartner.domain.auth.dto.VerificationCodeResponseDto;
import com.ohammer.apartner.domain.auth.dto.VerifyCodeRequestDto;
import com.ohammer.apartner.domain.auth.dto.VerifyCodeResponseDto;
import com.ohammer.apartner.domain.auth.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
@Tag(name = "인증 API", description = "이메일 인증, 휴대폰 인증 API")
public class EmailController {

    private final EmailService emailService;

    @Operation(summary = "이메일 중복 확인", description = "이메일 주소의 중복 여부를 확인합니다.")
    @PostMapping("/check-email")
    public ResponseEntity<EmailCheckResponseDto> checkEmail(@Valid @RequestBody EmailCheckRequestDto request) {
        EmailCheckResponseDto response = emailService.checkEmail(request.getEmail());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "휴대폰 번호 중복 확인", description = "휴대폰 번호의 중복 여부를 확인합니다.")
    @PostMapping("/check-phone")
    public ResponseEntity<PhoneCheckResponseDto> checkPhone(@Valid @RequestBody PhoneCheckRequestDto request) {
        PhoneCheckResponseDto response = emailService.checkPhoneNumber(request.getPhoneNumber());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "인증번호 발송", description = "이메일로 인증번호를 발송합니다.")
    @PostMapping("/send-verification-code")
    public ResponseEntity<VerificationCodeResponseDto> sendVerificationCode(@Valid @RequestBody VerificationCodeRequestDto request) {
        VerificationCodeResponseDto response = emailService.sendVerificationCode(request.getEmail());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "인증번호 확인", description = "발송된 인증번호를 확인합니다.")
    @PostMapping("/verify-code")
    public ResponseEntity<VerifyCodeResponseDto> verifyCode(@Valid @RequestBody VerifyCodeRequestDto request) {
        VerifyCodeResponseDto response = emailService.verifyCode(request.getEmail(), request.getCode());
        if (response.isVerified()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
} 