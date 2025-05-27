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
import com.ohammer.apartner.domain.user.entity.UserLog;
import com.ohammer.apartner.domain.user.repository.UserLogRepository;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;

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
    private final UserLogRepository userLogRepository;
    
    public MyInfoResponseDto getMyInfo(String email) {
        // 아파트, 빌딩, 유닛, 프로필 이미지 정보를 모두 함께 로드
        User user = userRepository.findByEmailWithFullInfo(email)
                .orElseThrow(() -> new UserException(UserErrorCode.USER_NOT_FOUND));

        String profileImageUrl = user.getProfileImage() != null ? user.getProfileImage().getFilePath() : null;
        
        // 연관 관계 엔티티들에 안전하게 접근
        String apartmentName = null;
        String zipcode = null;
        String address = null;
        if (user.getApartment() != null) {
            apartmentName = user.getApartment().getName();
            zipcode = user.getApartment().getZipcode();
            address = user.getApartment().getAddress();
        }
        
        String buildingName = null;
        if (user.getBuilding() != null) {
            buildingName = user.getBuilding().getBuildingNumber();
        }
        
        String unitNumber = null;
        if (user.getUnit() != null) {
            unitNumber = user.getUnit().getUnitNumber();
        }

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
                .zipcode(zipcode)
                .address(address)
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
             user.setPhoneNum(requestDto.getPhoneNum());
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

         // 비밀번호 변경 로그 추가
         UserLog passwordChangeLog = UserLog.builder()
         .user(user)
         .logType(UserLog.LogType.PASSWORD_CHANGE)
         .description("비밀번호 변경")
         .ipAddress(getClientIp())
         .createdAt(LocalDateTime.now())
         .build();
 userLogRepository.save(passwordChangeLog);
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