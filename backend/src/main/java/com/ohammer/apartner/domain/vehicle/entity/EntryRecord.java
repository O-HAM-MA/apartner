package com.ohammer.apartner.domain.vehicle.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(name = "entry_records")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Setter
public class EntryRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status;

    @Column(name = "entry_time")
    private LocalDateTime entryTime;

    @Column(name = "exit_time")
    private LocalDateTime exitTime;

    // Enum for status
    public enum Status {
        AGREE, INAGREE, PENDING
    }

//    @ManyToOne(fetch = FetchType.LAZY, optional = true)
//    @JoinColumn(name = "inviter_id")
//    private User inviter;

} 