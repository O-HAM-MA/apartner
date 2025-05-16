package com.ohammer.apartner.domain.user.service;


import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;
import com.ohammer.apartner.domain.apartment.repository.ApartmentRepository;
import com.ohammer.apartner.domain.apartment.repository.BuildingRepository;
import com.ohammer.apartner.domain.apartment.repository.UnitRepository;
import com.ohammer.apartner.domain.user.exception.UserErrorCode;
import com.ohammer.apartner.domain.user.exception.UserException;
import com.ohammer.apartner.domain.user.items.WithdrawResult;
import com.ohammer.apartner.domain.user.dto.UserRegistRequestDTO;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.UUID;


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

    @Transactional
    public User register(UserRegistRequestDTO dto, String socialProfileImageUrl) {
        // 소셜 로그인 여부 체크
        boolean isSocialLogin = dto.getSocialProvider() != null && !dto.getSocialProvider().isEmpty();
        
        // 일반 회원가입인 경우에만 이메일, 휴대폰 번호 중복 검증
        if (!isSocialLogin) {
            // 이메일 중복 확인
            if (userRepository.existsByEmail(dto.getEmail())) {
                throw new UserException(UserErrorCode.DUPLICATE_EMAIL);
            }
            
            // 휴대폰 번호 중복 확인 (DTO에 해당 필드가 있고, 필요하다면)
            if (dto.getPhoneNum() != null && userRepository.existsByPhoneNum(dto.getPhoneNum())) {
                throw new UserException(UserErrorCode.DUPLICATE_PHONE_NUMBER);
            }
        }
        // 카카오 로그인은 이메일을 필수로 받지 않으므로 이메일 중복 체크는 제외

        // 아파트, 동, 호 정보 조회 및 검증
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
                .userName(dto.getUserName()) // UserRegistRequestDTO에 getUserName() 가정
                .apartment(apartment)
                .building(building)
                .unit(unit)
                .gradeId(1L) // 기본값
                .status(Status.ACTIVE)
                .roles(new HashSet<>(Set.of(Role.USER)));

        String finalProfileImageUrl = null;

        // 소셜 로그인 처리
        if (isSocialLogin) {
            userBuilder.socialProvider(dto.getSocialProvider());
            userBuilder.socialId(dto.getSocialId()); // DTO에 socialId가 있다고 가정
            String randomPassword = UUID.randomUUID().toString();
            userBuilder.password(passwordEncoder.encode(randomPassword)); 
            finalProfileImageUrl = socialProfileImageUrl; // 컨트롤러에서 전달받은 소셜 프로필 URL 사용
        } else {
            // 일반 회원가입
            if (dto.getPassword() == null || dto.getPassword().isEmpty()) {
                throw new UserException(UserErrorCode.PASSWORD_NOT_PROVIDED); // 적절한 에러 코드 정의 필요
            }
            userBuilder.password(passwordEncoder.encode(dto.getPassword()));
            // 일반 가입 시 DTO에 profileImage 필드가 있다면 사용 (선택사항)
            // finalProfileImageUrl = dto.getProfileImage(); 
        }

        User newUser = userBuilder.build();
        User savedUser = userRepository.save(newUser);

        // 프로필 이미지 처리
        if (finalProfileImageUrl != null && !finalProfileImageUrl.isEmpty()) {
            authService.inputSocialProfileImage(savedUser, finalProfileImageUrl);
        }
        
        // 최종 사용자 정보 반환 (이미지 정보가 포함된)
        return userRepository.findById(savedUser.getId())
                             .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));
    }

    // 이메일 중복 확인 메서드 추가
    @Transactional(readOnly = true) // 읽기 전용 트랜잭션
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    // 휴대폰 번호 중복 확인 메서드 추가
    @Transactional(readOnly = true) // 읽기 전용 트랜잭션
    public boolean existsByPhoneNum(String phoneNum) {
        return userRepository.existsByPhoneNum(phoneNum);
    }

    //회원 탈퇴
    public WithdrawResult withdraw(Long userId, String rawPassword) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return WithdrawResult.USER_NOT_FOUND;
        }

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            return WithdrawResult.WRONG_PASSWORD;
        }

        user.setStatus(Status.INACTIVE);
        user.setModifiedAt(LocalDateTime.now());
        userRepository.save(user);
        return WithdrawResult.SUCCESS;
    }

    //로그아웃
    public void logout(String accessToken, Long userId) {
        // ✅ Access Token → 블랙리스트 등록
        try {
            long remainingTime = jwtTokenizer.getRemainingTime(accessToken);
            redisTemplate.opsForValue().set(accessToken, "logout", remainingTime, TimeUnit.MILLISECONDS);
        } catch (Exception e) {
            throw new UserException(UserErrorCode.ACCESS_TOKEN_BLACKLIST_FAIL);
        }

        // ✅ Refresh Token 삭제
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        try {
            user.setRefreshToken(null);
            userRepository.save(user);
        } catch (Exception e) {
            throw new UserException(UserErrorCode.REFRESH_TOKEN_DELETE_FAIL);
        }
    }
}