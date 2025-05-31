package com.ohammer.apartner.domain.vehicle.service;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.domain.vehicle.dto.*;
import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.entity.ParkingProperties;
import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
//import jakarta.transaction.Transactional;
import com.ohammer.apartner.domain.vehicle.repository.EntryRecordRepository;
import com.ohammer.apartner.domain.vehicle.repository.VehicleRepository;
import com.ohammer.apartner.security.utils.SecurityUtil;

import com.ohammer.apartner.security.utils.checkRoleUtils;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final EntryRecordRepository entryRecordRepository;
    //private static final int MAX_CAPACITY = 30; // 총 주차 가능 수
    private final ParkingProperties parkingProperties;
    // 최근에 입력한 maxCapacity를 저장할 필드
    private Integer currentMaxCapacity = null;

    // 입주민 차량 등록
    @Transactional
    public VehicleResponseDto registerResidentVehicle(ResidentVehicleRequestDto dto) {


//        User user = userRepository.findById(dto.getUserId())
//                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        // 1) SecurityUtil로 현재 로그인한 User 엔티티를 바로 꺼낸다.


        User currentUser = SecurityUtil.getCurrentUser();
        if (currentUser == null) {
            throw new IllegalStateException("로그인된 사용자가 아닙니다.");
        }

        // 여기서 UserRepository에서 연관관계까지 같이 조회
        User user = userRepository.findByIdWithBuildingAndUnit(currentUser.getId())
                .orElseThrow(() -> new IllegalStateException("존재하지 않는 사용자입니다."));
        Vehicle vehicle = Vehicle.builder()
                .user(user)
                .vehicleNum(dto.getVehicleNum())
                .type(dto.getType())
                .isForeign(false)
                .phone(user.getPhoneNum())
                .status(Vehicle.Status.INACTIVE)
                .build();

        vehicleRepository.save(vehicle);

        // EntryRecord 생성
        EntryRecord entryRecord = EntryRecord.builder()
                .vehicle(vehicle)
                .status(EntryRecord.Status.AGREE)
                .build();



        entryRecordRepository.save(entryRecord);



        return VehicleResponseDto.from(vehicle);
    }

    // 외부 차량 등록
    @Transactional
    public VehicleResponseDto registerForeignVehicle(ForeignVehicleRequestDto dto) {

//        long activeCount = vehicleRepository.countByStatus(Vehicle.Status.ACTIVE);
//
//        if (activeCount >= 17) {
//            throw new IllegalStateException("주차장이 꽉 찼습니다.");
//        }


        // ✅ 1. 동/호수로 입주민(User) 조회
        User inviter = userRepository.findByAptAndBuildingAndUnit(
                dto.getApartmentName(), dto.getBuildingNum(), dto.getUnitNum()
        ).orElseThrow(() -> new NoSuchElementException("해당 동/호수의 입주민이 존재하지 않습니다."));

        Vehicle vehicle = Vehicle.builder()
                .vehicleNum(dto.getVehicleNum())
                .type(dto.getType())
                .isForeign(true)
                .status(Vehicle.Status.INACTIVE)
                .phone(dto.getPhone())
                .reason(dto.getReason())
                .user(inviter)
                .build();

        vehicleRepository.save(vehicle);

        // EntryRecord 생성
        EntryRecord entryRecord = EntryRecord.builder()
                .vehicle(vehicle)
                .status(EntryRecord.Status.PENDING)
                .build();



        entryRecordRepository.save(entryRecord);


        return VehicleResponseDto.fromForeign(vehicle, dto.getPhone());
    }



    public List<VehicleResponseDto> getResidentVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findByIsForeignFalse();

        return vehicles.stream()
                .map(VehicleResponseDto::from)
                .collect(Collectors.toList());
    }

    public List<VehicleResponseDto> getForeignVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findByIsForeignTrue();

        return vehicles.stream()
                .map(v -> VehicleResponseDto.fromForeign(v, v.getUser() != null ? v.getUser().getPhoneNum() : v.getPhone()))
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public List<VehicleRegistrationInfoDto> getVehicleRegistrationInfo(Boolean isForeign) {


        checkRoleUtils.validateAdminAccess();

        List<EntryRecord> entryRecords;

        if (isForeign == null) {
            entryRecords = entryRecordRepository.findAllWithVehicleAndUser();
        } else {
            entryRecords = entryRecordRepository.findByVehicleIsForeignWithVehicleAndUser(isForeign);
        }

        return entryRecords.stream()
                .map(er -> VehicleRegistrationInfoDto.from(er.getVehicle(), er))
                .collect(Collectors.toList());
    }



    @Transactional
    public void updateVehicle(Long vehicleId, VehicleUpdateRequestDto dto) {
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("차량을 찾을 수 없습니다."));

        // 2) 소유자 확인
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (!vehicle.getUser().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("본인의 차량만 수정할 수 있습니다.");
        }

        vehicle.setVehicleNum(dto.getVehicleNum());
        vehicle.setType(dto.getType());
    }

    @Transactional
    public void deleteVehicle(Long vehicleId) {
        // 차량을 찾을 수 없으면 예외 발생
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new RuntimeException("차량을 찾을 수 없습니다."));

        // 소유자 확인
        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (!vehicle.getUser().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("본인의 차량만 삭제할 수 있습니다.");
        }

        // 차량 삭제
        entryRecordRepository.deleteAllByVehicle(vehicle);
        vehicleRepository.delete(vehicle);
    }


    @Transactional(readOnly = true)
    public List<VehicleRegistrationInfoDto> getApprovedVehicles() {
        List<EntryRecord> approvedRecords = entryRecordRepository.findByStatus(EntryRecord.Status.AGREE);

        return approvedRecords.stream()
                .map(record -> VehicleRegistrationInfoDto.from(record.getVehicle(), record))
                .collect(Collectors.toList());
    }

    public Vehicle findById(Long vehicleId) {
        return vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new IllegalArgumentException("해당 차량이 존재하지 않습니다."));
    }


    public Vehicle save(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    public Vehicle findByCurrentUser() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) throw new IllegalStateException("로그인 정보가 없습니다.");
