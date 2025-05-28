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
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) // 모든 메소드가 읽기 전용
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;
    private final BuildingRepository buildingRepository;
    private final UnitRepository unitRepository;

    // == 아파트 조회 == //
    public List<ApartmentResponseDto> getAllApartments(String name, String address, String zipcode) {
        List<Apartment> apartments = apartmentRepository.findByCriteriaAsList(name, address, zipcode);
        return apartments.stream().map(ApartmentResponseDto::fromEntity).collect(Collectors.toList());
    }

    public ApartmentResponseDto getApartmentById(Long apartmentId) {
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("아파트를 찾을 수 없습니다. ID: " + apartmentId));
        return ApartmentResponseDto.fromEntity(apartment);
    }

    // == 동 조회 == //
    public List<BuildingResponseDto> getBuildingsByApartmentId(Long apartmentId) {
        if (!apartmentRepository.existsById(apartmentId)) {
            throw new ResourceNotFoundException("아파트를 찾을 수 없습니다. ID: " + apartmentId);
        }
        List<Building> buildings = buildingRepository.findByApartmentId(apartmentId);
        return buildings.stream()
            .map(building -> BuildingResponseDto.fromEntity(
                building, 
                building.getApartment() != null ? building.getApartment().getId() : null
            ))
            .collect(Collectors.toList());
    }

    public BuildingResponseDto getBuildingById(Long buildingId) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("동을 찾을 수 없습니다. ID: " + buildingId));
        return BuildingResponseDto.fromEntity(
            building, 
            building.getApartment() != null ? building.getApartment().getId() : null
        );
    }

    // == 호수 조회 == //
    public List<UnitResponseDto> getUnitsByBuildingId(Long buildingId) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("동을 찾을 수 없습니다. ID: " + buildingId);
        }
        List<Unit> units = unitRepository.findByBuildingId(buildingId);
        return units.stream().map(UnitResponseDto::fromEntity).collect(Collectors.toList());
    }

    public UnitResponseDto getUnitById(Long unitId) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("호수를 찾을 수 없습니다. ID: " + unitId));
        return UnitResponseDto.fromEntity(unit);
    }
    

    @Transactional
    public List<Map<String, Object>> getApartmentListForAdmin(User currentUser) {
        List<Map<String, Object>> result = new ArrayList<>();
        
        if (currentUser == null) {
            return result;
        }
        
        // ADMIN은 모든 아파트 목록 조회
        if (currentUser.getRoles().contains(Role.ADMIN)) {
            List<Apartment> apartments = apartmentRepository.findAll();
            return apartments.stream()
                .map(apt -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", apt.getId());
                    map.put("name", apt.getName());
                    return map;
                })
                .collect(Collectors.toList());
        }
        
        // MANAGER는 소속 아파트만 조회
        if (currentUser.getRoles().contains(Role.MANAGER) && currentUser.getApartment() != null) {
            Apartment apartment = apartmentRepository.findById(currentUser.getApartment().getId())
                .orElse(null);
                
            if (apartment != null) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", apartment.getId());
                map.put("name", apartment.getName());
                result.add(map);
            }
        }
        
        return result;
    }
} 