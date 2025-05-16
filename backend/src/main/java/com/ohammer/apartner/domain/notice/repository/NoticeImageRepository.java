package com.ohammer.apartner.domain.notice.repository;

import com.ohammer.apartner.domain.notice.entity.Notice;
import com.ohammer.apartner.domain.notice.entity.NoticeImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeImageRepository extends JpaRepository<NoticeImage, Long> {

    // 특정 공지에 연결된 이미지 전부 삭제
    void deleteAllByNotice(Notice notice);

}
