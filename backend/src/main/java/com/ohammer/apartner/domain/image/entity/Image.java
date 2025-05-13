package com.ohammer.apartner.domain.image.entity;

import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@AllArgsConstructor
@NoArgsConstructor
@SuperBuilder
@ToString
public class Image extends BaseEntity {

    @OneToOne(mappedBy = "profileImage")
    private User user; // 유저와 연결된 프로필 이미지 (1:1 관계)

    @Lob // 대용량 데이터를 매핑할 때 사용됩니다. 주로 텍스트나 바이너리 데이터를 저장할 때 사용 , TEXT 타입
    private String filePath; // 이미지 경로 (TEXT 타입)

    @Column(name = "temp_id", length = 100)
    private String tempId; // 임시 이미지 식별자

    @Column(nullable = false)
    private Boolean isTemp;    // true면 임시 저장된 이미지

    @Column(nullable = false)
    private Boolean isDeleted; // soft-delete 여부

    @Column(nullable = false)
    private String originalName;

    @Column(nullable = false)
    private String storedName;

    @Column(nullable = false)
    private String path;

    @Column(nullable = false)
    private Long size;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private boolean isTemporary;

    @Column
    private LocalDateTime expiresAt;

    @Column
    private String s3Key;

    public Image(String originalName, String storedName, String path, Long size, String contentType,
                 boolean isTemporary, String tempId, String s3Key) {
        this.originalName = originalName;
        this.storedName = storedName;
        this.path = path;
        this.size = size;
        this.contentType = contentType;
        this.isTemporary = isTemporary;
        this.tempId = tempId;
        this.s3Key = s3Key;
        if (isTemporary) {
            this.expiresAt = LocalDateTime.now().plusHours(24);
        }
    }

    public String getS3Key() {
        return this.s3Key;
    }
}