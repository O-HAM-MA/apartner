package com.ohammer.apartner.domain.user;

import com.ohammer.apartner.domain.apartment.Apartment;
import com.ohammer.apartner.global.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartmant_id") // DB 스키마 그대로 사용
    private Apartment apartment;

    @Column(name = "grade_id")
    private Long gradeId;

    @Enumerated(EnumType.STRING)
    @Column(name = "role")
    private Role role;

    @Column(name = "password", length = 255)
    private String password;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "phone", length = 255)
    private String phone;

    @Column(name = "status", length = 255)
    private String status;

    // Enum for role
    public enum Role {
        USER, MANAGER
    }
} 