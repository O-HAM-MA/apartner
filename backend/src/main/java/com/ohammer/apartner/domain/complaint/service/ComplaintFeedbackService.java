package com.ohammer.apartner.domain.complaint.service;

import com.ohammer.apartner.domain.complaint.dto.request.CreateComplaintFeedbackRequestDto;
import com.ohammer.apartner.domain.complaint.dto.response.AllComplaintFeedbackResponseDto;
import com.ohammer.apartner.domain.complaint.entity.Complaint;
import com.ohammer.apartner.domain.complaint.entity.ComplaintFeedback;
import com.ohammer.apartner.domain.complaint.repository.ComplaintFeedbackRepository;
import com.ohammer.apartner.domain.user.entity.User;
import com.ohammer.apartner.security.utils.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplaintFeedbackService {
    private final ComplaintFeedbackRepository complaintFeedbackRepository;
    private final ComplaintService complaintService;

    // Read
    public List<AllComplaintFeedbackResponseDto> findComplaintFeedbackByComplaintId(Long complaintId) {
        List<ComplaintFeedback> complaintFeedbackList = complaintFeedbackRepository.findByComplaintId(complaintId);

        return complaintFeedbackList.stream()
                .map(feedback->AllComplaintFeedbackResponseDto.builder()
                        .feedbackId(feedback.getId())
                        .content(feedback.getContent())
//                        .userName() 맞게 처리 필요
                        .createAt(feedback.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }


    // Create
    public ComplaintFeedback save(CreateComplaintFeedbackRequestDto complaintFeedbackRequestDto) {

        Complaint complaint = complaintService.findById(complaintFeedbackRequestDto.getComplaintId());

        // 로그인 로직에 따라 변경 필요
        User user = SecurityUtil.getCurrentUser();

        ComplaintFeedback complaintFeedback = ComplaintFeedback.builder()
                .content(complaintFeedbackRequestDto.getContent())
                .complaint(complaint)
                .user(user)
                .build();

        return complaintFeedbackRepository.save(complaintFeedback);
    }

    // Update
    public ComplaintFeedback updateComplaintFeedback(Long feedbackId, CreateComplaintFeedbackRequestDto complaintFeedbackRequestDto) throws Exception {
        ComplaintFeedback complaintFeedback = findByFeedbackId(feedbackId);

        User user = SecurityUtil.getCurrentUser();

        if(!complaintFeedback.getUser().getId().equals(user.getId())){
            throw new Exception("유저의 Id가 다릅니다.");
        }

        complaintFeedback.setContent(complaintFeedbackRequestDto.getContent());
        return complaintFeedbackRepository.save(complaintFeedback);
    }


    public ComplaintFeedback findByFeedbackId(Long feedbackId) {
        return complaintFeedbackRepository.findById(feedbackId).orElse(null);
    }

    public void deleteComplainFeedback(Long feedbackId) throws Exception {

        Long userId = complaintFeedbackRepository.findUserIdById(feedbackId);

        // 작성자와 지우는 시람비교 혹은 관리자인지
        User user = SecurityUtil.getCurrentUser();
        if(!user.getId().equals(userId)){
            throw new Exception("유저의 ID가 다릅니다");
        }
        complaintFeedbackRepository.deleteById(feedbackId);
    }
}
