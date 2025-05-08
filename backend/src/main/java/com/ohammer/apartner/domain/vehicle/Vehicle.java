package com.ohammer.apartner.domain.vehicle;

import com.ohammer.apartner.domain.user.User;
import com.ohammer.apartner.global.BaseEntity;
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

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicle_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
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
} 