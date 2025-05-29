package com.ohammer.apartner.domain.user.repository;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.entity.UserLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserLogRepository extends JpaRepository<UserLog, Long> {
    Page<UserLog> findByUser(User user, Pageable pageable);
    Page<UserLog> findByUserAndLogType(User user, UserLog.LogType logType, Pageable pageable);
}