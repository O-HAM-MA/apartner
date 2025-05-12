package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.response.FacilityResponseDto;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityService {
    private final FacilityRepository facilityRepository;

    public List<FacilityResponseDto> getAllFacilities() {
        return facilityRepository.findAll().stream()
                .map(FacilityResponseDto::fromEntity)
                .collect(Collectors.toList());
    }

}