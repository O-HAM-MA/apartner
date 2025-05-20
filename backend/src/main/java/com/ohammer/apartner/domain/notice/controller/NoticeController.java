package com.ohammer.apartner.domain.notice.controller;

import com.ohammer.apartner.domain.notice.dto.request.NoticeCreateRequestDto;
import com.ohammer.apartner.domain.notice.dto.request.NoticeUpdateRequestDto;
import com.ohammer.apartner.domain.notice.dto.response.NoticeReadResponseDto;
import com.ohammer.apartner.domain.notice.dto.response.NoticeSummaryResponseDto;
import com.ohammer.apartner.domain.notice.dto.response.UserNoticeSummaryResponseDto;
import com.ohammer.apartner.domain.notice.service.NoticeService;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.utils.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/notices")
@Tag(name = "공지사항 관리")
public class NoticeController {

    private final NoticeService noticeService;

    @PostMapping("/create")
    @Operation(
            summary = "공지사항 게시글 등록",
            description = "게시글 작성사항: 제목, 내용, 파일"
    )
    public ResponseEntity<?> createNotice(@RequestBody @Valid NoticeCreateRequestDto noticeCreateRequestDto) {
        User user = SecurityUtil.getCurrentUser();
        Long noticeId = noticeService.createNotice(noticeCreateRequestDto, user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("noticeId", noticeId);
        response.put("message", "게시글을 성공적으로 등록했습니다.");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{noticeId}")
    @Operation(
            summary = "공지사항 게시글 조회",
            description = "게시글 조회사항: 제목, 작성자, 작성일, 조회수, 내용, 파일"
    )
    public ResponseEntity<NoticeReadResponseDto> readNotice(@PathVariable(name = "noticeId") Long noticeId) {
        NoticeReadResponseDto noticeReadResponseDto = noticeService.readNotice(noticeId);

        return ResponseEntity.ok(noticeReadResponseDto);
    }

    @PutMapping("/{noticeId}/update")
    @Operation(
            summary = "공지사항 게시글 수정",
            description = "게시글 수정 작성사항: 제목, 내용, 파일"
    )
    public ResponseEntity<Map<String, Object>> updateNotice(
            @PathVariable(name = "noticeId") Long noticeId,
            @Valid @RequestBody NoticeUpdateRequestDto noticeUpdateRequestDto
    ) {
        User user = SecurityUtil.getCurrentUser();
        noticeService.updateNotice(noticeId, noticeUpdateRequestDto, user.getId());
        Map<String, Object> response = new HashMap<>();

        response.put("message", "게시글이 성공적으로 수정되었습니다.");
        response.put("noticeId", noticeId);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{noticeId}")
    @Operation(
            summary = "공지사항 게시글 삭제",
            description = "게시글 삭제(INACTIVE 상태)"
    )
    public ResponseEntity<Map<String, Object>> deleteNotice(
            @PathVariable(name = "noticeId") Long noticeId
    ) {
        User user = SecurityUtil.getCurrentUser();
        noticeService.deleteNotice(noticeId, user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "게시글이 성공적으로 삭제되었습니다.");
        response.put("noticeId", noticeId);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(
            summary = "매니저 권한/ 공지사항 게시글 목록 조회",
            description = "매니저 권한 - 전체"
    )
    public ResponseEntity<Page<NoticeSummaryResponseDto>> getNoticeList(
            @RequestParam(name = "buildingId", required = false) Long buildingId,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "desc") String sort // "asc" or "desc"
    ) {
        Page<NoticeSummaryResponseDto> result = noticeService.getAdminNoticeList(
                buildingId, startDate, endDate, page, size, sort
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/user/list")
    @Operation(
            summary = "사용자 권한/ 공지사항 게시글 목록 조회",
            description = "사용자 권한 - 전체공지와 사용자 동"
    )
    public ResponseEntity<Page<UserNoticeSummaryResponseDto>> getUserNotices(
            @RequestParam(name = "buildingId", required = false) Long buildingId,
            @RequestParam(name = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "sort", defaultValue = "desc") String sort // "asc" or "desc"
    ) {
        User user = SecurityUtil.getCurrentUser();
        // 유효성 검증: buildingId가 null 또는 본인 것만 허용
        if (buildingId != null && !buildingId.equals(user.getBuilding().getId())) {
            throw new IllegalArgumentException("접근 권한이 없는 아파트 동입니다.");
        }

        Page<UserNoticeSummaryResponseDto> result = noticeService.getUserNoticeList(
                buildingId, startDate, endDate, page, size, sort
        );
        return ResponseEntity.ok(result);
    }
}