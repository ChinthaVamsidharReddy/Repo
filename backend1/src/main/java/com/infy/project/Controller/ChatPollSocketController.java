package com.infy.project.Controller;

import com.infy.project.Dto.PollDTO;
import com.infy.project.Dto.PollVoteRequest;
import com.infy.project.Service.PollService;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class ChatPollSocketController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private PollService pollService;

    @MessageMapping("/chat.sendPoll")
    public void handlePoll(@Payload PollDTO pollDTO) {
    	System.out.println(pollDTO.toString());
        var saved = pollService.createPoll(pollDTO);
        var dto = pollService.convertToDTO(saved);
        messagingTemplate.convertAndSend(
                "/topic/group." + pollDTO.getGroupId(),
                new SocketPayload("poll", pollDTO.getGroupId(), dto)
        );
    }

    @MessageMapping("/chat.pollVote")
    public void handlePollVote(@Payload PollVoteRequest voteReq) {
        var updated = pollService.votePoll(voteReq);
        var dto = pollService.convertToDTO(updated);
        messagingTemplate.convertAndSend(
                "/topic/group." + voteReq.getGroupId(),
                new SocketPayload("poll_vote", voteReq.getGroupId(), dto)
        );
    }
    
 // ✅ REST API: Fetch all polls in a specific group
    @GetMapping("/group/{groupId}")
    public List<PollDTO> getPollsByGroupId(@PathVariable Long groupId) {
        return pollService.getPollsByGroupId(groupId);
    }

    // ✅ REST API: Get single poll (optional)
    @GetMapping("/{pollId}")
    public PollDTO getPollById(@PathVariable Long pollId) {
        return pollService.getPollById(pollId);
    }
}
