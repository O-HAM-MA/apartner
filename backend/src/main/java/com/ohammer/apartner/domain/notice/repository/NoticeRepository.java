package com.ohammer.apartner.domain.notice.repository;

import com.ohammer.apartner.domain.notice.dto.response.NoticeSummaryResponseDto;
import com.ohammer.apartner.domain.notice.dto.response.UserNoticeSummaryResponseDto;
import com.ohammer.apartner.domain.notice.entity.Notice;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    @Query("""
                SELECT new com.ohammer.apartner.domain.notice.dto.response.NoticeSummaryResponseDto(
                    n.id, n.title, u.userName, b.id, n.createdAt, n.viewCount,
                     (SIZE(n.images) > 0), (SIZE(n.files) > 0))
                FROM Notice n
                LEFT JOIN n.user u
                LEFT JOIN n.building b
                WHERE n.status = 'ACTIVE'
                AND (:buildingId IS NULL OR b.id = :buildingId)
                AND (
                    (:startDate IS NULL OR :endDate IS NULL) 
                    OR (n.createdAt BETWEEN :startDate AND :endDate)
                )
            """)
    Page<NoticeSummaryResponseDto> findAllActiveNoticesForAdmin(
            @Param("buildingId") Long buildingId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

    @Query("""
                SELECT new com.ohammer.apartner.domain.notice.dto.response.UserNoticeSummaryResponseDto(
                    n.id, n.title, u.userName, n.createdAt, n.viewCount
                )
                FROM Notice n
                LEFT JOIN n.user u
                LEFT JOIN n.building b
                WHERE n.status = 'ACTIVE'
                AND (
                    (:buildingId IS NULL AND (b.id = :userBuildingId OR b.id IS NULL)) OR
                    (:buildingId IS NOT NULL AND b.id = :buildingId)
                )
                AND (
                    (:startDate IS NULL OR :endDate IS NULL)
                    OR (n.createdAt BETWEEN :startDate AND :endDate)
                )
            """)
    Page<UserNoticeSummaryResponseDto> findAllActiveNoticesForUser(
            @Param("buildingId") Long buildingId,
            @Param("userBuildingId") Long userBuildingId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );

}
