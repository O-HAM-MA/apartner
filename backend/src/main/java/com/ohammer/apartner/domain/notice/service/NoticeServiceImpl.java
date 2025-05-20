package com.ohammer.apartner.domain.notice.service;

import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.repository.BuildingRepository;
import com.ohammer.apartner.domain.image.entity.Image;
import com.ohammer.apartner.domain.image.repository.ImageRepository;
import com.ohammer.apartner.domain.notice.dto.request.NoticeCreateRequestDto;
import com.ohammer.apartner.domain.notice.dto.request.NoticeUpdateRequestDto;
import com.ohammer.apartner.domain.notice.dto.response.NoticeReadResponseDto;
import com.ohammer.apartner.domain.notice.dto.response.NoticeReadResponseDto.NoticeFileDto;
import com.ohammer.apartner.domain.notice.dto.response.NoticeSummaryResponseDto;
import com.ohammer.apartner.domain.notice.dto.response.UserNoticeSummaryResponseDto;
import com.ohammer.apartner.domain.notice.entity.Notice;
import com.ohammer.apartner.domain.notice.entity.NoticeFile;
import com.ohammer.apartner.domain.notice.entity.NoticeImage;
import com.ohammer.apartner.domain.notice.repository.NoticeFileRepository;
import com.ohammer.apartner.domain.notice.repository.NoticeImageRepository;
import com.ohammer.apartner.domain.notice.repository.NoticeRepository;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.domain.user.repository.UserRepository;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.security.utils.SecurityUtil;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeServiceImpl implements NoticeService {

    private final UserRepository userRepository;
    private final BuildingRepository buildingRepository;
    private final ImageRepository imageRepository;
    private final NoticeRepository noticeRepository;
    private final NoticeImageRepository noticeImageRepository;
    private final NoticeFileRepository noticeFileRepository;

    @Override
    @Transactional
    public Long createNotice(NoticeCreateRequestDto noticeCreateRequestDto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        Building building = null;
        if (noticeCreateRequestDto.getBuildingId() != null) {
            building = buildingRepository.findById(noticeCreateRequestDto.getBuildingId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 동입니다."));
        }

        // 공지사항 생성
        Notice notice = Notice.builder()
                .user(user)
                .building(building)
                .title(noticeCreateRequestDto.getTitle())
                .content(noticeCreateRequestDto.getContent())
                .viewCount(0L)
                .status(Status.ACTIVE)
                .build();

        noticeRepository.save(notice);

        // 이미지 연결
        if (noticeCreateRequestDto.getImageIds() != null) {
            List<Image> images = imageRepository.findAllById(noticeCreateRequestDto.getImageIds());

            for (Image image : images) {
                image.setIsTemporary(false); // 게시글에 연결되었으므로 확정됨
                image.setIsTemp(false);      // 이제 임시폴더에 있지 않음 (또는 temp 상태 아님)
                noticeImageRepository.save(
                        NoticeImage.builder()
                                .notice(notice)
                                .image(image)
                                .build()
                );
            }
        }

        // 파일 연결
        if (noticeCreateRequestDto.getFileIds() != null) {
            List<NoticeFile> files = noticeFileRepository.findAllById(noticeCreateRequestDto.getFileIds());

            for (NoticeFile file : files) {
                file.setNotice(notice); // 연결
            }
        }

        return notice.getId();
    }

    @Override
    @Transactional
    public NoticeReadResponseDto readNotice(Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 존재하지 않습니다."));

        if (notice.getStatus() != Status.ACTIVE) {
            throw new IllegalArgumentException("삭제되었거나 비활성화된 공지사항입니다.");
        }

        // 현재 사용자 ID 가져오기
        Long currentUserId = SecurityUtil.getCurrentUser().getId();

        // 작성자가 아닌 경우에만 조회수 증가
        if (!notice.getUser().getId().equals(currentUserId)) {
            notice.increaseViewCount();
            notice.setModifiedAt(LocalDateTime.now());
            noticeRepository.save(notice);
        }

        List<String> imageUrls = notice.getImages().stream()
                .map(noticeImage -> noticeImage.getImage().getFilePath())
                .collect(Collectors.toList());

        List<NoticeFileDto> noticeFileDtos = notice.getFiles().stream()
                .map(file -> NoticeFileDto.builder()
                        .originalName(file.getOriginalName())
                        .downloadUrl(file.getPath()) // 혹은 presigned URL 생성 로직
                        .size(file.getSize())
                        .build())
                .collect(Collectors.toList());

        return NoticeReadResponseDto.builder()
                .noticeId(notice.getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .authorName(notice.getUser().getUserName()) // or username
                .createdAt(notice.getCreatedAt())
                .viewCount(notice.getViewCount())
                .imageUrls(imageUrls)
                .fileUrls(noticeFileDtos)
                .build();
    }

    @Override
    @Transactional
    public void updateNotice(Long noticeId, NoticeUpdateRequestDto noticeUpdateRequestDto, Long userId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 존재하지 않습니다."));

        if (notice.getStatus() != Status.ACTIVE) {
            throw new IllegalArgumentException("삭제되었거나 비활성화된 공지사항입니다.");
        }

        if (!notice.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("작성자만 게시글을 수정할 수 있습니다.");
        }

        // 제목, 내용 변경 (null이 아닌 경우만)
        if (noticeUpdateRequestDto.getTitle() != null) {
            notice.setTitle(noticeUpdateRequestDto.getTitle());
            notice.setModifiedAt(LocalDateTime.now());
        }
        if (noticeUpdateRequestDto.getContent() != null) {
            notice.setContent(noticeUpdateRequestDto.getContent());
            notice.setModifiedAt(LocalDateTime.now());
        }

        // 새 이미지 연결
        if (noticeUpdateRequestDto.getImageIds() != null && !noticeUpdateRequestDto.getImageIds().isEmpty()) {
            noticeImageRepository.deleteAllByNotice(notice);
            List<Image> images = imageRepository.findAllById(noticeUpdateRequestDto.getImageIds());
            for (Image image : images) {
                image.setIsTemporary(false);
                image.setModifiedAt(LocalDateTime.now());
                noticeImageRepository.save(
                        NoticeImage.builder()
                                .notice(notice)
                                .image(image)
                                .build()
                );
            }
        }

        // 새 파일 연결
        if (noticeUpdateRequestDto.getFileIds() != null && !noticeUpdateRequestDto.getFileIds().isEmpty()) {
            noticeFileRepository.deleteAllByNotice(notice);
            List<NoticeFile> files = noticeFileRepository.findAllById(noticeUpdateRequestDto.getFileIds());
            for (NoticeFile file : files) {
                file.setNotice(notice); // 파일에 notice 연결
                file.setModifiedAt(LocalDateTime.now());
            }
        }
    }

    @Override
    @Transactional
    public void deleteNotice(Long noticeId, Long userId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new IllegalArgumentException("해당 공지사항이 존재하지 않습니다."));

        if (!notice.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("작성자만 게시글을 삭제할 수 있습니다.");
        }

        notice.setStatus(Status.INACTIVE); // soft delete
        notice.setModifiedAt(LocalDateTime.now());
    }

    @Override
    public Page<NoticeSummaryResponseDto> getAdminNoticeList(
            Long buildingId,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size,
            String sort
    ) {
        if (buildingId != null) {
            Building building = buildingRepository.findById(buildingId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 동입니다."));
        }

        Sort sortOrder = Sort.by("createdAt");
        sortOrder = "asc".equalsIgnoreCase(sort) ? sortOrder.ascending() : sortOrder.descending();
        Pageable pageable = PageRequest.of(page, size, sortOrder);

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(23, 59, 59) : null;

        return noticeRepository.findAllActiveNoticesForAdmin(buildingId, startDateTime, endDateTime, pageable);
    }

    @Override
    public Page<UserNoticeSummaryResponseDto> getUserNoticeList(
            Long buildingId,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int size,
            String sort
    ) {
        User user = SecurityUtil.getCurrentUser();
        Long userBuildingId = user.getBuilding().getId();

        Sort sortOrder = Sort.by("createdAt");
        sortOrder = "asc".equalsIgnoreCase(sort) ? sortOrder.ascending() : sortOrder.descending();
        Pageable pageable = PageRequest.of(page, size, sortOrder);

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(23, 59, 59) : null;

        return noticeRepository.findAllActiveNoticesForUser(
                buildingId, userBuildingId, startDateTime, endDateTime, pageable
        );
    }
}