// com/infy/project/Service/ChatService.java
package com.infy.project.Service;

import com.infy.project.Dto.ChatMessageDto;
import com.infy.project.model.ChatMessage;
import com.infy.project.Interface.ChatMessageRepository;
import com.infy.project.Interface.MessageRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private ChatMessageRepository chatMessageRepository;
    

    public void saveMessage(ChatMessageDto messageDto) {
        ChatMessage message = new ChatMessage();
        message.setGroupId(messageDto.getGroupId());
        message.setSenderId(messageDto.getSenderId());
        message.setSenderName(messageDto.getSenderName());
        message.setContent(messageDto.getContent());
        message.setTimestamp(messageDto.getTimestamp());
        chatMessageRepository.save(message);
    }

    public List<ChatMessageDto> getMessagesByGroupId(Long groupId) {
        return chatMessageRepository.findByGroupIdOrderByTimestampAsc(groupId)
                .stream()
                .map(msg -> new ChatMessageDto(
                        msg.getId(),
                        msg.getGroupId(),
                        msg.getSenderId(),
                        msg.getSenderName(),
                        msg.getContent(),
                        msg.getTimestamp()
                ))
                .collect(Collectors.toList());
    }
}
