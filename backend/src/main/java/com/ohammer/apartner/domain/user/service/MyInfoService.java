package com.ohammer.apartner.domain.user.service;

// import com.ohammer.apartner.domain.apartment.exception.ApartmentErrorCode; // 주석 처리 또는 삭제
// import com.ohammer.apartner.domain.apartment.exception.ApartmentException; // 주석 처리 또는 삭제
import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;
import com.ohammer.apartner.domain.apartment.repository.ApartmentRepository;
import com.ohammer.apartner.domain.apartment.repository.BuildingRepository;
import com.ohammer.apartner.domain.apartment.repository.UnitRepository;
import com.ohammer.apartner.domain.user.dto.ResetPasswordRequest;
import com.ohammer.apartner.domain.user.exception.UserErrorCode;
import com.ohammer.apartner.domain.user.exception.UserException;
import com.ohammer.apartner.domain.user.dto.MyInfoResponseDto;
import com.ohammer.apartner.domain.user.dto.MyInfoUpdateRequestDto;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class MyInfoService {
    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final BuildingRepository buildingRepository;
    private final UnitRepository unitRepository;
    private final PasswordEncoder passwordEncoder; 

    public MyInfoResponseDto getMyInfo(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        String profileImageUrl = user.getProfileImage() != null ? user.getProfileImage().getFilePath() : null;
        String apartmentName = user.getApartment() != null ? user.getApartment().getName() : null;
        String buildingName = user.getBuilding() != null ? user.getBuilding().getBuildingNumber() : null;
        String unitNumber = user.getUnit() != null ? user.getUnit().getUnitNumber() : null;

        return MyInfoResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .userName(user.getUserName())
                .phoneNum(user.getPhoneNum())
                .profileImageUrl(profileImageUrl)
                .createdAt(user.getCreatedAt())
                .modifiedAt(user.getModifiedAt())
                .apartmentName(apartmentName)
                .buildingName(buildingName)
                .unitNumber(unitNumber)
                .socialProvider(user.getSocialProvider())
                .build();
    }

    //사용자 정보 수정
    @Transactional
    public void updateMyInfo(String userEmail, MyInfoUpdateRequestDto requestDto) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        if (requestDto.getUserName() != null && !requestDto.getUserName().isEmpty()) {
            user.setUserName(requestDto.getUserName());
        }

        if (requestDto.getEmail() != null && !requestDto.getEmail().isEmpty() && !requestDto.getEmail().equals(user.getEmail())) {
            log.warn("이메일 변경 요청됨: {} -> {}. 인증 절차 필요.", user.getEmail(), requestDto.getEmail());
        }
        
        if (requestDto.getPhoneNum() != null && !requestDto.getPhoneNum().isEmpty()) {
             log.warn("휴대폰 번호 변경 요청됨: {} -> {}. 인증 절차 필요.", user.getPhoneNum(), requestDto.getPhoneNum());
        }

        if (requestDto.getApartmentId() != null) {
            Apartment apartment = apartmentRepository.findById(requestDto.getApartmentId())
                    .orElseThrow(() -> new UserException(UserErrorCode.APARTMENT_NOT_FOUND)); 
            user.setApartment(apartment);
        }

        if (requestDto.getBuildingId() != null) {
            Building building = buildingRepository.findById(requestDto.getBuildingId())
                    .orElseThrow(() -> new UserException(UserErrorCode.BUILDING_NOT_FOUND)); 
            user.setBuilding(building);
        }

        if (requestDto.getUnitId() != null) {
            Unit unit = unitRepository.findById(requestDto.getUnitId())
                    .orElseThrow(() -> new UserException(UserErrorCode.UNIT_NOT_FOUND)); 
            user.setUnit(unit);
        }

        user.setModifiedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public void changePassword(String userEmail, ResetPasswordRequest request) {
        User user = userRepository.findByEmail(userEmail)
            .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        if (user.getPassword() == null && user.getSocialProvider() != null) {
            throw new UserException(UserErrorCode.SOCIAL_USER_CANNOT_CHANGE_PASSWORD);
        }
        if (user.getPassword() != null && !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new UserException(UserErrorCode.CURRENT_PASSWORD_NOT_MATCH);
        }
        if (user.getPassword() == null && request.getCurrentPassword() != null && !request.getCurrentPassword().isEmpty()) {
             throw new UserException(UserErrorCode.CURRENT_PASSWORD_NOT_MATCH); 
        }

        if (!request.getNewPassword().equals(request.getNewPasswordConfirm())) {
            throw new UserException(UserErrorCode.NEW_PASSWORDS_NOT_MATCH);
        }

        if (user.getPassword() != null && passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new UserException(UserErrorCode.CANNOT_USE_SAME_PASSWORD_AS_CURRENT);
        }


        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setModifiedAt(LocalDateTime.now());
        userRepository.save(user);
        log.info("사용자 [{}] 비밀번호 변경 완료", userEmail);
    }
}