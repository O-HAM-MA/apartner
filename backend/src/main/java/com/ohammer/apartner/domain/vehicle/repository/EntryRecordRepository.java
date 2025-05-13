package com.ohammer.apartner.domain.vehicle.repository;

import com.ohammer.apartner.domain.vehicle.entity.EntryRecord;
import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EntryRecordRepository extends JpaRepository<EntryRecord, Long> {

    Optional<EntryRecord> findByVehicle(Vehicle vehicle);

    List<EntryRecord> findAllByVehicleIn(List<Vehicle> vehicles);

    Optional<EntryRecord> findById(Long id);

}
