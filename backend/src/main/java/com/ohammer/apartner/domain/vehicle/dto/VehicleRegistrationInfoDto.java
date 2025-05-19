package com.ohammer.apartner.domain.vehicle.dto;



import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class VehicleRegistrationInfoDto {

    private Long id; // 신청번호
    private String registerType; // 등록 구분 (거주자/방문자)
    private String applicantName; // 신청자 이름 또는 택배, 손님 등
    private String apartmentName;
    private String buildingName; // 동
    private String unitName; // 호수
    private String vehicleNum; // 차량번호
    private String type; // 차종
    private String phone; // 연락처
    private LocalDateTime createdAt; // 신청일
    //private LocalDateTime visitPeriod; // 방문기간 (외부인일 경우만 사용)

    private String reason;     // 외부 차량 방문 사유
    private String userPhone;  // 연락처 (거주자는 user에서, 외부인은 직접 입력)

    private String status; // EntryRecord의 상태

    public static VehicleRegistrationInfoDto from(Vehicle vehicle, EntryRecord entryRecord) {
        boolean isForeign = Boolean.TRUE.equals(vehicle.getIsForeign());

        String registerType = isForeign ? "방문자" : "거주자";
        String applicantName;
        String apartment = null;
        String building = null;
        String unit = null;
        String phone;

        LocalDateTime visitPeriod = null; // 외부인 방문기간이 없다면 null

        User inviter = vehicle.getUser(); // 외부인은 여기에 “초청자(집주인)” 정보가 들어있음

        User user = vehicle.getUser(); // null일 수 있음

        if (isForeign) {
            applicantName = vehicle.getReason(); // 예: 택배, 배달, 손님
            phone = vehicle.getPhone();

            // **여기부터 추가**: “누구 집”에 방문했는지 보여주려면 inviter 정보로 세팅
            if (inviter != null) {
                Apartment apt = inviter.getApartment();
                apartment = apt != null ? apt.getName() : null;
                building  = inviter.getBuilding() != null
                        ? inviter.getBuilding().getBuildingNumber() : null;
                unit      = inviter.getUnit() != null
                        ? inviter.getUnit().getUnitNumber() : null;
            }
        } else {

            // 거주자: user → applicantName, phone, apt/동/호수 채우기
            applicantName  = inviter != null && inviter.getUserName() != null
                    ? inviter.getUserName() : "탈퇴한 사용자";
            phone          = inviter != null ? inviter.getPhoneNum() : null;
            if (inviter != null) {
                Apartment apt = inviter.getApartment();
                apartment = apt != null ? apt.getName() : null;
                building  = inviter.getBuilding() != null
                        ? inviter.getBuilding().getBuildingNumber() : null;
                unit = inviter.getUnit() != null
                        ? inviter.getUnit().getUnitNumber() : null;


//            applicantName = (user != null && user.getUserName() != null)
//                    ? user.getUserName()
//                    : "탈퇴한 사용자";
//            phone = (user != null)
//                    ? user.getPhoneNum()
//                    : null;
//            if (user != null) {
//                apartment = user.getApartment() != null
//                        ? user.getApartment().getName()
//                        : null;
//                building = user.getBuilding() != null
//                        ? user.getBuilding().getBuildingNumber()
//                        : null;
//                unit = user.getUnit() != null
//                        ? user.getUnit().getUnitNumber()
//                        : null;

//            User user = vehicle.getUser();
//            applicantName = user != null ? user.getUserName() : "탈퇴한 사용자";
//            building = user != null && user.getBuilding() != null ? user.getBuilding().getBuildingNumber() : null;
//            unit = user != null && user.getUnit() != null ? user.getUnit().getUnitNumber() : null;
//            phone = user != null ? user.getPhoneNum() : null;
//            // 여기에 apartmentName 세팅
//            Apartment apt = user != null ? user.getApartment() : null;  // 혹은 vehicle.getApartment()
//            apartment = apt != null ? apt.getName() : null;


//            applicantName = String.valueOf(user.getId()); // 혹은 .toString()
//            building = user.getBuilding().getBuildingNumber();
//            unit = user.getUnit().getUnitNumber();
//            phone = user.getPhoneNum();
            }
        }

        return VehicleRegistrationInfoDto.builder()
                .id(vehicle.getId())
                .registerType(registerType)
                .applicantName(applicantName)
                .apartmentName(apartment)
                .buildingName(building)
                .unitName(unit)
                .vehicleNum(vehicle.getVehicleNum())
                .type(vehicle.getType())
                .phone(phone)
                .createdAt(vehicle.getCreatedAt())
                //.visitPeriod(vehicle.getVisitPeriod()) // visitPeriod 필드 Vehicle 엔티티에 있어야 함
                //.visitPeriod(visitPeriod)
                .reason(isForeign ? vehicle.getReason() : null)
                //.userPhone(!isForeign ? phone : null)
                .userPhone(phone) // ✅ 무조건 phone을 넣자
                .status(entryRecord.getStatus() != null ? entryRecord.getStatus().name() : null) // ✅ 이 부분
                .build();
    }
}
