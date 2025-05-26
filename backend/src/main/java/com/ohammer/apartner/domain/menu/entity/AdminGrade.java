package com.ohammer.apartner.domain.menu.entity;

import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "admin_grade")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminGrade extends BaseEntity {

    @Column(nullable = false, unique = true)
    private Integer level;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private String description;
}

