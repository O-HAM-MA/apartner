package com.ohammer.apartner.domain.inspection.repository;

import com.ohammer.apartner.domain.inspection.entity.Inspection;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.global.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface InspectionRepository extends JpaRepository<Inspection, Long> {
    boolean existsById(Long id);

    @Query("SELECT DISTINCT i FROM Inspection i " +
            "JOIN i.user u " +
            "JOIN u.roles r " +
            "WHERE u.id = :userId OR r = :role")
    List<Inspection> findByUserIdOrManager(@Param("userId") Long userId, @Param("role") Role role);

    @Query("SELECT i FROM Inspection i WHERE i.status <> :excludedStatus")
    Page<Inspection> findAllByStatusNotWithdrawn(@Param("excludedStatus") Status excludedStatus, Pageable pageable);


    @Query("SELECT i FROM Inspection i WHERE i.user.id = :userId")
    List<Inspection> findByUserId(@Param("userId") Long userId);

    @Query("SELECT i FROM Inspection i JOIN i.user u JOIN u.roles r WHERE r = :role")
    List<Inspection> findByRole(@Param("role") Role role);
}
