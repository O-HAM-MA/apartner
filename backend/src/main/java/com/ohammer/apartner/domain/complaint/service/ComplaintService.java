package com.ohammer.apartner.domain.complaint.service;

import com.ohammer.apartner.domain.complaint.dto.request.CreateComplaintRequestDto;
import com.ohammer.apartner.domain.complaint.dto.response.AllComplaintResponseDto;
import com.ohammer.apartner.domain.complaint.dto.response.UpdateComplaintStatusResponseDto;
import com.ohammer.apartner.domain.complaint.entity.Complaint;
import com.ohammer.apartner.domain.complaint.repository.ComplaintRepository;
import com.ohammer.apartner.domain.user.entity.Role;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.utils.SecurityUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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
                        .status(complaint.getStatus().name())
                        .createdAt(complaint.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }


    // Read
    public List<AllComplaintResponseDto> getAllComplaints() throws AccessDeniedException {

        // 로그인한 유저의 권한 확인 로직
        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        Set<Role> userRoles = user.getRoles();

        boolean hasRequiredRole = userRoles.stream()
                .anyMatch(role -> role == Role.ADMIN || role == Role.MODERATOR);

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
                        .createdAt(complaint.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // Read
    public Complaint findById(Long complaintId){
        return complaintRepository.findById(complaintId).orElse(null);
    }

    // Create
    public CreateComplaintRequestDto createComplaint(CreateComplaintRequestDto requestDto) {

        // 유저 찾는 로직
        User user = SecurityUtil.getCurrentUser();

        Complaint complaint = Complaint.builder()
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .category(requestDto.getCategory())
                .user(user)
                .status(Complaint.Status.PENDING)
                .build();

        log.info("user Id : {}", user.getId());

        complaintRepository.save(complaint);

        return requestDto;
    }


    // Update
    public CreateComplaintRequestDto updateComplaint(CreateComplaintRequestDto requestDto, Long complaintId) throws AccessDeniedException {

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

        return requestDto;
    }

    // Update
    public UpdateComplaintStatusResponseDto updateStatus(Long comlaintId, Long status) throws Exception {

        Complaint complaint = complaintRepository.findById(comlaintId).orElseThrow(()->new Exception("컴플레인을 찾을 수 없습니다."));

        Complaint.Status state = null;

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

        // 조건문에 따라 상태 변경
        if(status == 1){
          state = Complaint.Status.PENDING;
        } else if (status == 2) {
            state = Complaint.Status.IN_PROGRESS;
        }else if(status == 3){
            state = Complaint.Status.COMPLETED;
        }else if(status == 4){
            state = Complaint.Status.REJECTED;
        }

        complaint.setStatus(state);

        complaintRepository.save(complaint);

        return UpdateComplaintStatusResponseDto.builder()
                .id(complaint.getId())
                .content(complaint.getContent())
                .title(complaint.getTitle())
                .build();
    }

    // delete
    public void deleteComplaint(Long complaintId) {

        Optional<Complaint> complaint = complaintRepository.findById(complaintId);
        User user = SecurityUtil.getCurrentUser();

        // 예외 처리
        if(!complaint.isPresent()) {
            throw new RuntimeException("Complaint not found with id: " + complaintId);
        }

        // 작성자와 id 비교 예외 처리 or 관리자라면 삭제 가능하게
        if(!complaint.get().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("User is not authorized to delete this complaint");
        }

        complaintRepository.deleteById(complaintId);
    }

}