//        return vehicleRepository.findByUser_Id(userId)
//                .orElseThrow(() -> new IllegalArgumentException("등록된 차량이 없습니다."));

        List<Vehicle> vehicles = vehicleRepository.findAllByUser_Id(userId);
        if (vehicles.isEmpty()) {
            throw new IllegalArgumentException("등록된 차량이 없습니다.");
        }

        if (vehicles.size() == 1) {
            // 여전히 1대뿐이면 기존 로직과 동일
            return vehicles.get(0);
        }

        // 2대 이상 등록된 경우: “기본” 차량을 골라주는 전략
        // (예: 가장 최근에 등록된 차량을 기본으로)
        return vehicles.stream()
                .max(Comparator.comparing(Vehicle::getCreatedAt))
                .get();


    }

    /** 입주민용: 본인에게 온 외부인 요청 조회 */
    @Transactional(readOnly = true)
    public List<VehicleRegistrationInfoDto> getMyVisitorRequests(Long inviterId) {
        // 엔티티: Vehicle.user.id = inviterId && isForeign=true && status=PENDING
        List<Vehicle> list = vehicleRepository.findForeignVehiclesWithPendingEntryRecordByInviterId(
                inviterId, EntryRecord.Status.PENDING
        );


        // DTO 변환
        return list.stream()
                .map(v -> VehicleRegistrationInfoDto.from(v, /*dummy EntryRecord*/ EntryRecord.builder()
                        .status(EntryRecord.Status.PENDING).build()
                ))
                .collect(Collectors.toList());
    }


    public Vehicle findByIdAndCurrentUser(Long vehicleId) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) throw new IllegalStateException("로그인 정보가 없습니다.");
        return vehicleRepository.findByIdAndUser_Id(vehicleId, userId)
                .orElseThrow(() -> new IllegalArgumentException("당신의 차량이 아니거나 존재하지 않습니다."));
    }


    public Optional<Vehicle> findByPhoneAndIsForeign(String phone, Boolean isForeign) {
        return vehicleRepository.findByPhoneAndIsForeign(phone, isForeign);
    }

    public Optional<Vehicle> findLatestByPhoneAndIsForeign(String phone) {
        return vehicleRepository.findTopByPhoneAndIsForeignOrderByCreatedAtDesc(phone, true);
    }

    public Optional<Vehicle> findMostRecentActiveVehicleByPhoneAndIsForeign(String phone, boolean isForeign) {
        return vehicleRepository
                .findTopByPhoneAndIsForeignOrderByCreatedAtDesc(phone, isForeign);
    }

    @Transactional(readOnly = true)
    public List<VehicleRegistrationInfoDto> getInvitedApprovedVehicles() {
        List<EntryRecord> approvedRecords = entryRecordRepository.findByStatus(EntryRecord.Status.INVITER_AGREE);

        checkRoleUtils.validateManagerAccess();

        return approvedRecords.stream()
                .map(record -> VehicleRegistrationInfoDto.from(record.getVehicle(), record))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VehicleRegistrationInfoDto> getActiveVehicles() {

//        // 현재 로그인한 사용자 가져오기
//        User currentUser = SecurityUtil.getCurrentUser();
//        if (currentUser == null) {
//            throw new IllegalArgumentException("로그인이 필요합니다.");
//        }
//
//        Set<Role> roles = currentUser.getRoles();
//
//        // Role 검사: MANAGER 또는 MODERATOR만 허용
//        boolean isManagerOrModerator = roles.stream().anyMatch(role ->
//                role == Role.MANAGER || role == Role.MODERATOR);
//
//        if (!isManagerOrModerator) {
//            throw new RuntimeException("관리자만 조회할 수 있습니다.");
//        }

        checkRoleUtils.validateManagerAccess();



        // 1) ACTIVE 차량 엔티티 조회
        List<Vehicle> activeVehicles = vehicleRepository.findAllByStatus(Vehicle.Status.ACTIVE);

        // 2) 필요한 DTO로 변환
        return activeVehicles.stream()
                .map(v -> VehicleRegistrationInfoDto.from(v,
                        /* 여기 EntryRecord는 필요 없으면 더미나 null 처리 */
                        EntryRecord.builder().status(null).build()))
                .collect(Collectors.toList());
    }

    // 현재 주차 중인 차량 수
    public long countActiveVehicles() {
        return vehicleRepository.countByStatus(Vehicle.Status.ACTIVE);
    }

    // 남은 주차 공간 수
    public int getRemainingSpace() {
        long activeCount = countActiveVehicles();
        return parkingProperties.getMaxCapacity() - (int) activeCount;
    }

    // 전체 주차장 현황 반환 DTO
    public ParkingStatusDto getParkingStatus() {

        checkRoleUtils.validateAdminAccess();
        long activeCount = countActiveVehicles();
        return ParkingStatusDto.builder()
                .totalCapacity(parkingProperties.getMaxCapacity())
                .activeCount(activeCount)
                .remainingSpace(parkingProperties.getMaxCapacity() - (int) activeCount)
                .build();
    }

    public List<Vehicle> getVehiclesByUserId(Long userId) {
        return vehicleRepository.findByUserId(userId);
    }

    /** 현재 로그인 유저의 차량 목록을 VehicleRegistrationInfoDto로 반환 */
    @Transactional(readOnly = true)
    public List<VehicleRegistrationInfoDto> getMyVehicleRegistrations() {
        Long userId = SecurityUtil.getCurrentUserId();
        if (userId == null) {
            throw new IllegalStateException("로그인 정보가 없습니다.");
        }

        // 1) 소유 차량 전체를 불러온다
        List<Vehicle> vehicles = vehicleRepository.findAllByUser_Id(userId);

        // 2) 각 차량마다 최신 EntryRecord 하나(or status별로 원하는 것) 가져오기
        return vehicles.stream()
                .map(vehicle -> {
                    // 예시: 최신 상태 레코드를 하나 꺼낸다
                    EntryRecord er = entryRecordRepository
                            .findTopByVehicleIdOrderByCreatedAtDesc(vehicle.getId())
                            .orElseGet(() -> EntryRecord.builder().status(null).build());
                    // 3) DTO로 변환
                    return VehicleRegistrationInfoDto.from(vehicle, er);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<VehicleRegistrationInfoDto> getForeignsVehicleRegistrationInfo() {

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime yesterday = now.minusHours(24);





        List<EntryRecord> entryRecords = entryRecordRepository.findByVehicleIsForeignWithVehicleAndUser(true);


        return entryRecords.stream()
                .filter(er -> er.getVehicle().getCreatedAt() != null
                        && er.getVehicle().getCreatedAt().isAfter(yesterday))
                .map(er -> VehicleRegistrationInfoDto.from(er.getVehicle(), er))
                .collect(Collectors.toList());
    }


    // ③ 런타임에 maxCapacity를 변경하고 싶을 때 호출할 메서드
    public void updateMaxCapacity(int newCapacity) {
        checkRoleUtils.validateAdminAccess();
        // yml에서 주입된 기본값을 덮어쓴다
        parkingProperties.setMaxCapacity(newCapacity);
    }




























}
