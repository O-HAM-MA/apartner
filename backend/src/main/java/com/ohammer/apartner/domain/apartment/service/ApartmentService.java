package com.ohammer.apartner.domain.apartment.service;

import com.ohammer.apartner.domain.apartment.dto.ApartmentResponseDto;
import com.ohammer.apartner.domain.apartment.dto.BuildingResponseDto;
import com.ohammer.apartner.domain.apartment.dto.UnitResponseDto;
import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;
import com.ohammer.apartner.domain.apartment.repository.ApartmentRepository;
import com.ohammer.apartner.domain.apartment.repository.BuildingRepository;
import com.ohammer.apartner.domain.apartment.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;
    private final BuildingRepository buildingRepository;
    private final UnitRepository unitRepository;

    public List<ApartmentResponseDto> getAllApartments() {
        List<Apartment> apartments = apartmentRepository.findAll();
        return apartments.stream()
                .map(ApartmentResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<BuildingResponseDto> getBuildingsByApartmentId(Long apartmentId) {
        List<Building> buildings = buildingRepository.findByApartmentId(apartmentId);
        return buildings.stream()
                .map(BuildingResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<UnitResponseDto> getUnitsByBuildingId(Long buildingId) {
        List<Unit> units = unitRepository.findByBuildingId(buildingId);
        return units.stream()
                .map(UnitResponseDto::fromEntity)
                .collect(Collectors.toList());
    }
} 