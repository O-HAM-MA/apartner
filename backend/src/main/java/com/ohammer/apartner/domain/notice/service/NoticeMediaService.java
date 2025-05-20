package com.ohammer.apartner.domain.notice.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.ohammer.apartner.domain.image.entity.Image;
import com.ohammer.apartner.domain.image.repository.ImageRepository;
import com.ohammer.apartner.domain.image.util.FileUtils;
import com.ohammer.apartner.domain.notice.entity.NoticeFile;
import com.ohammer.apartner.domain.notice.repository.NoticeFileRepository;
import java.io.IOException;
import java.time.LocalDateTime;
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
public class NoticeMediaService {

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private final AmazonS3 amazonS3;
    private final ImageRepository imageRepository;
    private final NoticeFileRepository noticeFileRepository;

    public List<Long> uploadImages(Long noticeId, List<MultipartFile> files) {
        List<Long> ids = new ArrayList<>();

        for (MultipartFile file : files) {
            String originalName = file.getOriginalFilename();
            String storedName = FileUtils.createFileName(originalName);
            String extension = FileUtils.extractFileExtension(originalName);
            String contentType = FileUtils.determineContentType(extension);
            String path = "notice/" + noticeId + "/images/" + storedName;

            // S3 업로드
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(contentType);

            try {
                amazonS3.putObject(new PutObjectRequest(bucket, path, file.getInputStream(), metadata));
            } catch (IOException e) {
                throw new RuntimeException("이미지 업로드 실패", e);
            }

            Image image = Image.builder()
                    .originalName(originalName)
                    .storedName(storedName)
                    .path(path)
                    .size(file.getSize())
                    .contentType(contentType)
                    .s3Key(path)
                    .isTemporary(true)
                    .isDeleted(false)
                    .isTemp(true)
                    .expiresAt(LocalDateTime.now().plusHours(24))
                    .build();

            ids.add(imageRepository.save(image).getId());
        }

        return ids;
    }

    public List<Long> uploadFiles(Long noticeId, List<MultipartFile> files) {
        List<Long> ids = new ArrayList<>();

        for (MultipartFile file : files) {
            String originalName = file.getOriginalFilename();
            String storedName = FileUtils.createFileName(originalName);
            String extension = FileUtils.extractFileExtension(originalName);
            String contentType = FileUtils.determineContentType(extension);
            String path = "notice/" + noticeId + "/files/" + storedName;

            // S3 업로드
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(file.getSize());
            metadata.setContentType(contentType);

            try {
                amazonS3.putObject(new PutObjectRequest(bucket, path, file.getInputStream(), metadata));
            } catch (IOException e) {
                throw new RuntimeException("파일 업로드 실패", e);
            }

            NoticeFile noticeFile = NoticeFile.builder()
                    .originalName(originalName)
                    .storedName(storedName)
                    .path(path)
                    .size(file.getSize())
                    .contentType(contentType)
                    .s3Key(path)
                    .build();

            ids.add(noticeFileRepository.save(noticeFile).getId());
        }

        return ids;
    }

    public void deleteImage(Long noticeImageId) {
        Image image = imageRepository.findById(noticeImageId)
                .orElseThrow(() -> new IllegalArgumentException("이미지를 찾을 수 없습니다."));

        amazonS3.deleteObject(bucket, image.getS3Key());
        imageRepository.delete(image);
    }

    public void deleteFile(Long fileId) {
        NoticeFile file = noticeFileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("파일을 찾을 수 없습니다."));

        amazonS3.deleteObject(bucket, file.getS3Key());
        noticeFileRepository.delete(file);
    }
}