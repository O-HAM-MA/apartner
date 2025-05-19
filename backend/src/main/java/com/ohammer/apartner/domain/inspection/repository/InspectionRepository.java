package com.ohammer.apartner.domain.inspection.repository;

import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InspectionRepository extends JpaRepository<Inspection, Long> {
    boolean existsById(Long id);

//    @Query("SELECT i FROM Inspection i " +
//            "JOIN i.user u " +
//            "WHERE u.id = :userId OR u.roles = 'MODERATOR'")
    @Query("SELECT i FROM Inspection i " +
            "JOIN i.user u " +
            "WHERE u.id = :userId OR :role MEMBER OF u.roles")
    List<Inspection> findByUserIdOrManager(@Param("userId") Long userId, @Param("role")Role role);
}
