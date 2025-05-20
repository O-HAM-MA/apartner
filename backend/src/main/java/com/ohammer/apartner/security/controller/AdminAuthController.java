package com.ohammer.apartner.security.controller;

import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.domain.user.service.UserRegistService;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.security.OAuth.CustomRequest;
import com.ohammer.apartner.security.dto.AdminLoginRequest;
import com.ohammer.apartner.security.dto.AdminRegistrationRequest;
import com.ohammer.apartner.security.dto.LoginResponseDto;
import com.ohammer.apartner.security.dto.MeDto;
import com.ohammer.apartner.security.jwt.JwtTokenizer;
import com.ohammer.apartner.security.service.AuthService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import com.ohammer.apartner.security.dto.AdminDto;
import java.util.Optional;
import com.ohammer.apartner.domain.image.entity.Image;
import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Tag(name = "Admin Authentication", description = "관리자 인증 및 관리 API")
public class AdminAuthController {

    private final AuthService authService; 
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenizer jwtTokenizer;
    private final UserRepository userRepository;
    private final UserRegistService userRegistService;
    private final CustomRequest customRequest;

    @Operation(summary = "관리자 로그인", description = "관리자 아이디(이메일)와 비밀번호로 로그인하고 JWT 토큰을 발급받습니다.")
    @PostMapping("/login")
    public ResponseEntity<?> adminLogin(@RequestBody AdminLoginRequest loginRequest, HttpServletResponse httpServletResponse) {
        log.info("Admin login attempt for username/email: {}", loginRequest.getUsername());
        try {
            User adminUser = authService.findByEmail(loginRequest.getUsername());

            if (adminUser == null) {
                log.warn("Admin login failed: User not found with email/username: {}", loginRequest.getUsername());
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("존재하지 않는 관리자 계정입니다.");
            }

            if (!passwordEncoder.matches(loginRequest.getPassword(), adminUser.getPassword())) {
                log.warn("Admin login failed: Incorrect password for email/username: {}", loginRequest.getUsername());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("비밀번호가 틀렸습니다.");
            }

            if (!adminUser.getRoles().contains(Role.ADMIN)) {
                log.warn("Admin login failed: User {} does not have ADMIN role.", loginRequest.getUsername());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자 권한이 없는 계정입니다.");
            }
            
            switch (adminUser.getStatus()) {
                case ACTIVE:
                    break; 
                case INACTIVE:
                    log.warn("[AdminLogin] INACTIVE admin tried to login: {}, status: {}", adminUser.getEmail(), adminUser.getStatus());
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("비활성화된 관리자 계정입니다.");
                case PENDING:
                     log.warn("[AdminLogin] PENDING admin tried to login: {}, status: {}", adminUser.getEmail(), adminUser.getStatus());
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("정지된 관리자 계정입니다.");
                case WITHDRAWN:
                    log.warn("[AdminLogin] WITHDRAWN admin tried to login: {}, status: {}", adminUser.getEmail(), adminUser.getStatus());
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("탈퇴 처리된 관리자 계정입니다.");
                default:
                    log.warn("[AdminLogin] Unknown status admin tried to login: {}, status: {}", adminUser.getEmail(), adminUser.getStatus());
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("알 수 없는 계정 상태입니다.");
            }

            String accessToken = authService.genAccessToken(adminUser);
            String refreshToken = authService.genRefreshToken(adminUser);
            authService.addRefreshToken(adminUser, refreshToken);

            LoginResponseDto loginResponseDto = new LoginResponseDto(accessToken, refreshToken, adminUser.getId(), adminUser.getUserName());

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

            log.info("Admin login successful for username/email: {}", loginRequest.getUsername());
            
            return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(loginResponseDto);

        } catch (Exception e) {
            log.error("[AdminLogin] Unexpected error during admin login for {}: {}", loginRequest.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("관리자 로그인 중 오류가 발생했습니다.");
        }
    }

    @Operation(summary = "관리자 계정 등록", description = "새로운 관리자 계정을 등록합니다. (이메일, 사용자 이름, 비밀번호 필요)")
    @PostMapping("/register")
    public ResponseEntity<String> adminRegister(@RequestBody AdminRegistrationRequest registrationRequest) {
        log.info("Admin registration attempt for username: {}", registrationRequest.getUsername());
        try {
            if (authService.findByEmail(registrationRequest.getEmail()) != null) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("이미 사용 중인 이메일입니다.");
            }
            User newAdmin = User.builder()
                                .userName(registrationRequest.getUsername())
                                .email(registrationRequest.getEmail())
                                .password(passwordEncoder.encode(registrationRequest.getPassword()))
                                .roles(java.util.Set.of(Role.ADMIN))
                                .gradeId(2L)
                                .status(Status.ACTIVE)
                                .build();
            userRepository.save(newAdmin);

            log.info("Admin registered successfully: {}", registrationRequest.getEmail());
            return ResponseEntity.status(HttpStatus.CREATED).body("관리자 계정 '" + registrationRequest.getUsername() + "' 등록 성공.");
        } catch (Exception e) {
            log.error("[AdminRegister] Error during admin registration for {}: {}", registrationRequest.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("관리자 등록 중 오류 발생: " + e.getMessage());
        }
    }

    @Operation(summary = "관리자 상태 확인", description = "현재 인증된 관리자의 상태 또는 특정 정보를 확인합니다.")
    @GetMapping("/check")
    public ResponseEntity<?> adminCheck() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            log.warn("[AdminCheck] No authenticated admin user found.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("인증된 관리자 정보를 찾을 수 없습니다.");
        }
        
        String currentAdminUsername = authentication.getName();
        log.info("[AdminCheck] Admin check for: {}", currentAdminUsername);

        return ResponseEntity.ok("Authenticated admin: " + currentAdminUsername);
    }

