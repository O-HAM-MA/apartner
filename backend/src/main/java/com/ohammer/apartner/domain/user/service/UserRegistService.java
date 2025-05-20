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
                .gradeId(2L) 
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

        if (!passwordEncoder.matches(requestDto.getPassword(), user.getPassword())) {
            throw new UserException(UserErrorCode.PASSWORD_NOT_MATCH);
        }

        user.setStatus(Status.WITHDRAWN);
        user.setLeaveReason(requestDto.getLeaveReason());
        user.setRefreshToken(null);
        user.setModifiedAt(LocalDateTime.now());
        userRepository.save(user);

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
}