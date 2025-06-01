package com.ohammer.apartner.security.controller;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;
import com.ohammer.apartner.domain.apartment.service.ApartmentService;
import com.ohammer.apartner.domain.image.entity.Image;
import com.ohammer.apartner.domain.user.dto.PasswordResetRequestDTO;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.service.UserFindService;
import com.ohammer.apartner.domain.user.service.UserRegistService;
import com.ohammer.apartner.security.OAuth.CustomRequest;
import com.ohammer.apartner.security.dto.FindEmailRequest;
import com.ohammer.apartner.security.dto.FindEmailResponse;
import com.ohammer.apartner.security.dto.LoginRequestDto;
import com.ohammer.apartner.security.dto.LoginResponseDto;
import com.ohammer.apartner.security.dto.MeDto;
import com.ohammer.apartner.security.jwt.JwtTokenizer;
import com.ohammer.apartner.security.service.AuthService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
@Slf4j
public class ApiV1AuthController {
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;
    private final CustomRequest customRequest;
    private final JwtTokenizer jwtTokenizer;
    private final UserRegistService userRegistService; // UserRegistService 주입
    private final ApartmentService apartmentService;
    private final UserFindService userFindService;

    //테스트용이라서 배포 전에 삭제할꺼임
    @GetMapping("/home")
    public ResponseEntity<String> home() {
        return ResponseEntity.ok("여기는 집");
    }

    //me api
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        String cookie = null;
        Claims claims = null;
        Object userId = null;
        User user = null;

