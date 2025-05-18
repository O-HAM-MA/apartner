package com.ohammer.apartner.domain.vehicle.repository;

import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByIsForeignTrue();

    List<Vehicle> findByIsForeignFalse();

    public List<Vehicle> findByIsForeign(Boolean isForeign);

    // 전체 조회 (isForeign == null일 때)
    List<Vehicle> findAll();

    // isForeign 값에 따라 필터링된 조회

    Optional<Vehicle> findByUser_Id(Long userId);

    // 수정된 메소드
    List<Vehicle> findByIsForeignTrueAndStatusAndUser_Id(Vehicle.Status status, Long userId);

    @Query("SELECT v FROM Vehicle v JOIN EntryRecord e ON e.vehicle = v " +
            "WHERE v.isForeign = true AND v.user.id = :inviterId AND e.status = :status")
    List<Vehicle> findForeignVehiclesWithPendingEntryRecordByInviterId(
            @Param("inviterId") Long inviterId,
            @Param("status") EntryRecord.Status status
    );



    Optional<Vehicle> findByIdAndUser_Id(Long vehicleId, Long userId);

    // 한 유저의 모든 차량을 가져오는 메서드
    List<Vehicle> findAllByUser_Id(Long userId);

    Optional<Vehicle> findByPhoneAndIsForeign(String phone, Boolean isForeign);

    // 외부인 차량 조회
    Optional<Vehicle> findByPhoneAndIsForeign(String phone, boolean isForeign);

    Optional<Vehicle> findTopByPhoneAndIsForeignOrderByCreatedAtDesc(String phone, boolean isForeign);



    /**
     * status가 ACTIVE인 Vehicle만 조회
     */
    List<Vehicle> findAllByStatus(Vehicle.Status status);








}
