package com.ohammer.apartner.domain.inspection.entity;

import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inspection_types")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InspectionType extends BaseEntity {

    @Column(name = "type_name")
    private String typeName;
}