        try {
            // 1. 쿠키에서 accessToken 가져오기
            cookie = customRequest.getCookieValue("accessToken");
            if (cookie == null) {
                log.warn("[/me] AccessToken cookie not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("AccessToken cookie not found");
            }

            // 2. accessToken 파싱해서 claims 얻기
            claims = jwtTokenizer.parseAccessToken(cookie);

            // 3. claims에서 userId 추출하기
            userId = claims.get("userId");

            // 4. userId가 없으면 에러 발생
            if (userId == null) {
                log.error("[/me] JWT does not contain userId claim");
                throw new IllegalStateException("JWT에 userId가 없습니다!");
            }

            long userIdLong = ((Number) userId).longValue();

            // 5. userId로 데이터베이스에서 User 정보 조회
            user = authService.findById(userIdLong)
                    .orElseThrow(() -> {
                        log.warn("[/me] User not found with id: {}", userIdLong);
                        return new IllegalStateException("사용자를 찾을 수 없습니다: " + userIdLong);
                    });

            // 6. 관련 정보 추출 (Null-safe)
            String profileImageUrl = Optional.ofNullable(user.getProfileImage())
                    .map(Image::getFilePath)
                    .orElse(null);
            String apartmentName = Optional.ofNullable(user.getApartment())
                    .map(Apartment::getName)
                    .orElse(null);
            Long apartmentId = Optional.ofNullable(user.getApartment())
                    .map(Apartment::getId)
                    .orElse(null);
            String buildingName = Optional.ofNullable(user.getBuilding())
                    .map(Building::getBuildingNumber)
                    .orElse(null);
            String unitNumber = Optional.ofNullable(user.getUnit())
                    .map(Unit::getUnitNumber)
                    .orElse(null);
            String zipcode = Optional.ofNullable(user.getApartment())
                    .map(Apartment::getZipcode)
                    .orElse(null);
            String address = Optional.ofNullable(user.getApartment())
                    .map(Apartment::getAddress)
                    .orElse(null);

            // 7. MeDto 생성 (프론트엔드로 보낼 데이터 객체 - 아파트 정보 포함)
            MeDto meDto = new MeDto(
                    user.getId(),
                    user.getUserName(),
                    user.getEmail(),
                    user.getPhoneNum(),
                    user.getCreatedAt(),
                    user.getModifiedAt(),
                    profileImageUrl,
                    apartmentName,
                    apartmentId,
                    buildingName,
                    unitNumber,
                    user.getSocialProvider(),
                    zipcode,
                    address
            );
            log.info("[/me] Successfully retrieved user info for userId: {}", userIdLong);
            log.info("[/me] Successfully retrieved 너의 핸드폰번호 : {}", meDto.getPhoneNum());

            // 8. MeDto를 담아서 200 OK 응답 보내기
            return ResponseEntity.ok(meDto);

        } catch (ExpiredJwtException eje) {
            log.warn("[/me] AccessToken expired: {}", eje.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token expired");
        } catch (IllegalStateException ise) {
            log.error("[/me] Illegal state while processing request: {}", ise.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid request: " + ise.getMessage());
        } catch (Exception e) {
            log.error("[/me] Error processing request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing request: " + e.getMessage());
        }
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto req, HttpServletResponse httpServletResponse) {
        try {
            User user = authService.findByEmail(req.getEmail());

            if (user == null) {
                return ResponseEntity.status(404).body("존재하지 않는 이메일입니다.");
            }
            if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
                // 로그인 실패 로그 추가
                authService.logLoginFailure(user, getClientIp());

                return ResponseEntity.status(401).body("비밀번호가 틀렸습니다.");
            }

            // 사용자 상태 확인 - ACTIVE 상태가 아니면 로그인 불가, 상태별 메시지 처리
            switch (user.getStatus()) {
                case ACTIVE:
                    // 활성 상태이면 정상 진행
                    break;
                case INACTIVE:
                    log.warn("[/login] INACTIVE user tried to login: {}, status: {}", user.getEmail(),
                            user.getStatus());

                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("비활성화된 계정입니다. 관리자에게 문의하세요.");
                case PENDING:
                    log.warn("[/login] PENDING user tried to login: {}, status: {}", user.getEmail(), user.getStatus());

                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("계정이 정지되었습니다. 관리자에게 문의하세요.");
                case WITHDRAWN:
                    log.warn("[/login] WITHDRAWN user tried to login: {}, status: {}", user.getEmail(),
                            user.getStatus());

                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("이미 탈퇴한 계정입니다.");
                default:
                    log.warn("[/login] Unknown status user tried to login: {}, status: {}", user.getEmail(),
                            user.getStatus());

                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("계정 상태를 확인할 수 없습니다. 관리자에게 문의하세요.");
            }

            // 로그인 성공 시 lastLoginAt 필드를 now()로 업데이트
            user.setLastLoginAt(LocalDateTime.now());

            String accessToken = authService.genAccessToken(user);
            String refreshToken = authService.genRefreshToken(user);
            authService.addRefreshToken(user, refreshToken);

            authService.logLoginSuccess(user, getClientIp());

            LoginResponseDto loginResponseDto = new LoginResponseDto(accessToken, refreshToken, user.getId(),
                    user.getUserName());

            ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", accessToken)
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .maxAge(JwtTokenizer.ACCESS_TOKEN_EXPIRE_COUNT / 1000)
                    .sameSite("Lax")
                    .build();

            ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(false)
                    .path("/")
                    .maxAge(JwtTokenizer.REFRESH_TOKEN_EXPIRE_COUNT / 1000)
                    .sameSite("Lax")
                    .build();

            log.info("[/login] User logged in successfully: {}", user.getEmail());
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                    .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                    .body(loginResponseDto);

        } catch (Exception e) {
            log.error("[/login] Unexpected error during login for email {}: {}", req.getEmail(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
    }

    //로그아웃 만들어야지
    @DeleteMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        // 1. Access Token 가져오기 (쿠키에서)
        String accessToken = customRequest.getCookieValue("accessToken");
        String ipAddress = getClientIp();
        if (accessToken != null && !accessToken.isEmpty()) {
            authService.logout(accessToken, ipAddress);
        } else {
            log.warn("[/logout] AccessToken cookie not found during logout attempt");
        }
        // 2. HTTP 세션 무효화
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
            log.info("[/logout] HTTP session invalidated");
        }
        // 3. 쿠키 삭제
        ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", "")
                .path("/")
                .sameSite("Strict")
                .secure(true)
                .httpOnly(true)
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", accessTokenCookie.toString());
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", "")
                .path("/")
                .sameSite("Strict")
                .secure(true)
                .httpOnly(true)
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", refreshTokenCookie.toString());
        log.info("[/logout] Logout process completed. Cookies cleared.");
        return ResponseEntity.ok("로그아웃 완료");
    }


    @PostMapping("/find-email")
    public ResponseEntity<?> findEmail(@RequestBody FindEmailRequest request) {
        FindEmailResponse response = userFindService.findEmail(request);

        if (response == null) {
            return ResponseEntity.notFound().build(); // 404 응답
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody PasswordResetRequestDTO request,
                                           BindingResult bindingResult) {
        log.info("[/reset-password] Received password reset request for email: {}", request.getEmail());

        if (bindingResult.hasErrors()) {
            String errorMessage = bindingResult.getFieldErrors().stream()
                    .findFirst()
                    .map(error -> error.getDefaultMessage())
                    .orElse("입력값이 올바르지 않습니다.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorMessage);
        }

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
        }

        try {
            userFindService.resetPassword(request);
            return ResponseEntity.ok(Map.of("message", "비밀번호가 성공적으로 재설정되었습니다."));
        } catch (Exception e) {
            log.error("Password reset failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
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
            log.warn("Failed to get client IP: {}", e.getMessage());
            return "unknown";
        }
    }


}
