package com.ohammer.apartner.domain.user.repository;

import com.ohammer.apartner.domain.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
}
