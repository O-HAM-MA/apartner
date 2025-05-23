package com.ohammer.apartner.domain.menu.dto;

import com.ohammer.apartner.domain.menu.entity.Menu;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MenuDTO {
    
    private Long id;
    
    @NotBlank(message = "메뉴 이름은 필수 입력 항목입니다")
    @Size(max = 20, message = "메뉴 이름은 20자를 초과할 수 없습니다")
    private String name;
    
    @NotBlank(message = "메뉴 URL은 필수 입력 항목입니다")
    @Size(max = 100, message = "메뉴 URL은 100자를 초과할 수 없습니다")
    private String url;
    
    @Size(max = 255, message = "설명은 255자를 초과할 수 없습니다")
    private String description;
    
    @Size(max = 50, message = "아이콘 이름은 50자를 초과할 수 없습니다")
    private String icon;
    
    public static MenuDTO fromEntity(Menu menu) {
        return MenuDTO.builder()
                .id(menu.getId())
                .name(menu.getName())
                .url(menu.getUrl())
                .description(menu.getDescription())
                .icon(menu.getIcon())
                .build();
    }
    
    public static List<MenuDTO> fromEntities(List<Menu> menus) {
        return menus.stream()
                .map(MenuDTO::fromEntity)
                .collect(Collectors.toList());
    }
    
    public Menu toEntity() {
        return Menu.builder()
                .name(this.name)
                .url(this.url)
                .description(this.description)
                .icon(this.icon)
                .build();
    }
} 