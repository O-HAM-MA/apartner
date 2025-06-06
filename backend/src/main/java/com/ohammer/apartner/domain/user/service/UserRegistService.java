package com.ohammer.apartner.domain.user.service;


import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;
import com.ohammer.apartner.domain.apartment.repository.ApartmentRepository;
import com.ohammer.apartner.domain.apartment.repository.BuildingRepository;
import com.ohammer.apartner.domain.apartment.repository.UnitRepository;
import com.ohammer.apartner.domain.user.exception.UserErrorCode;
import com.ohammer.apartner.domain.user.exception.UserException;
import com.ohammer.apartner.domain.user.dto.UserRegistRequestDTO;
import com.ohammer.apartner.domain.user.dto.UserWithdrawRequestDto;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.security.jwt.JwtTokenizer;
import com.ohammer.apartner.security.service.AuthService;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;
import com.ohammer.apartner.domain.user.repository.UserLogRepository;
import com.ohammer.apartner.domain.user.entity.UserLog;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserRegistService {

    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final BuildingRepository buildingRepository;
    private final UnitRepository unitRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final JwtTokenizer jwtTokenizer;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;
    private final UserLogRepository userLogRepository;

    @Transactional
    public User register(UserRegistRequestDTO dto, String socialProfileImageUrl) {
        boolean isSocialLogin = dto.getSocialProvider() != null && !dto.getSocialProvider().isEmpty();
        
        if (!isSocialLogin) {
            if (userRepository.existsByEmail(dto.getEmail())) {
                throw new UserException(UserErrorCode.DUPLICATE_EMAIL);
            }
            
            if (dto.getPhoneNum() != null && userRepository.existsByPhoneNum(dto.getPhoneNum())) {
                throw new UserException(UserErrorCode.DUPLICATE_PHONE_NUMBER);
            }
        }

        Apartment apartment = apartmentRepository.findById(dto.getApartmentId())
                .orElseThrow(() -> new UserException(UserErrorCode.APARTMENT_NOT_FOUND));
        Building building = buildingRepository.findById(dto.getBuildingId())
                .orElseThrow(() -> new UserException(UserErrorCode.BUILDING_NOT_FOUND));
        Unit unit = unitRepository.findById(dto.getUnitId())
                .orElseThrow(() -> new UserException(UserErrorCode.UNIT_NOT_FOUND));

        if (!building.getApartment().getId().equals(apartment.getId())) {
            throw new UserException(UserErrorCode.BUILDING_NOT_MATCH_APARTMENT);
        }
        if (!unit.getBuilding().getId().equals(building.getId())) {
            throw new UserException(UserErrorCode.UNIT_NOT_MATCH_BUILDING);
        }

        User.UserBuilder userBuilder = User.builder()
                .email(dto.getEmail())
                .phoneNum(dto.getPhoneNum())
                .userName(dto.getUserName()) 
                .apartment(apartment)
                .building(building)
                .unit(unit)
                .gradeId(null) 
                .status(Status.ACTIVE)
                .roles(new HashSet<>(Set.of(Role.USER)));

        String finalProfileImageUrl = null;

        if (isSocialLogin) {
            userBuilder.socialProvider(dto.getSocialProvider());
            userBuilder.socialId(dto.getSocialId()); 
            String randomPassword = UUID.randomUUID().toString();
            userBuilder.password(passwordEncoder.encode(randomPassword)); 
            finalProfileImageUrl = socialProfileImageUrl; 
        } else {
            if (dto.getPassword() == null || dto.getPassword().isEmpty()) {
                throw new UserException(UserErrorCode.PASSWORD_NOT_PROVIDED); 
            }
            userBuilder.password(passwordEncoder.encode(dto.getPassword()));
        }

        User newUser = userBuilder.build();
        User savedUser = userRepository.save(newUser);

        if (finalProfileImageUrl != null && !finalProfileImageUrl.isEmpty()) {
            authService.inputSocialProfileImage(savedUser, finalProfileImageUrl);
        }
        
        return userRepository.findById(savedUser.getId())
                             .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
    }

    @Transactional(readOnly = true) 
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Transactional(readOnly = true) 
    public boolean existsByPhoneNum(String phoneNum) {
        return userRepository.existsByPhoneNum(phoneNum);
    }

    @Transactional
    public void withdraw(Long userId, UserWithdrawRequestDto requestDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == Status.WITHDRAWN) {
            throw new UserException(UserErrorCode.ALREADY_WITHDRAWN_USER);
        }

        // 소셜 로그인 사용자(카카오)인 경우 비밀번호 검증 건너뛰기
        boolean isSocialUser = requestDto.getIsSocialUser() != null && requestDto.getIsSocialUser() 
                && "kakao".equals(requestDto.getSocialProvider());
        boolean isSocialUserFromDB = "kakao".equals(user.getSocialProvider()) && user.getSocialId() != null;
        
        // 소셜 로그인 사용자가 아닌 경우에만 비밀번호 검증
        if (!isSocialUser && !isSocialUserFromDB) {
            // 비밀번호가 제공되지 않은 경우
            if (requestDto.getPassword() == null || requestDto.getPassword().isEmpty()) {
                throw new UserException(UserErrorCode.PASSWORD_REQUIRED);
            }
            
            // 비밀번호 검증
            if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
                throw new UserException(UserErrorCode.PASSWORD_NOT_MATCH);
            }
        }

        Status oldStatus = user.getStatus();
        user.setStatus(Status.WITHDRAWN);
        user.setLeaveReason(requestDto.getLeaveReason());
        user.setRefreshToken(null);
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);

        // 상태 변경 로그 추가
        String description = String.format("탈퇴 처리: %s -> %s", oldStatus, Status.WITHDRAWN);
        UserLog userLog = UserLog.builder()
            .user(user)
            .logType(UserLog.LogType.STATUS_CHANGE)
            .description(description)
            .ipAddress(getClientIp()) // 필요시 getClientIp()로 대체
            .createdAt(java.time.LocalDateTime.now())
            .build();
        // userLogRepository 주입 필요시 추가
        userLogRepository.save(userLog);

        SecurityContextHolder.clearContext();
    }

    public void logout(String accessToken, Long userId) {
        try {
            long remainingTime = jwtTokenizer.getRemainingTime(accessToken);
            redisTemplate.opsForValue().set(accessToken, "logout", remainingTime, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            throw new UserException(UserErrorCode.ACCESS_TOKEN_BLACKLIST_FAIL);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        try {
            user.setRefreshToken(null);
            userRepository.save(user);
        } catch (Exception e) {
            throw new UserException(UserErrorCode.REFRESH_TOKEN_DELETE_FAIL);
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