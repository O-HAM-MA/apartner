package com.ohammer.apartner.domain.inspection.dto;

import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.inspection.entity.InspectionType;
import com.ohammer.apartner.domain.inspection.entity.Result;
import com.ohammer.apartner.domain.user.entity.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class InspectionResponseDetailDto {
    private Long inspectionId;
    private Long userId;
    private String userName;
    private LocalDateTime startAt;
    private LocalDateTime finishAt;
    private String title;
    private String detail;
    private Result result;
    private String typeName;


    public static InspectionResponseDetailDto fromEntity(Inspection r) {
        User u = r.getUser();
        InspectionType t = r.getType();
        return new InspectionResponseDetailDto(
                r.getId(),
                u.getId(),
                u.getUserName(),
                r.getStartAt(),
                r.getFinishAt(),
                r.getTitle(),
                r.getDetail(),
                r.getResult(),
                t.getTypeName()
        );
    }
}

