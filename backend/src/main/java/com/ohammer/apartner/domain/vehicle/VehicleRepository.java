package com.ohammer.apartner.domain.vehicle;

import com.ohammer.apartner.domain.vehicle.entity.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    List<Vehicle> findByIsForeignTrue();

    List<Vehicle> findByIsForeignFalse();

    public List<Vehicle> findByIsForeign(Boolean isForeign);

}
