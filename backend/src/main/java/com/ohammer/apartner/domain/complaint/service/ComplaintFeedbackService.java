package com.ohammer.apartner.domain.complaint.service;

import com.ohammer.apartner.domain.complaint.dto.request.CreateComplaintFeedbackRequestDto;
import com.ohammer.apartner.domain.complaint.dto.request.UpdateComplaintFeedbackRequestDto;
import com.ohammer.apartner.domain.complaint.dto.response.AllComplaintFeedbackResponseDto;
import com.ohammer.apartner.domain.complaint.dto.response.CreateComplaintFeedbackResponseDto;
import com.ohammer.apartner.domain.complaint.dto.response.CreateComplaintResponseDto;
import com.ohammer.apartner.domain.complaint.dto.response.UpdateComplaintFeedbackResponseDto;
import com.ohammer.apartner.domain.complaint.entity.Complaint;
import com.ohammer.apartner.domain.complaint.entity.ComplaintFeedback;
import com.ohammer.apartner.domain.complaint.repository.ComplaintFeedbackRepository;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.global.service.AlarmService;
import com.ohammer.apartner.security.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;  
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.AccessDeniedException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintFeedbackService {
    private final ComplaintFeedbackRepository complaintFeedbackRepository;
    private final ComplaintService complaintService;
    private final AlarmService alarmService;

    // Read
    public List<AllComplaintFeedbackResponseDto> findComplaintFeedbackByComplaintId(Long complaintId) throws AccessDeniedException {
        List<ComplaintFeedback> complaintFeedbackList = complaintFeedbackRepository.findByComplaintId(complaintId);

        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        return complaintFeedbackList.stream()
                .map(feedback->AllComplaintFeedbackResponseDto.builder()
                        .feedbackId(feedback.getId())
                        .content(feedback.getContent())
                        .userName(user.getUserName())
                        .createAt(feedback.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }


    // Create
    @Transactional
    public CreateComplaintFeedbackResponseDto save(CreateComplaintFeedbackRequestDto complaintFeedbackRequestDto) throws AccessDeniedException {

        Complaint complaint = complaintService.findById(complaintFeedbackRequestDto.getComplaintId());


        // 로그인 로직에 따라 변경 필요
        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        ComplaintFeedback complaintFeedback = ComplaintFeedback.builder()
                .content(complaintFeedbackRequestDto.getContent())
                .complaint(complaint)
                .user(user)
                .build();

        complaintFeedbackRepository.save(complaintFeedback);
        
        // 민원 작성자에게 피드백 등록 알림 전송
        Long apartmentId = complaint.getUser().getApartment().getId();
        if (apartmentId != null) {
            alarmService.notifyUser(
                complaint.getUser().getId(),
                apartmentId,
                "민원 답변 등록",
                "info",
                "COMPLAINT",
                complaint.getTitle() + "에 새 답변이 등록되었습니다.",
                null,
                complaint.getId(),
                null,
                null
            );
        }

        return CreateComplaintFeedbackResponseDto.builder()
                .id(complaintFeedback.getId())
                .content(complaintFeedback.getContent())
                .userId(user.getId())
                .createdAt(complaintFeedback.getCreatedAt())
                .build();
    }

    // Update
    public UpdateComplaintFeedbackResponseDto updateComplaintFeedback(Long feedbackId, UpdateComplaintFeedbackRequestDto complaintFeedbackRequestDto) throws Exception {

        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        ComplaintFeedback complaintFeedback = findByFeedbackId(feedbackId);

        if(complaintFeedback == null) {
            throw new Exception("해당하는 민원 피드백이 없습니다.");
        }

        if(!complaintFeedback.getUser().getId().equals(user.getId())){
            throw new Exception("유저의 Id가 다릅니다.");
        }

        complaintFeedback.setContent(complaintFeedbackRequestDto.getContent());
        
        complaintFeedbackRepository.save(complaintFeedback);
        
        // 민원 작성자에게 피드백 수정 알림 전송
        Complaint complaint = complaintFeedback.getComplaint();
        Long apartmentId = complaint.getUser().getApartment().getId();
        if (apartmentId != null) {
            alarmService.notifyUser(
                complaint.getUser().getId(),
                apartmentId,
                "민원 답변 수정",
                "success",
                "COMPLAINT",
                complaint.getTitle() + "의 답변이 수정되었습니다.",
                null,
                complaint.getId(),
                null,
                null
            );
        }

        return UpdateComplaintFeedbackResponseDto.builder()
                .id(complaintFeedback.getId())
                .content(complaintFeedback.getContent())
                .userId(user.getId())
                .createdAt(complaintFeedback.getCreatedAt())
                .build();
    }


    public ComplaintFeedback findByFeedbackId(Long feedbackId) {
        return complaintFeedbackRepository.findById(feedbackId).orElse(null);
    }

    public void deleteComplainFeedback(Long feedbackId) throws Exception {

        // 작성자와 지우는 시람비교 혹은 관리자인지
        User user = SecurityUtil.getCurrentUser();

        if (user == null) {
            throw new AccessDeniedException("로그인되지 않은 사용자입니다.");
        }

        ComplaintFeedback cf = findByFeedbackId(feedbackId);
        
        if (cf == null) {
            throw new Exception("해당하는 민원 피드백이 없습니다.");
        }

        if(!user.getId().equals(cf.getUser().getId())){
            throw new Exception("유저의 ID가 다릅니다");
        }
        
        // 민원 작성자에게 피드백 삭제 알림 전송
        Complaint complaint = cf.getComplaint();
        Long apartmentId = complaint.getUser().getApartment().getId();
        if (apartmentId != null) {
            alarmService.notifyUser(
                complaint.getUser().getId(),
                apartmentId,
                "민원 답변 삭제",
                "warning",
                "COMPLAINT",
                complaint.getTitle() + "의 답변이 삭제되었습니다.",
                null,
                complaint.getId(),
                null,
                null
            );
        }
        
        complaintFeedbackRepository.deleteById(feedbackId);
    }
}
