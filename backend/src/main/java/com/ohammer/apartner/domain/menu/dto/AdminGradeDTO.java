package com.ohammer.apartner.domain.menu.dto;

import com.ohammer.apartner.domain.menu.entity.AdminGrade;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminGradeDTO {
    
    private Long id;
    
    @NotNull(message = "등급 레벨은 필수 입력 항목입니다")
    private Integer level;
    
    @NotBlank(message = "등급 이름은 필수 입력 항목입니다")
    @Size(max = 50, message = "등급 이름은 50자를 초과할 수 없습니다")
    private String name;
    
    @NotBlank(message = "등급 설명은 필수 입력 항목입니다")
    @Size(max = 255, message = "등급 설명은 255자를 초과할 수 없습니다")
    private String description;
    
    private Long usersCount;
    
    private List<Long> menuIds;
    
    public static AdminGradeDTO fromEntity(AdminGrade grade) {
        return AdminGradeDTO.builder()
                .id(grade.getId())
                .level(grade.getLevel())
                .name(grade.getName())
                .description(grade.getDescription())
                .build();
    }
    
    public static List<AdminGradeDTO> fromEntities(List<AdminGrade> grades) {
        return grades.stream()
                .map(AdminGradeDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public AdminGrade toEntity() {
        return AdminGrade.builder()
                .level(this.level)
                .name(this.name)
                .description(this.description)
                .build();
    }
} 