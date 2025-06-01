package com.ohammer.apartner.domain.vehicle.repository;

import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EntryRecordRepository extends JpaRepository<EntryRecord, Long> {


    Optional<EntryRecord> findById(Long id);


    @Query("SELECT er FROM EntryRecord er " +
            "JOIN FETCH er.vehicle v " +
            "LEFT JOIN FETCH v.user")
    List<EntryRecord> findAllWithVehicleAndUser();

    @Query("SELECT er FROM EntryRecord er " +
            "JOIN FETCH er.vehicle v " +
            "LEFT JOIN FETCH v.user " +
            "WHERE v.isForeign = :isForeign")
    List<EntryRecord> findByVehicleIsForeignWithVehicleAndUser(@Param("isForeign") Boolean isForeign);

    void deleteAllByVehicle(Vehicle vehicle);



    @Query("SELECT er.vehicle FROM EntryRecord er WHERE er.status = :status")
    List<Vehicle> findVehiclesByEntryStatus(@Param("status") EntryRecord.Status status);

    List<EntryRecord> findByStatus(EntryRecord.Status status);


    @EntityGraph(attributePaths = {"vehicle"})
    Optional<EntryRecord> findTopByVehicleIdAndExitTimeIsNullOrderByEntryTimeDesc(Long vehicleId);
    List<EntryRecord> findByVehicleIdOrderByEntryTimeDesc(Long vehicleId);



    Optional<EntryRecord> findTopByVehicleIdOrderByCreatedAtDesc(Long vehicleId);




    // 🚗 입차용: 가장 최근에 승인(AGREE)되고, exitTime이 NULL인 레코드 한 건만
    Optional<EntryRecord> findFirstByVehicleIdAndStatusAndExitTimeIsNullOrderByCreatedAtDesc(
            Long vehicleId, EntryRecord.Status status);

    // 🚙 출차용: 가장 최근에 승인(AGREE)되고, exitTime이 NULL인 레코드 한 건만
    Optional<EntryRecord> findFirstByVehicleIdAndStatusAndExitTimeIsNullOrderByEntryTimeDesc(
            Long vehicleId, EntryRecord.Status status);





}
