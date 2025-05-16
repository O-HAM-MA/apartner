package com.ohammer.apartner.domain.vehicle.repository;

import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByIsForeignTrue();

    List<Vehicle> findByIsForeignFalse();

    public List<Vehicle> findByIsForeign(Boolean isForeign);

    // 전체 조회 (isForeign == null일 때)
    List<Vehicle> findAll();

    // isForeign 값에 따라 필터링된 조회




}
