package com.ohammer.apartner.domain.user.repository;

import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;

import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    @EntityGraph(attributePaths = "roles")
    Optional<User> findByUserName(String userName);

    boolean existsByUserName(String userName); //아이디 중복확인

    @EntityGraph(attributePaths = "roles")
    Optional<User> findByEmail(String email); // 이메일로 사용자 찾는 메소드 추가

    boolean existsByEmail(String email); // 이메일 중복 확인 메서드 추가

    boolean existsBySocialId(String socialId);

    boolean existsByPhoneNum(String phoneNum);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles WHERE u.userName = :username")
    Optional<User> findByUserNameWithRoles(@Param("username") String username);

    @EntityGraph(attributePaths = "roles") // 🎯 roles 컬렉션을 함께 로딩
    @Query("SELECT u FROM User u WHERE u.id = :id")
    Optional<User> findByIdWithRoles(@Param("id") Long id);

    @EntityGraph(attributePaths = "roles") // 🎯 roles 컬렉션을 함께 로딩
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    Optional<User> findByPhoneNum(String testPhone);

    Page<User> findAllByRoles(Role role, Pageable pageable);

    Page<User> findAllUserByRoles(Role role, Pageable pageable);

    @EntityGraph(attributePaths = {"roles", "apartment", "building", "unit", "profileImage"})
    @NonNull
    @Override
    Optional<User> findById(@NonNull Long id);

    @EntityGraph(attributePaths = "roles")
    Optional<User> findByRefreshToken(String refreshToken);

    @EntityGraph(attributePaths = {"roles", "apartment", "building", "unit", "profileImage"})
    Optional<User> findBySocialProviderAndSocialId(String socialProvider, String socialId);

    @Query("SELECT u FROM User u JOIN FETCH u.building JOIN FETCH u.unit WHERE u.id = :id")
    Optional<User> findByIdWithBuildingAndUnit(@Param("id") Long id);

    @Query("""
        SELECT u FROM User u
         JOIN u.apartment a
         JOIN u.building b
         JOIN u.unit   t
        WHERE a.name       = :aptName
          AND b.buildingNumber = :bldgNum
          AND t.unitNumber     = :unitNum
      """)
    Optional<User> findByAptAndBuildingAndUnit(
            @Param("aptName") String aptName,
            @Param("bldgNum") String bldgNum,
            @Param("unitNum") String unitNum
    );

    @EntityGraph(attributePaths = "roles")
    @NonNull
    @Override
    List<User> findAll();

    @EntityGraph(attributePaths = "roles")
    @NonNull
    @Override
    Page<User> findAll(@NonNull Pageable pageable);

    @EntityGraph(attributePaths = "roles")
    @NonNull
    @Override
    List<User> findAll(@Nullable Specification<User> spec);

    @EntityGraph(attributePaths = {"roles", "apartment", "building", "unit", "profileImage"})
    @Query("SELECT u FROM User u WHERE u.email = :email")
    Optional<User> findByEmailWithFullInfo(@Param("email") String email);

    @Query("SELECT u FROM User u WHERE u.userName = :userName AND u.phoneNum = :phoneNum")
    Optional<User> findByUserNameAndPhoneNum(@Param("userName") String userName, @Param("phoneNum") String phoneNum);

}
