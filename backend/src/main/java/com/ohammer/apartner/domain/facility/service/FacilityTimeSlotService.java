package com.ohammer.apartner.domain.facility.service;

import com.ohammer.apartner.domain.facility.dto.response.TimeSlotSimpleResponseDto;
import com.ohammer.apartner.domain.facility.entity.Facility;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructor;
import com.ohammer.apartner.domain.facility.entity.FacilityInstructorSchedule;
import com.ohammer.apartner.domain.facility.entity.FacilityTimeSlot;
import com.ohammer.apartner.domain.facility.repository.FacilityInstructorRepository;
import com.ohammer.apartner.domain.facility.repository.FacilityTimeSlotRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FacilityTimeSlotService {

    private final FacilityTimeSlotRepository facilityTimeSlotRepository;
    private final FacilityInstructorRepository facilityInstructorRepository;

    // 타임슬롯 생성
    @Transactional
    public void createTimeSlots(
            Facility facility,
            FacilityInstructor instructor,
            FacilityInstructorSchedule schedule,
            String dayOfWeek,            // 예: "MONDAY"
            LocalTime startTime,
            LocalTime endTime,
            Long slotMinutes,
            Long capacity,
            LocalDate periodStart,       // 예: 2025-06-01
            LocalDate periodEnd          // 예: 2025-06-30
    ) {
        LocalDate current = periodStart;
        DayOfWeek targetDay = DayOfWeek.valueOf(dayOfWeek);

        while (!current.isAfter(periodEnd)) {
            // 해당 요일에만 생성
            if (current.getDayOfWeek() == targetDay) {
                LocalTime cursor = startTime;
                while (!cursor.plusMinutes(slotMinutes).isAfter(endTime.plusSeconds(1))) {
                    FacilityTimeSlot slot = FacilityTimeSlot.builder()
                            .facility(facility)
                            .instructor(instructor)
                            .schedule(schedule)
                            .date(current)
                            .startTime(cursor)
                            .endTime(cursor.plusMinutes(slotMinutes))
                            .maxCapacity(capacity)
                            .reservedCount(0L) // 새 슬롯은 예약 0명부터 시작
                            .build();
                    facilityTimeSlotRepository.save(slot);
                    cursor = cursor.plusMinutes(slotMinutes);
                }
            }
            current = current.plusDays(1);
        }
    }

    // 타임슬롯 목록 조회
    public List<TimeSlotSimpleResponseDto> getTimeSlots(Long facilityId, Long instructorId, Long apartmentId,
                                                        LocalDate startDate, LocalDate endDate) {
        FacilityInstructor instructor = facilityInstructorRepository.findById(instructorId)
                .orElseThrow(() -> new EntityNotFoundException("강사 없음"));
        if (!instructor.getFacility().getId().equals(facilityId) ||
                !instructor.getFacility().getApartment().getId().equals(apartmentId)) {
            throw new IllegalArgumentException("잘못된 접근");
        }
        List<FacilityTimeSlot> slots = facilityTimeSlotRepository.findByInstructorAndDateRange(
                facilityId, instructorId, startDate, endDate);

        return slots.stream()
                .map(TimeSlotSimpleResponseDto::from)
                .collect(Collectors.toList());
    }

    // 타임슬롯 단건 삭제
    @Transactional
    public void deleteTimeSlot(Long slotId, Long facilityId, Long instructorId, Long apartmentId) {
        FacilityTimeSlot slot = facilityTimeSlotRepository.findById(slotId)
                .orElseThrow(() -> new EntityNotFoundException("타임슬롯 없음"));
        if (!slot.getInstructor().getId().equals(instructorId)
                || !slot.getFacility().getId().equals(facilityId)
                || !slot.getFacility().getApartment().getId().equals(apartmentId)) {
            throw new IllegalArgumentException("삭제 권한 없음");
        }
        facilityTimeSlotRepository.delete(slot);
    }
}