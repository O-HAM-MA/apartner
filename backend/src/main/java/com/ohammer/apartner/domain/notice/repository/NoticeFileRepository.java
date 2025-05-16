package com.ohammer.apartner.domain.notice.repository;

import com.ohammer.apartner.domain.notice.entity.Notice;
import com.ohammer.apartner.domain.notice.entity.NoticeFile;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeFileRepository extends JpaRepository<NoticeFile, Long> {

    // 특정 공지에 연결된 파일 전부 삭제
    void deleteAllByNotice(Notice notice);

    // 특정 공지에 연결된 파일 목록 조회
    List<NoticeFile> findAllByNotice(Notice notice);

}
