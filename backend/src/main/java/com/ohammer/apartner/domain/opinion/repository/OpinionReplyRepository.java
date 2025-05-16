package com.ohammer.apartner.domain.opinion.repository;

import com.ohammer.apartner.domain.opinion.entity.OpinionReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OpinionReplyRepository extends JpaRepository<OpinionReply, Long> {
}
