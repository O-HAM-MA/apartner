package com.ohammer.apartner.domain.notice.service;

import com.amazonaws.services.s3.AmazonS3;
import com.ohammer.apartner.domain.apartment.entity.Building;
import com.ohammer.apartner.domain.apartment.repository.BuildingRepository;
import com.ohammer.apartner.domain.image.entity.Image;
import com.ohammer.apartner.domain.image.repository.ImageRepository;
import com.ohammer.apartner.domain.notice.dto.request.NoticeRequestDto;
import com.ohammer.apartner.domain.notice.dto.response.NoticeReadResponseDto;
import com.ohammer.apartner.domain.notice.dto.response.NoticeReadResponseDto.NoticeFileDto;
import com.ohammer.apartner.domain.notice.dto.response.NoticeReadResponseDto.NoticeImageDto;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private final AmazonS3 amazonS3;
    private final UserRepository userRepository;
    private final BuildingRepository buildingRepository;
    private final ImageRepository imageRepository;
    private final NoticeRepository noticeRepository;
    private final NoticeImageRepository noticeImageRepository;
    private final NoticeFileRepository noticeFileRepository;

    @Override
    @Transactional
    public Long createNotice(NoticeRequestDto noticeRequestDto, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        Building building = null;
        if (noticeRequestDto.getBuildingId() != null) {
            building = buildingRepository.findById(noticeRequestDto.getBuildingId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 동입니다."));
        }

        // 공지사항 생성
        Notice notice = Notice.builder()
                .user(user)
                .building(building)
                .title(noticeRequestDto.getTitle())
                .content(noticeRequestDto.getContent())
                .viewCount(0L)
                .status(Status.ACTIVE)
                .build();

        noticeRepository.save(notice);

        // 이미지 연결
        if (noticeRequestDto.getImageIds() != null) {
//            List<Image> images = imageRepository.findAllById(noticeRequestDto.getImageIds());
            List<Long> imageIds = noticeRequestDto.getImageIds();
            List<Image> images = imageRepository.findAllById(imageIds);

            if (images.size() != imageIds.size()) {
                throw new IllegalArgumentException("일부 이미지가 존재하지 않습니다.");
            }

            for (Image image : images) {
                // ✅ S3 경로 이동
                String newPath = "notice/" + notice.getId() + "/images/" + image.getStoredName();
                amazonS3.copyObject(bucket, image.getS3Key(), bucket, newPath);
                amazonS3.deleteObject(bucket, image.getS3Key());
                image.setS3Key(newPath);
                image.setPath(newPath);
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
        if (noticeRequestDto.getFileIds() != null) {
            List<NoticeFile> files = noticeFileRepository.findAllById(noticeRequestDto.getFileIds());

            for (NoticeFile file : files) {
                // ✅ S3 경로 이동
                String newPath = "notice/" + notice.getId() + "/files/" + file.getStoredName();
                amazonS3.copyObject(bucket, file.getS3Key(), bucket, newPath);
                amazonS3.deleteObject(bucket, file.getS3Key());
                file.setS3Key(newPath);
                file.setPath(newPath);
                file.setNotice(notice);
                noticeFileRepository.save(file);
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

        List<NoticeImageDto> noticeImageDtos = notice.getImages().stream()
                .map(noticeImage -> {
                    Image image = noticeImage.getImage();
                    return NoticeImageDto.builder()
                            .id(image.getId())
                            .downloadUrl(amazonS3.getUrl(bucket, image.getS3Key()).toString())
                            .originalName(image.getOriginalName())
                            .size(image.getSize())
                            .build();
                })
                .collect(Collectors.toList());

        List<NoticeFileDto> noticeFileDtos = notice.getFiles().stream()
                .map(file -> NoticeFileDto.builder()
                        .id(file.getId())
                        .originalName(file.getOriginalName())
                        .downloadUrl(amazonS3.getUrl(bucket, file.getS3Key()).toString())
                        .size(file.getSize())
                        .build())
                .collect(Collectors.toList());

        return NoticeReadResponseDto.builder()
                .noticeId(notice.getId())
                .title(notice.getTitle())
                .content(notice.getContent())
                .authorName(notice.getUser().getUserName())
                .createdAt(notice.getCreatedAt())
                .viewCount(notice.getViewCount())
                .imageUrls(noticeImageDtos)
                .fileUrls(noticeFileDtos)
                .build();
    }

    @Override
    @Transactional
    public void updateNotice(Long noticeId, NoticeRequestDto noticeUpdateRequestDto, Long userId) {
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

        // buildingId가 있으면 수정
        if (noticeUpdateRequestDto.getBuildingId() != null) {
            if (noticeUpdateRequestDto.getBuildingId() == 0) {
                notice.setBuilding(null); // 전체 공지
            } else {
                Building building = buildingRepository.findById(noticeUpdateRequestDto.getBuildingId())
                        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 동입니다."));
                notice.setBuilding(building);
            }
        }

        // 이미지
        if (noticeUpdateRequestDto.getImageIds() != null) {
            // 1. 기존 notice에 연결된 이미지 id 목록
            Set<Long> existingImageIds = notice.getImages().stream()
                    .map(ni -> ni.getImage().getId())
                    .collect(Collectors.toSet());

            // 2. 요청받은(수정 후 남길) 이미지 id 리스트
            List<Long> requestedImageIds = noticeUpdateRequestDto.getImageIds();

            // 3. 기존에 연결된 이미지 중 요청에 없는 것들은 연결 해제(삭제)
            for (NoticeImage noticeImage : new ArrayList<>(notice.getImages())) {
                if (!requestedImageIds.contains(noticeImage.getImage().getId())) {
                    noticeImageRepository.delete(noticeImage);
                }
            }

            // 4. 요청 id 중 기존에 없는 이미지는 새로 연결
            List<Image> imagesToAdd = imageRepository.findAllById(requestedImageIds).stream()
                    .filter(img -> !existingImageIds.contains(img.getId()))
                    .collect(Collectors.toList());
            for (Image image : imagesToAdd) {
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

        // 파일
        if (noticeUpdateRequestDto.getFileIds() != null) {
            Set<Long> existingFileIds = notice.getFiles().stream()
                    .map(NoticeFile::getId)
                    .collect(Collectors.toSet());

            List<Long> requestedFileIds = noticeUpdateRequestDto.getFileIds();

            // 기존 연결된 파일 중 요청에 없는 것은 삭제(연결 해제)
            for (NoticeFile noticeFile : new ArrayList<>(notice.getFiles())) {
                if (!requestedFileIds.contains(noticeFile.getId())) {
                    noticeFileRepository.delete(noticeFile);
                }
            }

            // 요청 id 중 기존에 없는 파일은 새로 연결
            List<NoticeFile> filesToAdd = noticeFileRepository.findAllById(requestedFileIds).stream()
                    .filter(f -> !existingFileIds.contains(f.getId()))
                    .collect(Collectors.toList());
            for (NoticeFile file : filesToAdd) {
                file.setNotice(notice);
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