package com.ohammer.apartner.domain.menu.entity;

import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "grade_menu_access")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeMenuAccess extends BaseEntity {


    @Column(name = "grade", length = 255)
    private String grade;

    @Column(name = "is_accessible")
    private Boolean isAccessible;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_id")
    private Menu menu;
} 