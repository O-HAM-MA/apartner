package com.ohammer.apartner.domain.apartment.repository;

import com.ohammer.apartner.domain.apartment.entity.Building;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BuildingRepository extends JpaRepository<Building, Long> {
    List<Building> findByApartmentId(Long apartmentId);
    Page<Building> findByApartmentId(Long apartmentId, Pageable pageable);
    @Query("SELECT b FROM Building b JOIN FETCH b.apartment WHERE b.apartment.id = :apartmentId")
    List<Building> findBuildingsWithApartmentByApartmentId(@Param("apartmentId") Long apartmentId);
    @Query("SELECT b FROM Building b WHERE b.apartment.id = :apartmentId")
    @EntityGraph(attributePaths = {"apartment"})
    Page<Building> findBuildingsWithApartmentByApartmentId(@Param("apartmentId") Long apartmentId, Pageable pageable);
    
    @Query("SELECT DISTINCT b FROM Building b JOIN FETCH b.apartment LEFT JOIN FETCH b.units WHERE b.apartment.id = :apartmentId")
    List<Building> findBuildingsWithApartmentAndUnitsByApartmentId(@Param("apartmentId") Long apartmentId);
}