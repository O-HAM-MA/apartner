package com.ohammer.apartner.domain.complaint.service;

import com.ohammer.apartner.domain.complaint.dto.request.CreateComplaintRequestDto;
import com.ohammer.apartner.domain.complaint.dto.response.AllComplaintResponseDto;
import com.ohammer.apartner.domain.complaint.dto.response.CreateComplaintResponseDto;
import com.ohammer.apartner.domain.complaint.dto.response.UpdateComplaintStatusResponseDto;
import com.ohammer.apartner.domain.complaint.dto.response.UpdateStateResponseDto;
import com.ohammer.apartner.domain.complaint.entity.Complaint;
import com.ohammer.apartner.domain.complaint.repository.ComplaintRepository;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.Status;
import com.ohammer.apartner.security.utils.SecurityUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComplaintService {

    private final ComplaintRepository complaintRepository;


    // Read
    // 로그인한 유저의 민원들을 가져오는 기능
    public List<AllComplaintResponseDto> getAllMyComplaints() throws AccessDeniedException {

        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        Long userId = user.getId();

        log.info("userId : " + user.getId());

        List<Complaint> complaints = complaintRepository.findByUserId(userId);

        return complaints.stream()
                .map(complaint -> AllComplaintResponseDto.builder()
                        .id(complaint.getId())
                        .title(complaint.getTitle())
                        .category(complaint.getCategory())
                        .createdAt(complaint.getCreatedAt())
                        .content(complaint.getContent())
                        .complaintStatus(complaint.getComplaintStatus().name())
                        .build())
                .collect(Collectors.toList());
    }


    // Read
    @Transactional(readOnly = true)
    public List<AllComplaintResponseDto> getAllComplaints() throws AccessDeniedException {

        // 로그인한 유저의 권한 확인 로직
        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        Set<Role> userRoles = user.getRoles();

        boolean hasRequiredRole = userRoles.stream()
                .anyMatch(role -> role == Role.ADMIN || role == Role.MANAGER);

        if (!hasRequiredRole) {
            throw new AccessDeniedException("전체 민원 목록을 조회할 권한이 없습니다.");
        }

        List<Complaint> complaints = complaintRepository.findAll();

        return complaints.stream()
                .map(complaint -> AllComplaintResponseDto.builder()
                        .id(complaint.getId())
                        .title(complaint.getTitle())
                        .category(complaint.getCategory())
                        .status(complaint.getStatus().name())
                        .content(complaint.getContent())
                        .complaintStatus(complaint.getComplaintStatus().name())
                        .createdAt(complaint.getCreatedAt())
                        .userName(complaint.getUser().getUserName())
                        .build())
                .collect(Collectors.toList());
    }

    // Read
    public Complaint findById(Long complaintId){
        return complaintRepository.findById(complaintId).orElse(null);
    }


    // Read
    public List<AllComplaintResponseDto> getAllComplaintsByStatus(Long status) throws AccessDeniedException {
        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        Set<Role> userRoles = user.getRoles();

        boolean hasRequiredRole = userRoles.stream()
                .anyMatch(role -> role == Role.ADMIN || role == Role.MANAGER);

        if (!hasRequiredRole) {
            throw new AccessDeniedException("전체 민원 목록을 조회할 권한이 없습니다.");
        }

        Complaint.ComplaintStatus state = mapStatus(status);
        if (state == null) {
            throw new IllegalArgumentException("유효하지 않은 상태값입니다: " + status);
        }

        // Repository에서 상태별 조회
        List<Complaint> complaints = complaintRepository.findByStatus(state);

        // DTO 변환
        return complaints.stream()
                .map(response -> AllComplaintResponseDto.builder()
                        .id(response.getId())
                        .title(response.getTitle())
                        .category(response.getCategory())
                        .status(response.getStatus().name())
                        .createdAt(response.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // Create
    public CreateComplaintResponseDto createComplaint(CreateComplaintRequestDto requestDto) {

        // 유저 찾는 로직
        User user = SecurityUtil.getCurrentUser();

        Complaint complaint = Complaint.builder()
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .category(requestDto.getCategory())
                .user(user)
                .complaintStatus(Complaint.ComplaintStatus.PENDING)
                .status(Status.ACTIVE)
                .build();

        log.info("user Id : {}", user.getId());

        complaintRepository.save(complaint);

        return CreateComplaintResponseDto.builder()
                .id(complaint.getId())
                .title(complaint.getTitle())
                .content(complaint.getContent())
                .category(complaint.getCategory())
                .userId(user.getId())
                .createdAt(complaint.getCreatedAt())
                .build();
    }


    // Update
    @Transactional
    public CreateComplaintResponseDto updateComplaint(CreateComplaintRequestDto requestDto, Long complaintId) throws AccessDeniedException {

        // 유저 찾기
        User user = SecurityUtil.getCurrentUser();

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 민원을 찾을 수 없습니다: " + complaintId));

        if (!user.getId().equals(complaint.getUser().getId())) {
            throw new AccessDeniedException("해당 민원을 수정할 권한이 없습니다.");
        }

        complaint.setTitle(requestDto.getTitle());
        complaint.setContent(requestDto.getContent());
        complaint.setCategory(requestDto.getCategory());

        complaintRepository.save(complaint);

        return CreateComplaintResponseDto.builder()
                .id(complaint.getId())
                .title(complaint.getTitle())
                .content(complaint.getContent())
                .category(complaint.getCategory())
                .userId(user.getId())
                .createdAt(complaint.getCreatedAt())
                .build();
    }

    // Update
    @Transactional
    public UpdateComplaintStatusResponseDto updateStatus(Long complaintId, Long status) throws Exception {

        Complaint complaint = complaintRepository.findById(complaintId).orElseThrow(()->new Exception("컴플레인을 찾을 수 없습니다."));

        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        Set<Role> userRoles = user.getRoles();

        boolean hasRequiredRole = userRoles.stream()
                .anyMatch(role -> role == Role.ADMIN);

        if (!hasRequiredRole) {
            throw new AccessDeniedException("민원 상태를 변경할 권한이 없습니다.");
        }

        complaint.setComplaintStatus(mapStatus(status));

        complaintRepository.save(complaint);

        return UpdateComplaintStatusResponseDto.builder()
                .id(complaint.getId())
                .content(complaint.getContent())
                .title(complaint.getTitle())
                .build();
    }

    @Transactional
    public UpdateStateResponseDto inactiveComplaint(Long complaintId) throws Exception {

        Complaint complaint = complaintRepository.findById(complaintId).orElseThrow(()->new Exception("컴플레인을 찾을 수 없습니다."));

        User user = SecurityUtil.getCurrentUser();
        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        Set<Role> userRoles = user.getRoles();

        boolean hasRequiredRole = userRoles.stream()
                .anyMatch(role -> role == Role.ADMIN);

        if (!hasRequiredRole) {
            throw new AccessDeniedException("민원 상태를 변경할 권한이 없습니다.");
        }

        complaint.setStatus(Status.INACTIVE);
        complaintRepository.save(complaint);

        return UpdateStateResponseDto.builder()
                .id(complaint.getId())
                .title(complaint.getTitle())
                .state(complaint.getStatus())
                .build();
    }

    // delete
    @Transactional
    public void deleteComplaint(Long complaintId) throws AccessDeniedException {

        Optional<Complaint> complaint = complaintRepository.findById(complaintId);
        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        // 예외 처리
        if(complaint.isEmpty()) {
            throw new RuntimeException("Complaint not found with id: " + complaintId);
        }

        // 작성자와 id 비교 예외 처리 or 관리자라면 삭제 가능하게
        if(!complaint.get().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("User is not authorized to delete this complaint");
        }

        complaintRepository.deleteById(complaintId);
    }


    // 상태 매핑 매서드
    private Complaint.ComplaintStatus mapStatus(Long statusCode) {
        return switch (statusCode.intValue()) {
            case 1 -> Complaint.ComplaintStatus.PENDING;
            case 2 -> Complaint.ComplaintStatus.IN_PROGRESS;
            case 3 -> Complaint.ComplaintStatus.COMPLETED;
            case 4 -> Complaint.ComplaintStatus.REJECTED;
            default -> null;
        };
    }
}
