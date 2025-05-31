package com.ohammer.apartner.domain.community.repository;

import com.ohammer.apartner.domain.community.entity.Community;
import com.ohammer.apartner.global.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityRepository extends JpaRepository<Community, Long> {

    List<Community> findByStatusAndParentIsNullOrderByCreatedAtDesc(Status status);
    List<Community> findByStatusOrderByCreatedAtDesc(Status status);

    // 특정 댓글 ID를 부모로 가진 자식 댓글(답글) 조회
    List<Community> findByParentId(Long parentId);

    // 추가
    List<Community> findByParentIdAndStatus(Long parentId, Status status);
}
