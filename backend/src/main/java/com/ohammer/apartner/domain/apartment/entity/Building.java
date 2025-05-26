package com.ohammer.apartner.domain.apartment.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
    name = "buildings",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"apartment_id", "building_number"})
    }
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Building extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Apartment apartment;

    @Column(name = "building_number", length = 10, nullable = false)
    private String buildingNumber;

    @OneToMany(mappedBy = "building", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore // JSON 직렬화 시 units 컬렉션을 무시하여 순환 참조 방지
    private List<Unit> units = new ArrayList<>();
}