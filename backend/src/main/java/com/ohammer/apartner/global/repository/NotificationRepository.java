package com.ohammer.apartner.global.repository;

import com.ohammer.apartner.global.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import com.ohammer.apartner.global.Status;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Notification> findByUserIdAndIsReadFalse(Long userId);
    
    List<Notification> findByUserIdAndIsReadFalseAndStatus(Long userId, Status status);
    
    // 알림 카테고리별 조회
    List<Notification> findByUserIdAndCategoryAndStatus(Long userId, String category, Status status);
    
    // 아파트별 알림 조회
    List<Notification> findByApartmentIdAndStatus(Long apartmentId, Status status);
    
    // 사용자별 상태에 따른 알림 조회 (최신순, 최대 10개)
    @Query("SELECT n FROM Notification n WHERE n.userId = :userId AND n.status = :status ORDER BY n.createdAt DESC")
    List<Notification> findTop10ByUserIdAndStatusOrderByCreatedAtDesc(@Param("userId") Long userId, @Param("status") Status status);
    
    // 아파트별 상태에 따른 알림 조회 (최신순, 최대 10개)
    @Query("SELECT n FROM Notification n WHERE n.apartmentId = :apartmentId AND n.status = :status ORDER BY n.createdAt DESC")
    List<Notification> findTop10ByApartmentIdAndStatusOrderByCreatedAtDesc(@Param("apartmentId") Long apartmentId, @Param("status") Status status);
    
    // 페이징을 지원하는 사용자별 알림 조회
    Page<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, Status status, Pageable pageable);
    
    // 아파트별 알림 조회 (최신순, 페이징)
    Page<Notification> findByApartmentIdAndStatusOrderByCreatedAtDesc(Long apartmentId, Status status, Pageable pageable);
    
    // 만료된 알림 조회
    List<Notification> findByExpiredAtBeforeAndStatus(LocalDateTime now, Status status);
    
    // 만료된 알림 상태 변경 (배치 처리용)
    @Modifying
    @Query("UPDATE Notification n SET n.status = :status WHERE n.expiredAt < :now AND n.status = 'ACTIVE'")
    int updateExpiredNotifications(@Param("now") LocalDateTime now, @Param("status") Status status);
    
    // 타입별 알림 조회
    List<Notification> findByUserIdAndTypeAndStatus(Long userId, String type, Status status);
    
    // 읽은 알림 삭제 (특정 기간 이전)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.userId = :userId AND n.isRead = true AND n.readAt < :beforeDate")
    int deleteReadNotificationsOlderThan(@Param("userId") Long userId, @Param("beforeDate") LocalDateTime beforeDate);
} 