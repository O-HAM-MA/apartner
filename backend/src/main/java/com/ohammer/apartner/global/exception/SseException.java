// backend/src/main/java/com/ohammer/apartner/global/exception/SseException.java

package com.ohammer.apartner.global.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class SseException extends RuntimeException {
    public SseException(String message) {
        super(message);
    }
    
    public SseException(String message, Throwable cause) {
        super(message, cause);
    }
}