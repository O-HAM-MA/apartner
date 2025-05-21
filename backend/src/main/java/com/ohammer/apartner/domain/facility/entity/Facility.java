package com.ohammer.apartner.domain.facility.entity;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "facilities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Facility extends BaseEntity {

    @Column(name = "name", length = 50)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id")
    private Apartment apartment;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status;

    public void update(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public void setInactive() {
        this.status = Status.INACTIVE;
    }

    public void setActive() {
        this.status = Status.ACTIVE;
    }
}