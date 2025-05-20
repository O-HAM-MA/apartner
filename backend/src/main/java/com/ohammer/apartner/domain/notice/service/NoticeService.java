package com.ohammer.apartner.domain.notice.service;

import com.ohammer.apartner.domain.notice.dto.request.NoticeCreateRequestDto;
import com.ohammer.apartner.domain.notice.dto.request.NoticeUpdateRequestDto;
import com.ohammer.apartner.domain.notice.dto.response.NoticeReadResponseDto;
import com.ohammer.apartner.domain.notice.dto.response.NoticeSummaryResponseDto;
import com.ohammer.apartner.domain.notice.dto.response.UserNoticeSummaryResponseDto;
import java.time.LocalDate;
import org.springframework.data.domain.Page;

public interface NoticeService {

    Long createNotice(NoticeCreateRequestDto noticeCreateRequestDto, Long userId);

    NoticeReadResponseDto readNotice(Long noticeId);

    void updateNotice(Long noticeId, NoticeUpdateRequestDto noticeUpdateRequestDto, Long userId);

    void deleteNotice(Long noticeId, Long userId);

    Page<NoticeSummaryResponseDto> getAdminNoticeList(
            Long buildingId,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size,
            String sort
    );

    Page<UserNoticeSummaryResponseDto> getUserNoticeList(
            Long buildingId,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size,
            String sort
    );
}
