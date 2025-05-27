package com.ohammer.apartner.domain.user.entity;

import com.ohammer.apartner.domain.apartment.entity.Apartment;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.entity.Unit;
import com.ohammer.apartner.domain.image.entity.Image;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id")
    private Apartment apartment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "building_id")   // 동을 나타내는 컬럼
    private Building building;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")       // 호수를 나타내는 컬럼
    private Unit unit;

    @Column(name = "grade_id")
    private Long gradeId;

    @Column(length = 50)
    private String socialProvider;
    
    @Column(length = 255)
    private String socialId;

    @Enumerated(EnumType.STRING)
    @ElementCollection(fetch = FetchType.LAZY)
    @Builder.Default
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role", nullable = false)
    private Set<Role> roles = new HashSet<>();

    @Column(name = "password", length = 255)
    private String password;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone_num", length = 255)
    private String phoneNum;

    @Column(name = "user_name", length = 255)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status; 

    @Column(length = 512)
    private String refreshToken;

    @Column(length = 255) 
    private String leaveReason;

    // 마지막 로그인 시간 필드 추가
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    // 계정 삭제 시간 필드 추가
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // 데이터베이스 스키마와 JPA 엔티티 간의 일관성을 보장하기 위해
    // nullable 설정을 false로 변경하고, cascade와 orphanRemoval 설정을 조정
    @OneToOne(cascade = {CascadeType.PERSIST, CascadeType.MERGE}, orphanRemoval = false)
@JoinColumn(name = "profile_image_id", referencedColumnName = "id", nullable = true)
private Image profileImage;
    
    public User(Long id, String username,String email, String password, Status status, Set<Role> roles) {
        this.setId(id); 
        this.userName = username; 
        this.email = email;
        this.password = password;
        this.status = status;
        this.roles = roles;
    }

    public User(Long id, String username, String password, String email, String phoneNum, String userName, Apartment apartment, Building building, Unit unit, Status status, Set<Role> roles) {
        this.setId(id); 
        this.userName = username; 
        this.password = password;
        this.email = email;
        this.phoneNum = phoneNum;
        this.userName = userName;
        this.apartment = apartment;
        this.building = building;
        this.unit = unit;
        this.status = status;
        this.roles = roles;
    }
    
    /**
     * 안전하게 프로필 이미지를 설정하는 헬퍼 메소드
     * @param image 설정할 이미지
     */
    public void setProfileImageSafely(Image image) {
        if (image != null) {
            this.profileImage = image;
            image.setUser(this);
        }
    }
}