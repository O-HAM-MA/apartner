package com.ohammer.apartner.domain.apartment.entity;

import com.ohammer.apartner.global.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "units",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"building_id", "unit_number"})
    }
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Unit extends BaseEntity {

  
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")
    private Building building;

    @Column(name = "unit_number", length = 10, nullable = false)
    private String unitNumber;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
} 