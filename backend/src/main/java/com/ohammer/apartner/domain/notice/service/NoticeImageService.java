package com.ohammer.apartner.domain.notice.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.ohammer.apartner.domain.image.entity.Image;
import com.ohammer.apartner.domain.image.repository.ImageRepository;
import com.ohammer.apartner.domain.image.util.FileUtils;
import com.ohammer.apartner.domain.notice.entity.Notice;
import com.ohammer.apartner.domain.notice.entity.NoticeImage;
import com.ohammer.apartner.domain.notice.repository.NoticeImageRepository;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeImageService {

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private final AmazonS3 amazonS3;
    private final ImageRepository imageRepository;
    private final NoticeImageRepository noticeImageRepository;

    @Transactional
    public List<NoticeImage> uploadNoticeImages(List<MultipartFile> images, Notice notice) {
        List<NoticeImage> result = new ArrayList<>();

        for (MultipartFile file : images) {
            String originalName = file.getOriginalFilename();
            String extension = FileUtils.extractFileExtension(originalName);
            String storedName = FileUtils.createFileName(originalName);
            String key = "notice/images/" + storedName;
            String contentType = FileUtils.determineContentType(extension);

            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(contentType);

            try {
                amazonS3.putObject(new PutObjectRequest(bucket, key, file.getInputStream(), metadata)
                        .withCannedAcl(CannedAccessControlList.PublicRead));
            } catch (IOException e) {
                throw new RuntimeException("이미지 업로드 실패", e);
            }

            String url = amazonS3.getUrl(bucket, key).toString();
            Image image = imageRepository.save(Image.builder()
                    .originalName(originalName)
                    .storedName(storedName)
                    .path(key)
                    .filePath(url)
                    .contentType(contentType)
                    .size(file.getSize())
                    .isDeleted(false)
                    .isTemp(false)
                    .build());

            NoticeImage noticeImage = noticeImageRepository.save(NoticeImage.builder()
                    .notice(notice)
                    .image(image)
                    .build());

            result.add(noticeImage);
        }

        return result;
    }

}