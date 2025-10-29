package com.infy.project.Controller;

import com.infy.project.Dto.PollDTO;

import com.infy.project.Dto.PollDTO;

public class SocketPayload {
    private String type;     // e.g. "poll", "poll_vote", "message"
    private int groupId;  // group id as string
    private Object content;  // can be PollDTO, ChatMessageDTO, etc.

    // ✅ Constructors
    public SocketPayload() {}

    public SocketPayload(String type, int groupId, Object content) {
        this.type = type;
        this.groupId = groupId;
        this.content = content;
    }

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public int getGroupId() {
		return groupId;
	}

	public void setGroupId(int groupId) {
		this.groupId = groupId;
	}

	public Object getContent() {
		return content;
	}

	public void setContent(Object content) {
		this.content = content;
	}
    
    

    // ✅ Getters and Setters
    
    
    
}
