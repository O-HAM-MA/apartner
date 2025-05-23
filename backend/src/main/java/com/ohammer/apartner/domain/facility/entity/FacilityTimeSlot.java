package com.ohammer.apartner.domain.facility.entity;

import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "facility_time_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityTimeSlot extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id") // 강사 없는 Slot도 가능
    private FacilityInstructor instructor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private FacilityInstructorSchedule schedule;

    @Column(name = "date", nullable = false)
    private LocalDate date; // 2025-05-26

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime; // 10:00

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime; // 10:30

    @Column(name = "max_capacity", nullable = false)
    private Long maxCapacity; // 슬롯별 최대 예약인원

}