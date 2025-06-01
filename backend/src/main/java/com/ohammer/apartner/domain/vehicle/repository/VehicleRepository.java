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



    // 전체 조회 (isForeign == null일 때)
    List<Vehicle> findAll();



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



    Optional<Vehicle> findTopByPhoneAndIsForeignOrderByCreatedAtDesc(String phone, boolean isForeign);



    /**
     * status가 ACTIVE인 Vehicle만 조회
     */
    List<Vehicle> findAllByStatus(Vehicle.Status status);

    long countByStatus(Vehicle.Status status);

    List<Vehicle> findByUserId(Long userId);










}
