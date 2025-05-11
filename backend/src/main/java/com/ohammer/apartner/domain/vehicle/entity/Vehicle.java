package com.ohammer.apartner.domain.vehicle.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "vehicles")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle extends BaseEntity {

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "vehicle_num", length = 10, nullable = false)
    private String vehicleNum;

    @Column(name = "type", length = 225)
    private String type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Column(name = "is_foreign")
    private Boolean isForeign;

    // Enum for status
    public enum Status {
        ACTIVE, INACTIVE
    }


    @Column(name = "reason", length = 255)
    private String reason; // 외부 차량일 경우만 사용

    @Column(name = "phone")
    private String phone; // 외부 차량일 경우
} 