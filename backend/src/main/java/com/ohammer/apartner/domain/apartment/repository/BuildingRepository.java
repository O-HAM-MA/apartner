package com.ohammer.apartner.domain.apartment.repository;

import com.ohammer.apartner.domain.apartment.entity.Building;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Long> {
    List<Building> findByApartmentId(Long apartmentId);
} 