    @Operation(summary = "관리자 로그아웃", description = "관리자 계정의 로그아웃을 처리하고 토큰을 무효화합니다.")
    @DeleteMapping("/logout")
    public ResponseEntity<?> adminLogout(HttpServletRequest request, HttpServletResponse response) {
        String accessToken = customRequest.getCookieValue("accessToken");

        if (accessToken != null && !accessToken.isEmpty()) {
            try {
                Claims claims = jwtTokenizer.parseAccessToken(accessToken);
                Long userId = ((Number) claims.get("userId")).longValue();

                userRegistService.logout(accessToken, userId);
                log.info("[AdminLogout] Token invalidated for userId: {}", userId);

            } catch (ExpiredJwtException eje) {
                log.warn("[AdminLogout] AccessToken already expired during logout: {}", eje.getMessage());
            } catch (Exception e) {
                log.error("[AdminLogout] Error processing token during logout: {}", e.getMessage());
            }
        } else {
            log.warn("[AdminLogout] AccessToken cookie not found during logout attempt");
        }

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
            log.info("[AdminLogout] HTTP session invalidated");
        }

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

        log.info("[AdminLogout] Logout process completed. Cookies cleared.");

        return ResponseEntity.ok("관리자 로그아웃 완료");
    }

    @Operation(summary = "관리자 정보 조회", description = "현재 로그인된 관리자의 프로필 정보를 조회합니다.")
    @GetMapping("/me")
    public ResponseEntity<?> me(HttpServletRequest request) {
        String cookie = null;
        Claims claims = null;
        Object userId = null;
        User adminUser = null;

        try {
            // 1. 쿠키에서 accessToken 가져오기
            cookie = customRequest.getCookieValue("accessToken");
            if (cookie == null) {
                log.warn("[AdminMe] AccessToken cookie not found");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("AccessToken cookie not found");
            }

            // 2. accessToken 파싱해서 claims 얻기
            claims = jwtTokenizer.parseAccessToken(cookie);

            // 3. claims에서 userId 추출하기
            userId = claims.get("userId");

            // 4. userId가 없으면 에러 발생
            if (userId == null) {
                log.error("[AdminMe] JWT does not contain userId claim");
                throw new IllegalStateException("JWT에 userId가 없습니다!");
            }

            long userIdLong = ((Number) userId).longValue();

            // 5. userId로 데이터베이스에서 User 정보 조회
            adminUser = authService.findById(userIdLong)
                    .orElseThrow(() -> {
                        log.warn("[AdminMe] User not found with id: {}", userIdLong);
                        return new IllegalStateException("사용자를 찾을 수 없습니다: " + userIdLong);
                    });

            // 6. 관리자 권한 확인
            if (!adminUser.getRoles().contains(Role.ADMIN)) {
                log.warn("[AdminMe] User {} does not have ADMIN role", adminUser.getUserName());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("관리자 권한이 없는 계정입니다.");
            }

              // 6. 관련 정보 추출 (Null-safe)
              String profileImageUrl = Optional.ofNullable(adminUser.getProfileImage())
              .map(Image::getFilePath)
              .orElse(null);
      String apartmentName = Optional.ofNullable(adminUser.getApartment())
              .map(Apartment::getName)
              .orElse(null);
      String buildingName = Optional.ofNullable(adminUser.getBuilding())
              .map(Building::getBuildingNumber) 
              .orElse(null);
      String unitNumber = Optional.ofNullable(adminUser.getUnit())
              .map(Unit::getUnitNumber)
              .orElse(null);

            // 7. 관리자 정보로 adminDto 생성 (아파트 관련 정보는 null일 수 있음)
            AdminDto adminDto = new AdminDto(
                    adminUser.getId(),
                    adminUser.getUserName(),
                    adminUser.getEmail(),
                    adminUser.getPhoneNum(),
                    adminUser.getCreatedAt(),
                    adminUser.getModifiedAt(),
                    profileImageUrl,
                    apartmentName,
                    buildingName,
                    unitNumber,
                    adminUser.getSocialProvider(),
                    adminUser.getRoles(),
                    adminUser.getGradeId()
            );
            log.info("[AdminMe] Successfully retrieved admin info for userId: {}", userIdLong);

            // 8. MeDto를 담아서 200 OK 응답 보내기
            return ResponseEntity.ok(adminDto);

        } catch (ExpiredJwtException eje) {
            log.warn("[AdminMe] AccessToken expired: {}", eje.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Token expired");
        } catch (IllegalStateException ise) {
            log.error("[AdminMe] Illegal state while processing request: {}", ise.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid request: " + ise.getMessage());
        } catch (Exception e) {
            log.error("[AdminMe] Error processing request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing request: " + e.getMessage());
        }
    }
} 