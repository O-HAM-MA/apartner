package com.ohammer.apartner.security.exception;

public enum AuthErrorCode {
    // 기존 에러 코드들
    LOGIN_FAILED("로그인에 실패했습니다."),
    INVALID_TOKEN("유효하지 않은 토큰입니다."),
    EXPIRED_TOKEN("만료된 토큰입니다."),
    EMAIL_ALREADY_EXISTS("이미 등록된 이메일입니다."),
    
    // 비밀번호 재설정 관련 에러 코드 추가
    INVALID_VERIFICATION_CODE("인증번호가 유효하지 않습니다."),
    USER_NOT_FOUND("사용자를 찾을 수 없습니다."),
    SOCIAL_USER_CANNOT_CHANGE_PASSWORD("소셜 로그인 사용자는 비밀번호를 변경할 수 없습니다.");
    
    private final String message;
    
    AuthErrorCode(String message) {
        this.message = message;
    }
    
    public String getMessage() {
        return message;
    }
} 