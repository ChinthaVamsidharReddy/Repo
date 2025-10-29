package com.infy.project.Controller;

import com.infy.project.Dto.*;
import com.infy.project.Service.ChatService;
import com.infy.project.payload.ChatPayload;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageDto message) {
        message.setTimestamp(LocalDateTime.now());
        chatService.saveMessage(message);
        System.out.println("📩 Message from " + message.getSenderName() + " in group " + message.getGroupId());
        messagingTemplate.convertAndSend(
                "/topic/group." + message.getGroupId(),
                new ChatPayload("message", message.getGroupId(), message)
        );
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload TypingNotificationDto typing) {
        System.out.println("✏️ Typing event from user " + typing.getUserName() + " in group " + typing.getGroupId());

        String eventType = typing.getType();
        messagingTemplate.convertAndSend(
            "/topic/group." + typing.getGroupId(),
            new ChatPayload(eventType, typing.getGroupId(), typing)
        );
    }




    @MessageMapping("/chat.reaction")
    public void reaction(@Payload ReactionEventDto reaction) {
        messagingTemplate.convertAndSend(
                "/topic/group." + reaction.getGroupId(),
                new ChatPayload("reaction", reaction.getGroupId(), reaction)
        );
    }

// @MessageMapping("/chat.pollVote")
// public void pollVote(@Payload PollVoteEventDto vote) {
//     messagingTemplate.convertAndSend(
//             "/topic/group." + vote.getGroupId(),
//             new ChatPayload("pollVote", vote.getGroupId(), vote)
//     );
// }
}
