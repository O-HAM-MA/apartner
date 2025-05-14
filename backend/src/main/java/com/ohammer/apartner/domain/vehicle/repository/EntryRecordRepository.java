package com.ohammer.apartner.domain.vehicle.repository;

import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EntryRecordRepository extends JpaRepository<EntryRecord, Long> {

    Optional<EntryRecord> findByVehicle(Vehicle vehicle);

    List<EntryRecord> findAllByVehicleIn(List<Vehicle> vehicles);

    Optional<EntryRecord> findById(Long id);

//    @Query("SELECT er FROM EntryRecord er JOIN FETCH er.vehicle v JOIN FETCH v.user u")
//    List<EntryRecord> findAllWithVehicleAndUser();
//
//    @Query("SELECT er FROM EntryRecord er " +
//            "JOIN FETCH er.vehicle v " +
//            "LEFT JOIN FETCH v.user u " +
//            "WHERE v.isForeign = :isForeign")
//    List<EntryRecord> findByVehicleIsForeignWithVehicleAndUser(@Param("isForeign") Boolean isForeign);

    @Query("SELECT er FROM EntryRecord er " +
            "JOIN FETCH er.vehicle v " +
            "LEFT JOIN FETCH v.user")
    List<EntryRecord> findAllWithVehicleAndUser();

    @Query("SELECT er FROM EntryRecord er " +
            "JOIN FETCH er.vehicle v " +
            "LEFT JOIN FETCH v.user " +
            "WHERE v.isForeign = :isForeign")
    List<EntryRecord> findByVehicleIsForeignWithVehicleAndUser(@Param("isForeign") Boolean isForeign);










}
