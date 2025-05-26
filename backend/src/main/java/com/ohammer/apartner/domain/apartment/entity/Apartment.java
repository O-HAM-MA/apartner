package com.ohammer.apartner.domain.apartment.entity;

import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "apartments")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Apartment extends BaseEntity {

    @Column(name = "name", length = 50)
    private String name;

    @Column(name = "address", columnDefinition = "TEXT")
    private String address;

    @Column(name = "zipcode", length = 10)
    private String zipcode;
} 