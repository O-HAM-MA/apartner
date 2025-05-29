package com.ohammer.apartner.domain.facility.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "facility_reservations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FacilityReservation extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false)
    private Facility facility;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_time_slot_id")
    private FacilityTimeSlot timeSlot;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "request_message")
    private String requestMessage; // 사용자 요청사항 (optional)

    @Enumerated(EnumType.STRING)
    @Column(name = "cancel_reason_type")
    private CancelReasonType cancelReasonType; // 취소사유

    @Column(name = "cancel_reason_detail")
    private String cancelReasonDetail; // 기타 등 상세 내용 입력

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    // Enum for status
    public enum Status {
        AGREE, PENDING, REJECT, CANCEL
        // 승인 완료, 승인 대기, 승인 거절, 예약 취소
    }

    public enum CancelReasonType {
        PERSONAL_REASON,     // 개인사정
        SCHEDULE_CONFLICT,   // 일정 중복
        ILLNESS,             // 질병/건강 문제
        MISTAKE,             // 잘못 예약함
        OTHER                // 기타
    }

} 