package com.ohammer.apartner.security.controller;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;
import com.ohammer.apartner.security.OAuth.CustomRequest;
import com.ohammer.apartner.security.dto.LoginRequestDto;
import com.ohammer.apartner.security.dto.LoginResponseDto;
import com.ohammer.apartner.security.dto.MeDto;
import com.ohammer.apartner.security.jwt.JwtTokenizer;
import com.ohammer.apartner.security.service.AuthService;
import com.ohammer.apartner.domain.user.service.UserRegistService;
import com.ohammer.apartner.domain.image.entity.Image;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpHeaders;

// import java.security.Principal; // Principal은 직접 사용하지 않으므로 주석 처리 또는 삭제 가능

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
            String buildingName = Optional.ofNullable(user.getBuilding())
                    .map(Building::getBuildingNumber) 
                    .orElse(null);
            String unitNumber = Optional.ofNullable(user.getUnit())
                    .map(Unit::getUnitNumber)
                    .orElse(null);

            // 7. MeDto 생성 (프론트엔드로 보낼 데이터 객체 - 아파트 정보 포함)
            MeDto meDto = new MeDto(
                    user.getId(),
                    user.getUserName(),
                    user.getCreatedAt(),
                    user.getModifiedAt(),
                    profileImageUrl,
                    apartmentName,
                    buildingName,
                    unitNumber
            );
            log.info("[/me] Successfully retrieved user info for userId: {}", userIdLong);

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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing request: " + e.getMessage());
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
                return ResponseEntity.status(401).body("비밀번호가 틀렸습니다.");
            }

            String accessToken = authService.genAccessToken(user);
            String refreshToken = authService.genRefreshToken(user);
            authService.addRefreshToken(user, refreshToken);

            LoginResponseDto loginResponseDto = new LoginResponseDto(accessToken, refreshToken, user.getId(), user.getUserName());

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
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) { // HttpServletRequest 추가
        // 1. Access Token 가져오기 (쿠키에서)
        String accessToken = customRequest.getCookieValue("accessToken");

        if (accessToken != null && !accessToken.isEmpty()) {
            try {
                // 2. Access Token에서 사용자 ID 추출
                Claims claims = jwtTokenizer.parseAccessToken(accessToken);
                Long userId = ((Number) claims.get("userId")).longValue();

                // 3. 토큰 무효화 (Redis 블랙리스트 및 DB Refresh Token 삭제)
                userRegistService.logout(accessToken, userId);
                log.info("[/logout] Token invalidated for userId: {}", userId);

            } catch (ExpiredJwtException eje) {
                log.warn("[/logout] AccessToken already expired during logout: {}", eje.getMessage());
            } catch (Exception e) {
                // 토큰 파싱 실패 또는 사용자 ID 추출 실패 등 예외 처리
                log.error("[/logout] Error processing token during logout: {}", e.getMessage());
                // 오류가 발생해도 쿠키 삭제 및 세션 무효화는 시도
            }
        } else {
            log.warn("[/logout] AccessToken cookie not found during logout attempt");
        }

        // 4. HTTP 세션 무효화
        HttpSession session = request.getSession(false); // false: 기존 세션 없으면 새로 만들지 않음
        if (session != null) {
            session.invalidate();
            log.info("[/logout] HTTP session invalidated");
        }

        // 5. 쿠키 삭제 (직접 ResponseCookie 생성 - 혹시 모르니 유지)
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

}
