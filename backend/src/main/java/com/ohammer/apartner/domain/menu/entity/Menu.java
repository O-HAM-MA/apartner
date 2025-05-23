package com.ohammer.apartner.domain.menu.entity;

import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "menus")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Menu extends BaseEntity {

    @Column(name = "name", length = 20, nullable = false)
    private String name;

    @Column(name = "url", length = 100, nullable = false)
    private String url;

    @Column(name = "description", length = 255)
    private String description;
    
    @Column(name = "icon", length = 50)
    private String icon;
    
    // 메뉴 정보 업데이트 메소드
    public void updateMenu(String name, String url, String description, String icon) {
        this.name = name;
        this.url = url;
        this.description = description;
        this.icon = icon;
    }
} 