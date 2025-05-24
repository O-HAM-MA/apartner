package com.ohammer.apartner.domain.chat.exception;

/**
 * 채팅 관련 예외를 처리하기 위한 사용자 정의 예외 클래스
 */
public class ChatException extends RuntimeException {
    
    public ChatException(String message) {
        super(message);
    }
    
    public ChatException(String message, Throwable cause) {
        super(message, cause);
    }
} 