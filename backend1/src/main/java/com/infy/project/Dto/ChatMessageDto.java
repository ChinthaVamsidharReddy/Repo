package com.infy.project.Dto;

import java.time.LocalDateTime;

public class ChatMessageDto {
    private Long id;
    private Long groupId;
    private Long senderId;
    private String senderName;
    private String content;
    private LocalDateTime timestamp;
    private String type;

    // ✅ No-args constructor
    public ChatMessageDto() {
    }

    // ✅ All-args constructor (used in Service mapping)
    public ChatMessageDto(Long id, Long groupId, Long senderId, String senderName, String content, LocalDateTime timestamp) {
        this.id = id;
        this.groupId = groupId;
        this.senderId = senderId;
        this.senderName = senderName;
        this.content = content;
        this.timestamp = timestamp;
    }

    // ✅ Getters and Setters
    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }

    public Long getGroupId() {
        return groupId;
    }
    public void setGroupId(Long groupId) {
        this.groupId = groupId;
    }

    public Long getSenderId() {
        return senderId;
    }
    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }
    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getContent() {
        return content;
    }
    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }
    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getType() {
        return type;
    }
    public void setType(String type) {
        this.type = type;
    }
}
