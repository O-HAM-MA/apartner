package com.ohammer.apartner.domain.image.repository;


import java.time.LocalDateTime;
import java.util.List;

import com.ohammer.apartner.domain.image.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {


    List<Image> findByTempIdIn(List<String> tempIds);



    List<Image> findByIsTemporaryTrueAndExpiresAtBefore(LocalDateTime dateTime);

    // 여러 이미지 ID로 이미지들 조회
    List<Image> findAllByIdIn(List<Long> ids);
}
