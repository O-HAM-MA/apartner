package com.ohammer.apartner.domain.user.exception;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
@Schema(description = "사용자 관련 에러 코드")
public enum UserErrorCode {

    @Schema(description = "존재하지 않는 사용자")
    USER_NOT_FOUND("존재하지 않는 사용자", HttpStatus.NOT_FOUND),

    @Schema(description = "현재 비밀번호가 일치하지 않음")
    WRONG_CURRENT_PASSWORD("현재 비밀번호가 일치하지 않음", HttpStatus.UNAUTHORIZED),

    @Schema(description = "비밀번호 확인이 일치하지 않음")
    PASSWORD_CONFIRM_NOT_MATCH("비밀번호 확인이 일치하지 않음", HttpStatus.BAD_REQUEST),

    @Schema(description = "아이디를 이미 사용 중입니다.")
    USERNAME_DUPLICATE("아이디를 이미 사용 중입니다.", HttpStatus.CONFLICT),

    @Schema(description = "헨드폰번호를 이미 사용 중입니다.")
    PHONENUM_DUPLICATE("핸드폰번호를 이미 사용 중입니다.", HttpStatus.CONFLICT),

    @Schema(description = "이메일이 이미 사용 중입니다.")
    DUPLICATE_EMAIL("이메일이 이미 사용 중입니다.", HttpStatus.CONFLICT),

    @Schema(description = "휴대폰 번호가 이미 사용 중입니다.")
    DUPLICATE_PHONE_NUMBER("휴대폰 번호가 이미 사용 중입니다.", HttpStatus.CONFLICT),

    @Schema(description = "존재하지 않는 아파트입니다.")
    APARTMENT_NOT_FOUND("존재하지 않는 아파트입니다.", HttpStatus.NOT_FOUND),

    @Schema(description = "존재하지 않는 건물(동)입니다.")
    BUILDING_NOT_FOUND("존재하지 않는 건물(동)입니다.", HttpStatus.NOT_FOUND),

    @Schema(description = "존재하지 않는 호수입니다.")
    UNIT_NOT_FOUND("존재하지 않는 호수입니다.", HttpStatus.NOT_FOUND),

    @Schema(description = "선택한 건물(동)이 해당 아파트에 속하지 않습니다.")
    BUILDING_NOT_MATCH_APARTMENT("선택한 건물(동)이 해당 아파트에 속하지 않습니다.", HttpStatus.BAD_REQUEST),

    @Schema(description = "선택한 호수가 해당 건물(동)에 속하지 않습니다.")
    UNIT_NOT_MATCH_BUILDING("선택한 호수가 해당 건물(동)에 속하지 않습니다.", HttpStatus.BAD_REQUEST),

    @Schema(description = "Access Token 블랙리스트 등록 실패")
    ACCESS_TOKEN_BLACKLIST_FAIL("Access Token 블랙리스트 등록 실패", HttpStatus.INTERNAL_SERVER_ERROR),

    @Schema(description = "Refresh 토큰 삭제 실패")
    REFRESH_TOKEN_DELETE_FAIL("Refresh 토큰 삭제 중 오류 발생", HttpStatus.INTERNAL_SERVER_ERROR),

    @Schema(description = "ADMIN 접근 권한이 없습니다")
    FORBIDDEN("접근 권한이 없습니다.", HttpStatus.UNAUTHORIZED),

    @Schema(description = "비밀번호가 제공되지 않았습니다.")
    PASSWORD_NOT_PROVIDED("비밀번호가 제공되지 않았습니다.", HttpStatus.BAD_REQUEST),


    @Schema(description = "인증되지 않은 사용자")
    UNAUTHORIZED("로그인이 필요합니다.", HttpStatus.UNAUTHORIZED);






    private final String message;
    private final HttpStatus status;

    UserErrorCode(String message, HttpStatus status) {
        this.message = message;
        this.status = status;
    }
}
