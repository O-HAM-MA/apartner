package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.repository.ApartmentRepository;
import com.ohammer.apartner.domain.facility.dto.request.FacilityCreateRequestDto;
import com.ohammer.apartner.domain.facility.dto.request.FacilityUpdateRequestDto;
import com.ohammer.apartner.domain.facility.dto.response.FacilityReservationManagerDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructorSchedule;
import com.ohammer.apartner.domain.facility.entity.FacilityReservation;
import com.ohammer.apartner.domain.facility.entity.FacilityTimeSlot;
import com.ohammer.apartner.domain.facility.repository.FacilityInstructorRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityInstructorScheduleRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityReservationRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityTimeSlotRepository;
import com.ohammer.apartner.global.Status;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityManagerService {

    private final ApartmentRepository apartmentRepository;
    private final FacilityRepository facilityRepository;
    private final FacilityReservationRepository facilityReservationRepository;
    private final FacilityTimeSlotRepository facilityTimeSlotRepository;
    private final FacilityInstructorRepository facilityInstructorRepository;
    private final FacilityInstructorScheduleRepository facilityInstructorScheduleRepository;

    // 공용시설 등록
    @Transactional
    public Long createFacility(FacilityCreateRequestDto facilityCreateRequestDto, Long apartmentId) {
        Apartment apartment = apartmentRepository.findById(apartmentId)
                .orElseThrow(() -> new EntityNotFoundException("아파트를 찾을 수 없습니다."));

        if (facilityRepository.existsByApartmentIdAndName(apartmentId, facilityCreateRequestDto.getName())) {
            throw new IllegalArgumentException("이미 존재하는 시설 이름입니다.");
        }
        if (facilityCreateRequestDto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("시설명에 공백을 입력할 수 없습니다.");
        }
        if (facilityCreateRequestDto.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("시설 설명에 공백을 입력할 수 없습니다.");
        }

        if (facilityCreateRequestDto.getOpenTime().equals(facilityCreateRequestDto.getCloseTime())) {
            throw new IllegalArgumentException("시작 시간과 종료 시간이 같을 수 없습니다.");
            // openTime > closeTime은 "익일 운영"으로 허용
            // openTime < closeTime은 "당일 운영"으로 허용
        }

        // 시설 생성
        Facility facility = Facility.builder()
                .name(facilityCreateRequestDto.getName())
                .description(facilityCreateRequestDto.getDescription())
                .openTime(facilityCreateRequestDto.getOpenTime())
                .closeTime(facilityCreateRequestDto.getCloseTime())
                .apartment(apartment)
                .status(Status.ACTIVE) // 등록 시 ACTIVE
                .build();
        facilityRepository.save(facility);

        // 2. 자유 이용 Slot 생성
        if (facilityCreateRequestDto.getFreeUseTimes() != null) {
            for (FacilityCreateRequestDto.FreeUseTime freeTime : facilityCreateRequestDto.getFreeUseTimes()) {
                // 반복적으로, 예를 들어 1시간 단위로 Slot 생성
                LocalTime time = freeTime.getStartTime();
                while (time.isBefore(freeTime.getEndTime())) {
                    LocalTime slotEnd = time.plusMinutes(facilityCreateRequestDto.getFreeUseUnitMinutes());
                    if (slotEnd.isAfter(freeTime.getEndTime())) {
                        break;
                    }
                    FacilityTimeSlot slot = FacilityTimeSlot.builder()
                            .facility(facility)
                            .instructor(null)
                            // date는 요일로 미리 지정하기 어려우니, Slot 등록이 아닌 템플릿 등록
                            .date(null)
                            .startTime(time)
                            .endTime(slotEnd)
                            .maxCapacity(facilityCreateRequestDto.getFreeUseCapacity())
                            .build();
                    facilityTimeSlotRepository.save(slot);
                    time = slotEnd;
                }
            }
        }

        // 강사 및 강사 시간표/슬롯 생성
        if (facilityCreateRequestDto.getInstructors() != null) {
            for (FacilityCreateRequestDto.InstructorInfo instructorDto : facilityCreateRequestDto.getInstructors()) {
                FacilityInstructor instructor = FacilityInstructor.builder()
                        .name(instructorDto.getName())
                        .description(instructorDto.getDescription())
                        .facility(facility)
                        .status(FacilityInstructor.Status.ACTIVE)
                        .build();
                facilityInstructorRepository.save(instructor);

                for (FacilityCreateRequestDto.InstructorSchedule scheduleDto : instructorDto.getSchedules()) {
                    FacilityInstructorSchedule schedule = FacilityInstructorSchedule.builder()
                            .instructor(instructor)
                            .dayOfWeek(scheduleDto.getDayOfWeek())
                            .startTime(scheduleDto.getStartTime())
                            .endTime(scheduleDto.getEndTime())
                            .capacity(scheduleDto.getCapacity())
                            .isDayOff(false)
                            .build();
                    facilityInstructorScheduleRepository.save(schedule);

                    // Slot 생성 (여기도 unitMinutes 단위로 쪼개기)
                    LocalTime time = scheduleDto.getStartTime();
                    while (time.isBefore(scheduleDto.getEndTime())) {
                        LocalTime slotEnd = time.plusMinutes(scheduleDto.getUnitMinutes());
                        if (slotEnd.isAfter(scheduleDto.getEndTime())) {
                            break;
                        }
                        FacilityTimeSlot slot = FacilityTimeSlot.builder()
                                .facility(facility)
                                .instructor(instructor)
                                .date(null) // 등록 시점에는 null, 실제 예약 시 date 지정
                                .startTime(time)
                                .endTime(slotEnd)
                                .maxCapacity(scheduleDto.getCapacity())
                                .build();
                        facilityTimeSlotRepository.save(slot);
                        time = slotEnd;
                    }
                }
            }
        }

        return facility.getId();
    }

    // 공용시설 수정
    @Transactional
    public void updateFacility(Long facilityId, FacilityUpdateRequestDto facilityUpdateRequestDto, Long apartmentId) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new EntityNotFoundException("공용시설을 찾을 수 없습니다."));

        if (facilityRepository.existsByApartmentIdAndNameAndIdNot(apartmentId, facilityUpdateRequestDto.getName(),
                facilityId)) {
            throw new IllegalArgumentException("이미 존재하는 시설 이름입니다.");
        }

        facility.update(
                facilityUpdateRequestDto.getName(),
                facilityUpdateRequestDto.getDescription(),
                facilityUpdateRequestDto.getOpenTime(),
                facilityUpdateRequestDto.getCloseTime()
        );
    }

    // 예약 목록 조회
    public Page<FacilityReservationManagerDto> getReservations(
            LocalDate date,
            Long facilityId,
            String statusStr,
            Pageable pageable
    ) {
        FacilityReservation.Status status = null;
        if (statusStr != null && !statusStr.isBlank()) {
            try {
                status = FacilityReservation.Status.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("잘못된 예약 상태입니다: " + statusStr);
            }
        }

        Page<FacilityReservation> reservations = facilityReservationRepository.findByManagerFilter(
                date, facilityId, status, pageable
        );

        return reservations.map(this::convertToDto);
    }

    private FacilityReservationManagerDto convertToDto(FacilityReservation r) {
        String reservationTime = String.format("%s %02d:%02d-%02d:%02d",
                r.getDate(),
                r.getStartTime().getHour(), r.getStartTime().getMinute(),
                r.getEndTime().getHour(), r.getEndTime().getMinute()
        );

        return new FacilityReservationManagerDto(
                r.getUser().getUserName(),
                r.getUser().getBuilding().getBuildingNumber(),
                r.getUser().getUnit().getUnitNumber(),
                r.getFacility().getName(),
                reservationTime,
                r.getCreatedAt().toString(),
                r.getStatus().name()
        );
    }

    // 예약 상태 변경
    @Transactional
    public void updateReservationStatus(Long facilityReservationId, String newStatusStr) {
        FacilityReservation facilityReservation = facilityReservationRepository.findById(facilityReservationId)
                .orElseThrow(() -> new EntityNotFoundException("예약 정보를 찾을 수 없습니다."));

        if (facilityReservation.getStatus() != FacilityReservation.Status.PENDING) {
            throw new IllegalStateException("예약 상태가 'PENDING'일 때만 상태를 변경할 수 있습니다.");
        }

        FacilityReservation.Status newStatus;
        try {
            newStatus = FacilityReservation.Status.valueOf(newStatusStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("잘못된 상태 값 입니다: " + newStatusStr);
        }

        if (newStatus != FacilityReservation.Status.AGREE && newStatus != FacilityReservation.Status.REJECT) {
            throw new IllegalArgumentException("상태는 AGREE 또는 REJECT만 가능합니다.");
        }

        facilityReservation.setStatus(newStatus);
        facilityReservationRepository.save(facilityReservation);
    }

}
