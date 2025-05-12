package com.ohammer.apartner.domain.complaint.service;

import com.ohammer.apartner.domain.complaint.dto.request.CreateComplaintRequestDto;
import com.ohammer.apartner.domain.complaint.dto.response.AllComplaintResponseDto;
import com.ohammer.apartner.domain.complaint.entity.Complaint;
import com.ohammer.apartner.domain.complaint.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintService {

    private final ComplaintRepository complaintRepository;

    public List<AllComplaintResponseDto> getAllMyComplaints(Long userId) {

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

    public List<AllComplaintResponseDto> getAllComplaints() {

        // 로그인한 유저의 권한 확인 로직

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

    public Complaint createComplaint(Long userId, CreateComplaintRequestDto requestDto) {

        // 유저 찾는 로직
//        User user = userRepository.findById(userId);

        Complaint complaint = Complaint.builder()
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .category(requestDto.getCategory())
//                .user(user)
                .status(Complaint.Status.PENDING)
                .build();

        return complaintRepository.save(complaint);
    }

    public Complaint updateComplaint(Long userId, CreateComplaintRequestDto requestDto) {
        // 유저 찾는 로직
//        User user = userRepository.findById(userId);

        // 예외 처리
//        if(!user.getId().equals(userId)){
//            throw new Exception()
//        }

        // 저장
        Complaint complaint = Complaint.builder()
                .title(requestDto.getTitle())
                .content(requestDto.getContent())
                .category(requestDto.getCategory())
                .status(Complaint.Status.PENDING)
                .build();

        return complaintRepository.save(complaint);
    }

    public Complaint updateStatus(Long comlaintId, Long status) {

        Complaint complaint = complaintRepository.findById(comlaintId).orElse(null);

        Complaint.Status state = null;

        // 조건문에 따라 상태 변경
//        if(status == 1){
//          state = Complaint.Status.PENDING;
//        }

        complaint.setStatus(state);

        return complaintRepository.save(complaint);
    }

    public void deleteComplaint(Long complaintId, Long userId) {

        Optional<Complaint> complaint = complaintRepository.findById(complaintId);

        // 예외 처리
        if(!complaint.isPresent()) {
            throw new RuntimeException("Complaint not found with id: " + complaintId);
        }

        // 작성자와 id 비교 예외 처리 or 관리자라면 삭제 가능하게
        if(!complaint.get().getUser().getId().equals(userId)) {
            throw new RuntimeException("User is not authorized to delete this complaint");
        }

        complaintRepository.deleteById(complaintId);
    }
}
