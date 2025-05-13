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
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


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

    // 회원가입 로직
    @Transactional
    public void register(UserRegistRequestDTO dto) {
        // 아파트, 동, 호 정보 조회
        Apartment apartment = apartmentRepository.findById(dto.getApartmentId())
                .orElseThrow(() -> new UserException(UserErrorCode.APARTMENT_NOT_FOUND));
        
        Building building = buildingRepository.findById(dto.getBuildingId())
                .orElseThrow(() -> new UserException(UserErrorCode.BUILDING_NOT_FOUND));
        
        Unit unit = unitRepository.findById(dto.getUnitId())
                .orElseThrow(() -> new UserException(UserErrorCode.UNIT_NOT_FOUND));
        
        // 동이 해당 아파트의 것인지 확인
        if (!building.getApartment().getId().equals(apartment.getId())) {
            throw new UserException(UserErrorCode.BUILDING_NOT_MATCH_APARTMENT);
        }
        
        // 호가 해당 동의 것인지 확인
        if (!unit.getBuilding().getId().equals(building.getId())) {
            throw new UserException(UserErrorCode.UNIT_NOT_MATCH_BUILDING);
        }
        
        // 이메일, 전화번호 중복 확인
        if (userRepository.existsByEmail(dto.getEmail())) {
            throw new UserException(UserErrorCode.DUPLICATE_EMAIL);
        }
        
        if (userRepository.existsByPhoneNum(dto.getPhoneNum())) {
            throw new UserException(UserErrorCode.DUPLICATE_PHONE_NUMBER);
        }

        // User 엔티티 생성 및 저장
        User user = User.builder()
                .email(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword())) // 비밀번호 암호화
                .phoneNum(dto.getPhoneNum())
                .userName(dto.getName()) // 이름을 userName 필드에 저장
                .apartment(apartment)
                .building(building)
                .unit(unit)
                .gradeId(1L) // gradeId 기본값 1로 설정
                .status(Status.ACTIVE) // 기본 상태 설정
                .roles(new HashSet<>(Set.of(Role.USER)))
                .build();

        userRepository.save(user);
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