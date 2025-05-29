package com.ohammer.apartner.domain.user.controller;

import com.ohammer.apartner.domain.image.service.ProfileImageService;
import com.ohammer.apartner.domain.user.dto.ResetPasswordRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.ohammer.apartner.domain.user.service.MyInfoService;
import com.ohammer.apartner.domain.user.dto.MyInfoResponseDto;
import com.ohammer.apartner.domain.user.dto.MyInfoUpdateRequestDto;
import org.springframework.web.multipart.MultipartFile;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/myInfos")
@Tag(name = "My Info Controller", description = "사용자 프로필 정보 관리 API")
public class ApiV1MyInfoController {
    private final MyInfoService myInfoService;
    private final ProfileImageService profileImageService;

    @Operation(
            summary = "내 정보 조회",
            description = "사용자의 프로필 정보를 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "정보 조회 성공"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    @GetMapping
    public ResponseEntity<MyInfoResponseDto> getMyInfo(Authentication authentication) {
        String email = authentication.getName();

        MyInfoResponseDto dto = myInfoService.getMyInfo(email);
        return ResponseEntity.ok(dto);
    }

    @Operation(
            summary = "내 정보 수정",
            description = "사용자의 프로필 정보를 수정합니다. (이름, 주소, 전화번호 등. 이메일, 비밀번호 변경은 별도 API 사용)"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "정보 수정 성공", content = @io.swagger.v3.oas.annotations.media.Content(mediaType = "application/json")),
            @ApiResponse(responseCode = "400", description = "입력 값 오류"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    @PatchMapping("/update")
    public ResponseEntity<Map<String, String>> updateMyInfo(
            @Valid @RequestBody MyInfoUpdateRequestDto myInfoUpdateRequestDto, Authentication authentication
    ) {
        String userEmail = authentication.getName();

        myInfoService.updateMyInfo(userEmail, myInfoUpdateRequestDto);

        Map<String, String> response = new HashMap<>();
        response.put("message", "회원 정보가 성공적으로 수정되었습니다.");
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "비밀번호 변경",
            description = "사용자의 비밀번호를 변경합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "비밀번호 변경 성공"),
            @ApiResponse(responseCode = "400", description = "입력 값 오류 (비밀번호 정책 위반, 현재 비밀번호 불일치 등)"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ResetPasswordRequest resetPasswordRequest, Authentication authentication
    ) {
        String userEmail = authentication.getName();
        myInfoService.changePassword(userEmail, resetPasswordRequest);

        Map<String, String> response = new HashMap<>();
        response.put("message", "비밀번호가 성공적으로 변경되었습니다.");
        return ResponseEntity.ok(response);
    }

    @Operation(
            summary = "프로필 이미지 업데이트",
            description = "사용자의 프로필 이미지를 업로드합니다."
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "이미지 업로드 성공"),
            @ApiResponse(responseCode = "400", description = "업로드 실패"),
            @ApiResponse(responseCode = "401", description = "인증 실패 (로그인 필요)"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    @PostMapping(value = "/update-profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> updateProfileImage(
            @RequestParam("multipartFile") MultipartFile multipartFile,
            Authentication authentication) {

        String email = authentication.getName();
        String profileImageUrl = profileImageService.uploadProfileImage(email, multipartFile);

        Map<String, String> response = new HashMap<>();
        response.put("profileImageUrl", profileImageUrl);
        response.put("message", "프로필 이미지가 성공적으로 업로드되었습니다.");

        return ResponseEntity.ok(response);
    }
}