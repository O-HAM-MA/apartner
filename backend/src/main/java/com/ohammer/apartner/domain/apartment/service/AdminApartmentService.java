package com.ohammer.apartner.domain.apartment.service;

import com.ohammer.apartner.domain.apartment.dto.ApartmentRequestDto;
import com.ohammer.apartner.domain.apartment.dto.ApartmentResponseDto;
import com.ohammer.apartner.domain.apartment.dto.BuildingRequestDto;
import com.ohammer.apartner.domain.apartment.dto.BuildingResponseDto;
import com.ohammer.apartner.domain.apartment.dto.UnitRequestDto;
import com.ohammer.apartner.domain.apartment.dto.UnitResponseDto;
import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;
import com.ohammer.apartner.domain.apartment.repository.ApartmentRepository;
import com.ohammer.apartner.domain.apartment.repository.BuildingRepository;
import com.ohammer.apartner.domain.apartment.repository.UnitRepository;
import com.ohammer.apartner.global.exception.InvalidRequestException;
import com.ohammer.apartner.global.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminApartmentService {

    private final ApartmentRepository apartmentRepository;
    private final BuildingRepository buildingRepository;
    private final UnitRepository unitRepository;


    @Transactional(readOnly = true)
    public Page<ApartmentResponseDto> getAllApartments(String name, String address, String zipcode, Pageable pageable) {
        Page<Apartment> apartments = apartmentRepository.findByCriteriaWithPage(name, address, zipcode, pageable);
        return apartments.map(ApartmentResponseDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public ApartmentResponseDto getApartmentById(Long apartmentId) {
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("아파트를 찾을 수 없습니다. ID: " + apartmentId));
        return ApartmentResponseDto.fromEntity(apartment);
    }

    public ApartmentResponseDto createApartment(ApartmentRequestDto requestDto) {
        Apartment apartment = Apartment.builder()
                .name(requestDto.getName())
                .address(requestDto.getAddress())
                .zipcode(requestDto.getZipcode())
                .build();
        try {
            Apartment savedApartment = apartmentRepository.save(apartment);
            return ApartmentResponseDto.fromEntity(savedApartment);
        } catch (DataIntegrityViolationException e) {
            throw new InvalidRequestException("아파트 정보 저장 중 오류가 발생했습니다. 중복된 데이터가 있는지 확인해주세요.", e);
        }
    }

    public ApartmentResponseDto updateApartment(Long apartmentId, ApartmentRequestDto requestDto) {
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("수정할 아파트를 찾을 수 없습니다. ID: " + apartmentId));

        Apartment updatedApartment = Apartment.builder()
                .id(apartment.getId()) 
                .name(requestDto.getName())
                .address(requestDto.getAddress())
                .zipcode(requestDto.getZipcode())
                .modifiedAt(LocalDateTime.now())
                .build();
        try {
            Apartment savedApartment = apartmentRepository.save(updatedApartment);
            return ApartmentResponseDto.fromEntity(savedApartment);
        } catch (DataIntegrityViolationException e) {
            throw new InvalidRequestException("아파트 정보 업데이트 중 오류가 발생했습니다. 중복된 데이터가 있는지 확인해주세요.", e);
        }
    }

    public void deleteApartment(Long apartmentId) {
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new ResourceNotFoundException("삭제할 아파트를 찾을 수 없습니다. ID: " + apartmentId));
        // 모든 동 조회
        List<Building> buildings = buildingRepository.findByApartmentId(apartmentId);
        for (Building building : buildings) {
            // 각 동의 모든 호수 삭제
            List<Unit> units = unitRepository.findByBuildingId(building.getId());
            unitRepository.deleteAll(units);
        }
        // 모든 동 삭제
        buildingRepository.deleteAll(buildings);
        // 아파트 삭제
        apartmentRepository.delete(apartment);
    }


    @Transactional(readOnly = true)
    public Page<BuildingResponseDto> getBuildingsByApartmentId(Long apartmentId, Pageable pageable) {
        if (!apartmentRepository.existsById(apartmentId)) {
            throw new ResourceNotFoundException("아파트를 찾을 수 없습니다. ID: " + apartmentId);
        }
        
        Page<Building> buildings = buildingRepository.findBuildingsWithApartmentByApartmentId(apartmentId, pageable);
        
        return buildings.map(building -> {
            Apartment apartment = building.getApartment();
            Long resolvedApartmentId = null;
            
            if (apartment != null) {
                if (!Hibernate.isInitialized(apartment)) {
                    resolvedApartmentId = apartmentId;
                } else {
                    resolvedApartmentId = apartment.getId();
                }
            }
            
            return BuildingResponseDto.fromEntity(building, resolvedApartmentId);
        });
    }
    
    @Transactional(readOnly = true)
    public BuildingResponseDto getBuildingById(Long buildingId) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("동을 찾을 수 없습니다. ID: " + buildingId));
        
        return BuildingResponseDto.safeFromEntity(building);
    }

    public BuildingResponseDto createBuilding(BuildingRequestDto requestDto) {
        Apartment apartment = apartmentRepository.findById(requestDto.getApartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("동을 추가할 아파트를 찾을 수 없습니다. ID: " + requestDto.getApartmentId()));

        Building building = Building.builder()
                .apartment(apartment)
                .buildingNumber(requestDto.getBuildingNumber())
                .build();
        try {
            Building savedBuilding = buildingRepository.save(building);
            return BuildingResponseDto.fromEntity(
                savedBuilding,
                savedBuilding.getApartment() != null ? savedBuilding.getApartment().getId() : null
            );
        } catch (DataIntegrityViolationException e) {
            throw new InvalidRequestException("이미 해당 아파트에 동일한 동 번호가 존재합니다.", e);
        }
    }

    public BuildingResponseDto updateBuilding(Long buildingId, BuildingRequestDto requestDto) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("수정할 동을 찾을 수 없습니다. ID: " + buildingId));
        
        Apartment apartment = apartmentRepository.findById(requestDto.getApartmentId())
                 .orElseThrow(() -> new ResourceNotFoundException("동을 할당할 아파트를 찾을 수 없습니다. ID: " + requestDto.getApartmentId()));

        Building updatedBuilding = Building.builder()
                .id(building.getId()) 
                .apartment(apartment)
                .buildingNumber(requestDto.getBuildingNumber())
                .modifiedAt(LocalDateTime.now())
                .build();
        try {
            Building savedBuilding = buildingRepository.save(updatedBuilding);
            return BuildingResponseDto.fromEntity(
                savedBuilding,
                savedBuilding.getApartment() != null ? savedBuilding.getApartment().getId() : null
            );
        } catch (DataIntegrityViolationException e) {
            throw new InvalidRequestException("동 정보 업데이트 중 오류가 발생했습니다. 이미 해당 아파트에 동일한 동 번호가 존재할 수 있습니다.", e);
        }
    }

    public void deleteBuilding(Long buildingId) {
        Building building = buildingRepository.findById(buildingId)
                .orElseThrow(() -> new ResourceNotFoundException("삭제할 동을 찾을 수 없습니다. ID: " + buildingId));
        // 동의 모든 호수 삭제
        List<Unit> units = unitRepository.findByBuildingId(buildingId);
        unitRepository.deleteAll(units);
        // 동 삭제
        buildingRepository.delete(building);
    }


    @Transactional(readOnly = true)
    public Page<UnitResponseDto> getUnitsByBuildingId(Long buildingId, Pageable pageable) {
        if (!buildingRepository.existsById(buildingId)) {
            throw new ResourceNotFoundException("동을 찾을 수 없습니다. ID: " + buildingId);
        }
        Page<Unit> units = unitRepository.findByBuildingId(buildingId, pageable);
        return units.map(UnitResponseDto::fromEntity);
    }

    @Transactional(readOnly = true)
    public UnitResponseDto getUnitById(Long unitId) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("호수를 찾을 수 없습니다. ID: " + unitId));
        return UnitResponseDto.fromEntity(unit);
    }

    public UnitResponseDto createUnit(UnitRequestDto requestDto) {
        Building building = buildingRepository.findById(requestDto.getBuildingId())
                .orElseThrow(() -> new ResourceNotFoundException("호수를 추가할 동을 찾을 수 없습니다. ID: " + requestDto.getBuildingId()));

        Unit unit = Unit.builder()
                .building(building)
                .unitNumber(requestDto.getUnitNumber())
                .build();
        try {
            Unit savedUnit = unitRepository.save(unit);
            return UnitResponseDto.fromEntity(savedUnit);
        } catch (DataIntegrityViolationException e) {
            throw new InvalidRequestException("이미 해당 동에 동일한 호수 번호가 존재합니다.", e);
        }
    }

    public UnitResponseDto updateUnit(Long unitId, UnitRequestDto requestDto) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("수정할 호수를 찾을 수 없습니다. ID: " + unitId));

        Building building = buildingRepository.findById(requestDto.getBuildingId())
                .orElseThrow(() -> new ResourceNotFoundException("호수를 할당할 동을 찾을 수 없습니다. ID: " + requestDto.getBuildingId()));
        
        Unit updatedUnit = Unit.builder()
                .id(unit.getId()) 
                .building(building)
                .unitNumber(requestDto.getUnitNumber())
                .modifiedAt(LocalDateTime.now())
                .build();
        try {
            Unit savedUnit = unitRepository.save(updatedUnit);
            return UnitResponseDto.fromEntity(savedUnit);
        } catch (DataIntegrityViolationException e) {
            throw new InvalidRequestException("호수 정보 업데이트 중 오류가 발생했습니다. 이미 해당 동에 동일한 호수 번호가 존재할 수 있습니다.", e);
        }
    }

    public void deleteUnit(Long unitId) {
        Unit unit = unitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("삭제할 호수를 찾을 수 없습니다. ID: " + unitId));
        unitRepository.delete(unit);
    }
}