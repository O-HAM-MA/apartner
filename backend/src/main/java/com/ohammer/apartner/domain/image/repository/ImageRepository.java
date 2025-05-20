package com.ohammer.apartner.domain.image.repository;


import com.ohammer.apartner.domain.image.entity.Image;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ImageRepository extends JpaRepository<Image, Long> {

    List<Image> findByTempIdIn(List<String> tempIds);

    List<Image> findByIsTemporaryTrueAndExpiresAtBefore(LocalDateTime dateTime);

}