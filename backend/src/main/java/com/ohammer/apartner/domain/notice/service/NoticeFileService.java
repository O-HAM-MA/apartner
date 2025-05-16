package com.ohammer.apartner.domain.notice.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.ohammer.apartner.domain.image.util.FileUtils;
import com.ohammer.apartner.domain.notice.entity.Notice;
import com.ohammer.apartner.domain.notice.entity.NoticeFile;
import com.ohammer.apartner.domain.notice.repository.NoticeFileRepository;
import com.ohammer.apartner.domain.notice.repository.NoticeRepository;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeFileService {

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private final AmazonS3 amazonS3;
    private final NoticeFileRepository noticeFileRepository;
    private final NoticeRepository noticeRepository;

    @Transactional
    public void uploadNoticeFiles(List<MultipartFile> files, Long noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new RuntimeException("공지사항을 찾을 수 없습니다."));

        for (MultipartFile file : files) {
            String originalName = file.getOriginalFilename();
            String extension = FileUtils.extractFileExtension(originalName);
            String storedName = FileUtils.createFileName(originalName);
            String key = "notice/files/" + storedName;
            String contentType = FileUtils.determineContentType(extension);

            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(contentType);

            try {
                amazonS3.putObject(new PutObjectRequest(bucket, key, file.getInputStream(), metadata)
                        .withCannedAcl(CannedAccessControlList.PublicRead));
            } catch (IOException e) {
                throw new RuntimeException("파일 업로드 실패", e);
            }

            String url = amazonS3.getUrl(bucket, key).toString();

            NoticeFile noticeFile = noticeFileRepository.save(NoticeFile.builder()
                    .notice(notice)
                    .originalName(originalName)
                    .storedName(storedName)
                    .path(url)
                    .contentType(contentType)
                    .size(file.getSize())
                    .s3Key(key)
                    .build());

            // Notice 엔티티의 files 리스트에 NoticeFile 추가
            notice.getFiles().add(noticeFile);
        }
    }

}
