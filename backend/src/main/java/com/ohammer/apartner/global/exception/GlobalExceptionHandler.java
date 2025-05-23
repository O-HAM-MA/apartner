package com.ohammer.apartner.global.exception;

import com.ohammer.apartner.domain.image.exception.ProfileImageException;
import com.ohammer.apartner.domain.user.exception.UserException;
import com.ohammer.apartner.global.dto.ApiResponse;
import jakarta.persistence.EntityNotFoundException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.dao.DataIntegrityViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // @ExceptionHandler(MyInfoException.class)
    // public ResponseEntity<ErrorResponse> handleMyInfoException(MyInfoException e) {
    //     return ResponseEntity
    //             .badRequest()
    //             .body(new ErrorResponse(e.getErrorCode().getMessage()));
    // }

    @ExceptionHandler(ProfileImageException.class)
    public ResponseEntity<ErrorResponse> handleProfileImageException(ProfileImageException e) {
        return ResponseEntity
                .badRequest()
                .body(new ErrorResponse(e.getErrorCode().getMessage()));
    }

    @ExceptionHandler(UserException.class)
    public ResponseEntity<ErrorResponse> handleUserException(UserException e) {
        return ResponseEntity
                .badRequest()
                .body(new ErrorResponse(e.getErrorCode().getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        List<String> errorMessages = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(fieldError -> String.format("[%s] %s", fieldError.getField(), fieldError.getDefaultMessage()))
                .toList();

        Map<String, Object> responseBody = new HashMap<>();
        responseBody.put("message", "입력값이 올바르지 않습니다.");
        responseBody.put("errors", errorMessages);

        return ResponseEntity.badRequest().body(responseBody);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity
                .badRequest()
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }

    public record ErrorResponse(String message) {
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(HttpStatus.NOT_FOUND, e.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(HttpStatus.FORBIDDEN, "접근이 거부되었습니다."));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFoundException(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(HttpStatus.NOT_FOUND, ex.getMessage()));
    }

    @ExceptionHandler(ForbiddenAccessException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbiddenAccessException(ForbiddenAccessException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error(HttpStatus.FORBIDDEN, ex.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadRequestException(BadRequestException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }
    
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        String message = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
        
        // 외래 키 제약 조건 위반 처리
        if (message.contains("foreign key constraint") && message.contains("grade_menu_access")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(HttpStatus.CONFLICT, 
                            "이 메뉴는 하나 이상의 등급에서 사용 중입니다. 삭제하기 전에 모든 등급에서 이 메뉴를 선택 해제해주세요."));
        }
        
        // 중복 키 위반 처리
        if (message.contains("duplicate") || message.contains("unique constraint")) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.error(HttpStatus.CONFLICT, "이미 존재하는 데이터입니다."));
        }
        
        // 기타 데이터 무결성 위반
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(HttpStatus.CONFLICT, "데이터 무결성 제약 조건 위반이 발생했습니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(HttpStatus.INTERNAL_SERVER_ERROR, "서버 내부 오류가 발생했습니다."));
    }
}