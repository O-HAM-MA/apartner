package com.ohammer.apartner.domain.opinion.repository;

import com.ohammer.apartner.domain.opinion.entity.OpinionReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OpinionReplyRepository extends JpaRepository<OpinionReply, Long> {

    List<OpinionReply> findByOpinionId(Long opinionId);

}
