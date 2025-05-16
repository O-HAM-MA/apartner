package com.ohammer.apartner.domain.user.controller;

import com.ohammer.apartner.domain.auth.service.EmailService;
import com.ohammer.apartner.domain.user.exception.UserException;
import com.ohammer.apartner.domain.user.items.WithdrawResult;
import com.ohammer.apartner.domain.user.dto.DeleteUserRequestDto;
import com.ohammer.apartner.domain.user.dto.UserRegistRequestDTO;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.domain.user.service.UserRegistService;
import com.ohammer.apartner.security.CustomUserDetails;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;
import com.ohammer.apartner.domain.image.entity.Image;
import com.ohammer.apartner.domain.apartment.service.ApartmentService;
import com.ohammer.apartner.security.OAuth.CustomRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

import com.ohammer.apartner.security.service.AuthService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
@Tag(name = "회원가입 API", description = "회원가입, 탈퇴, 로그아웃 API")
@Slf4j
public class ApiV1RegistController {
    private final UserRegistService userRegistService;
    private final AuthService authService;
    private final ApartmentService apartmentService;
    private final PasswordEncoder passwordEncoder;
    private final CustomRequest customRequest;

    @PostMapping("/userreg")
    public ResponseEntity<?> register(@Valid @RequestBody UserRegistRequestDTO registerDto, BindingResult bindingResult, HttpServletRequest request) {
        log.info("[/userreg] Received registration request for email: {}", registerDto.getEmail());

        try {
            boolean isSocialLogin = registerDto.getSocialProvider() != null && !registerDto.getSocialProvider().isEmpty();
            
            if (bindingResult.hasErrors()) {
                if (!isSocialLogin) {
                    if (registerDto.getPassword() == null || registerDto.getPassword().isEmpty()) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("비밀번호는 필수 입력값입니다.");
                    }
                    if (registerDto.getPhoneNum() == null || registerDto.getPhoneNum().isEmpty()) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("휴대폰 번호는 필수 입력값입니다.");
                    }
                }
                
                String errorMessage = bindingResult.getFieldErrors().stream()
                    .map(error -> error.getDefaultMessage())
                    .collect(Collectors.joining(", "));
                
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessage);
            }
            
            try {
                User existingUser = authService.findByEmail(registerDto.getEmail());
                if (existingUser != null) {
                    log.warn("이메일 이미 존재: {}", registerDto.getEmail());
                    return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 등록된 이메일입니다.");
                }
            } catch (org.springframework.security.core.userdetails.UsernameNotFoundException e) {
                log.info("이메일 없음, 가입 가능: {}", registerDto.getEmail());
            } catch (Exception e) {
                log.error("이메일 확인 중 오류: {}", e.getMessage(), e);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("이메일 확인 중 오류가 발생했습니다.");
            }
            
            if (registerDto.getApartmentId() == null || registerDto.getBuildingId() == null || registerDto.getUnitId() == null) {
                 log.warn("아파트, 동, 호수 정보 누락: {}", registerDto.getEmail());
                 return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("아파트, 동, 호수 정보가 누락되었습니다.");
            }

            String profileImageUrlFromSession = null;
            String sessionSocialId = null;


            if ("kakao".equals(registerDto.getSocialProvider())) {
                log.info("카카오 소셜 가입 처리 중: {}", registerDto.getEmail());
                HttpSession session = request.getSession(false);
                if (session != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> kakaoUserInfo = (Map<String, Object>) session.getAttribute("kakaoUserInfo");
                    if (kakaoUserInfo != null) {
                        sessionSocialId = (String) kakaoUserInfo.get("socialId");
                        profileImageUrlFromSession = (String) kakaoUserInfo.get("profileImage");
                        
                        if (sessionSocialId != null && !sessionSocialId.isEmpty()) {
                            registerDto.setSocialId(sessionSocialId); 
                            log.info("세션에서 socialId 사용: {} 를 DTO에 설정", sessionSocialId);
                        } else {
                            log.error("카카오 회원가입 실패: 세션에 socialId가 없습니다");
                            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body("카카오 계정 정보가 유효하지 않습니다. 다시 로그인해 주세요.");
                        }
                    } else {
                        log.error("카카오 회원가입 실패: 세션에 kakaoUserInfo가 없습니다");
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("카카오 계정 정보가 유효하지 않습니다. 다시 로그인해 주세요.");
                    }
                } else {
                    log.error("카카오 회원가입 실패: 세션이 없습니다");
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("카카오 계정 정보가 유효하지 않습니다. 다시 로그인해 주세요.");
                }
            } else {
                if (registerDto.getPassword() == null || registerDto.getPassword().isEmpty()) {
                    log.warn("비밀번호 필요: {}", registerDto.getEmail());
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("비밀번호를 입력해주세요.");
                }
            }

            User savedUser = userRegistService.register(registerDto, profileImageUrlFromSession);
            log.info("가입 성공: userId={}, email={}", savedUser.getId(), savedUser.getEmail());

            customRequest.makeAuthCookies(savedUser);
            log.info("인증 쿠키 생성: {}", savedUser.getEmail());

            if ("kakao".equals(registerDto.getSocialProvider())) {
                HttpSession session = request.getSession(false);
                if (session != null) {
                    session.removeAttribute("kakaoUserInfo");
                    log.info("카카오 회원가입 완료: 세션에서 kakaoUserInfo 삭제");
                }
            }

            Map<String, Object> responseBody = Map.of(
                "message", "회원가입이 성공적으로 완료되었습니다.",
                "userId", savedUser.getId()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(responseBody);

        } catch (UserException e) {
            log.warn("가입 중 예외: {}", e.getMessage());
            HttpStatus status = HttpStatus.BAD_REQUEST; 
            if (e.getErrorCode() != null && e.getErrorCode().getStatus() != null) {
                status = e.getErrorCode().getStatus();
            }
            return ResponseEntity.status(status).body(e.getMessage());
        } catch (Exception e) {
            log.error("가입 중 예외: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("회원가입 처리 중 오류가 발생했습니다.");
        }
    }
    
    private String generateSecurePassword() {
        return java.util.UUID.randomUUID().toString();
    }

    @Operation(summary = "이메일 중복 확인", description = "이메일의 중복 여부를 확인합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "사용 가능"),
            @ApiResponse(responseCode = "409", description = "중복됨")
    })
    @GetMapping("/check-email") 
    public ResponseEntity<Boolean> checkEmail(@RequestParam(name = "email") String email) { 
        return ResponseEntity.ok(!userRegistService.existsByEmail(email)); 
    }

    @Operation(summary = "휴대폰 번호 중복 확인", description = "휴대폰 번호 중복 여부를 확인합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "사용 가능"),
            @ApiResponse(responseCode = "409", description = "중복됨")
    })
    @GetMapping("/check-phonenum")
    public ResponseEntity<Boolean> checkPhoneNum(@RequestParam(name = "phoneNum") String phoneNum) {
        return ResponseEntity.ok(!userRegistService.existsByPhoneNum(phoneNum));
    } 


    @Operation(summary = "회원 탈퇴", description = "비밀번호 확인 후 회원 비활성화 처리")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "회원 탈퇴 성공"),
            @ApiResponse(responseCode = "401", description = "비밀번호 불일치"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    @DeleteMapping("/withdraw")
    public ResponseEntity<String> withdrawUser(@RequestBody DeleteUserRequestDto dto,
                                               @AuthenticationPrincipal CustomUserDetails principal) {
        Long userId = principal.getUser().getId();
        WithdrawResult result = userRegistService.withdraw(userId, dto.getPassword());

        return switch (result) {
            case SUCCESS -> ResponseEntity.ok("회원 탈퇴 완료");
            case USER_NOT_FOUND -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("존재하지 않는 사용자입니다");
            case WRONG_PASSWORD -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("비밀번호가 일치하지 않습니다");
        };
    }

    @Operation(summary = "로그아웃", description = "Token 제거합니다.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "로그아웃 성공"),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@AuthenticationPrincipal CustomUserDetails principal,
                                         @RequestHeader("Authorization") String bearerToken,
                                     HttpServletRequest request) {
        String token = bearerToken.replace("Bearer ", "");
        Long userId = principal.getUser().getId();

        userRegistService.logout(token, userId);

        HttpSession session = request.getSession(false); 
        if (session != null) {
            session.invalidate(); 
            log.info("[/logout] Session invalidated for userId: {}", userId);
        }

        return ResponseEntity.ok("로그아웃 완료");
    }
}