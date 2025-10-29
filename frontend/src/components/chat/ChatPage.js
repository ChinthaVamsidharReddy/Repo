import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import UserPresence from './UserPresence';
import MemberList from './MemberList';
import PinnedMessages from './PinnedMessages';
import GroupSettings from './GroupSettings';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import PollDisplay from "./PollDisplay";


const API_BASE = "http://localhost:8080/api";
const token = localStorage.getItem("token");

const ChatPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading chat...
      </div>
    );
  }

const {
  activeGroup,
  openGroup,
  closeGroup,
  getGroupMessages,
  sendMessage,
  sendTypingIndicator,
  sendTypingStopIndicator, 
  getTypingUsers,
  setActiveGroup,
  markAsRead,
  addReaction,
  votePoll,
  sendPoll
} = useChat();


  const [replyTo, setReplyTo] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [oldMessages, setOldMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);



// const messages = getGroupMessages(activeGroup);
// const typingUsers = getTypingUsers(activeGroup);

const messages = getGroupMessages(activeGroup) || [];
const typingUsers = (getTypingUsers(activeGroup) || []).filter(
  (u) => u && String(u.id) !== String(user?.id)
);



  // ✅ Fetch group info & messages + setup WebSocket subscription
  useEffect(() => {
    if (!groupId) return;

    setActiveGroup(groupId);
    markAsRead(groupId);
    fetchGroupDetails(groupId);
    fetchOldMessages(groupId);
    openGroup(groupId); // subscribe to STOMP topic
    fetchGroupPolls(groupId);

    return () => {
      closeGroup(groupId); // unsubscribe when switching groups
    };
  }, [groupId]);

  // ✅ Fetch group info
  const fetchGroupDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/groups/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGroupInfo(data);
      } else {
        console.error('Failed to fetch group details');
      }
    } catch (err) {
      console.error('Error fetching group details:', err);
    }
  };

  // ✅ Fetch old messages
  const fetchOldMessages = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat/messages/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        let data = await res.json();

      // ✅ Normalize poll messages
      data = data.map((m) => {
        if (m.type === "poll" || m.pollQuestion) {
          return {
            id: m.id,
            type: "poll",
            poll: {
              id: m.pollId || m.id,
              question: m.pollQuestion || m.content,
              options: m.pollOptions || m.options || [],
              allowMultiple: m.allowMultiple || false,
              anonymous: m.anonymous || false,
              createdAt: m.createdAt,
            },
            senderId: m.senderId,
            senderName: m.senderName,
            timestamp: m.createdAt,
          };
        }
        return m;
      });

      setOldMessages(data || []); 
      } else {
        console.error("Failed to fetch old messages:", res.status);
      }
    } catch (err) {
      console.error("Error fetching old messages:", err);
    } finally {
      setLoading(false);
    }
  };


  // ✅ Fetch existing polls for this group
const fetchGroupPolls = async (id) => {
  try {
    const res = await fetch(`http://localhost:8080/polls/group/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      const polls = await res.json();

      const formattedPolls = polls.map((poll) => ({
        id: `poll-${poll.id}`,
        type: "poll",
        poll: {
          id: poll.id,
          question: poll.question,
          options: poll.options || [],
          allowMultiple: poll.allowMultiple || false,
          anonymous: poll.anonymous || false,
          totalVotes: poll.totalVotes || 0,
          createdAt: poll.createdAt,
        },
        senderId: poll.createdBy || poll.creatorId || null,
        senderName: poll.creatorName || "Unknown",
        timestamp: poll.createdAt || new Date().toISOString(), // ✅ ensure timestamp
      }));

      // ✅ Merge polls & deduplicate
      setOldMessages((prev) => {
        const merged = [...prev];
        formattedPolls.forEach((pollMsg) => {
          const alreadyExists = merged.some(
            (m) =>
              (m.type === "poll" && m.poll?.id === pollMsg.poll.id) ||
              m.id === pollMsg.id
          );
          if (!alreadyExists) merged.push(pollMsg);
        });
        return merged;
      });
    } else {
      console.error("Failed to fetch group polls:", res.status);
    }
  } catch (err) {
    console.error("Error fetching group polls:", err);
  }
};



  // ✅ Auto-scroll to bottom when new messages appear
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, oldMessages]);

  // ✅ Send message logic — no local duplication now
  const handleSendMessage = (messageData) => {
    if (!messageData.content?.trim()) return;
    sendMessage(groupId, messageData.content);
  };

  const handleReaction = (messageId, emoji) => {
    addReaction(groupId, messageId, emoji);
  };

  const handleReply = (message) => {
    setReplyTo({
      id: message.id,
      content: message.content,
      senderName: message.senderName
    });
  };

  const handlePollVote = (pollId, optionIds) => {
    const pollMessage = messages.find(msg => msg.poll && msg.poll.id === pollId);
    if (pollMessage) {
      votePoll(groupId, pollMessage.id, pollId, optionIds);
    }
  };

  // ✅ Merge and deduplicate messages before rendering
const combinedMessages = React.useMemo(() => {
  const merged = [...oldMessages, ...messages];
  const unique = [];
  for (const msg of merged) {
    if (!unique.some((m) => m.id === msg.id)) unique.push(msg);
  }
  return unique.sort((a, b) => {
    const timeA = new Date(a.timestamp || a.createdAt).getTime();
    const timeB = new Date(b.timestamp || b.createdAt).getTime();
    return timeA - timeB;
  });
}, [oldMessages, messages]);


// ✅ Group messages by date (Today, Yesterday, or date string)
const groupMessagesByDate = (messages) => {
  const groups = {};

  messages.forEach((msg) => {
    const date = new Date(msg.timestamp || msg.createdAt);
    const today = new Date();

    let label;

    // Compare with today and yesterday
    const isToday =
      date.toDateString() === today.toDateString();

    const isYesterday =
      date.toDateString() ===
      new Date(today.setDate(today.getDate() - 1)).toDateString();

    if (isToday) label = "Today";
    else if (isYesterday) label = "Yesterday";
    else
      label = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    if (!groups[label]) groups[label] = [];
    groups[label].push(msg);
  });

  return groups;
};


  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-dark-bg">
      {/* Header */}
      <div className="bg-white dark:bg-dark-surface border-b px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-input rounded-lg transition"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600 dark:text-dark-text" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <img
                src={`https://ui-avatars.com/api/?name=${groupInfo?.name}&background=random`}
                alt="Group Avatar"
                className="h-10 w-10 rounded-full"
              />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                  {groupInfo?.name || 'Study Group'}
                </h1>
                <p className="text-xs text-gray-500 dark:text-dark-textSecondary">
                  {groupInfo?.coursename || 'General'}
                </p>
              </div>
            </div>

            <UserPresence
              groupId={groupId}
              groupName={groupInfo?.name || 'Study Group'}
              members={groupInfo?.members || []}
              
            />
          </div>
        </div>

        <div className="flex items-center gap-1">
          <MemberList
            groupId={groupId}
            groupName={groupInfo?.name || 'Study Group'}
            members={groupInfo?.members || []}
          />
          <PinnedMessages groupId={groupId} />
          <GroupSettings
            groupId={groupId}
            groupName={groupInfo?.name || 'Study Group'}
            members={groupInfo?.members || []}
          />
        </div>
      </div>

      {/* Messages Section */}
      {/* <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            Loading messages...
          </div>
        ) : combinedMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
           {combinedMessages.map((message) => {
  const currentUserId = user?.id || localStorage.getItem("userId");
  const isMine = String(message?.senderId) === String(currentUserId);

  // ✅ Handle poll messages
  if (message.type === "poll" || message.poll) {
    const poll = message.poll || message;
    return (
      <div key={`poll-${poll.id}`} className="flex flex-col items-start">
        <PollDisplay
          poll={poll}
          onVote={(pollId, optionIds) => handlePollVote(pollId, optionIds)}
          className="w-full max-w-lg"
        />
      </div>
    );
  }

  // ✅ Regular messages
  return (
    <MessageBubble
      key={message?.id || message?.timestamp}
      message={message}
      isOwn={isMine}
      onReply={handleReply}
      onReaction={handleReaction}
      onPollVote={handlePollVote}
    />
  );
})}



            {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

            <div ref={messagesEndRef} />
          </>
        )}
      </div> */}

      {/* new code here  */}

      {/* Messages Section */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              Loading messages...
            </div>
          ) : combinedMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <>
              {Object.entries(groupMessagesByDate(combinedMessages)).map(
  ([dateLabel, messagesForDate]) => (
    <div key={dateLabel}>
      {/* ✅ Date Header */}
      <div className="flex justify-center my-2">
        <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs px-3 py-1 rounded-full">
          {dateLabel}
        </span>
      </div>

      {/* ✅ Messages under this date */}
      {messagesForDate.map((message) => {
        const currentUserId = user?.id || localStorage.getItem("userId");
        const isMine = String(message?.senderId) === String(currentUserId);

        // ✅ Poll message alignment
        if (message.type === "poll" || message.poll) {
          const poll = message.poll || message;
          return (
            <div
              key={message?.id || `poll-${poll.id || poll.question}`}
              className={`flex w-full my-2 ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] md:max-w-[65%] ${
                  isMine ? "ml-auto" : ""
                }`}
              >
                <PollDisplay
                  poll={poll}
                  onVote={(pollId, optionIds) =>
                    handlePollVote(pollId, optionIds)
                  }
                  isOwn={isMine}
                  className={`shadow-md ${
                    isMine
                      ? "bg-blue-600 text-white rounded-2xl"
                      : "bg-blue-50 dark:bg-blue-900 rounded-2xl"
                  }`}
                />
              </div>
            </div>
          );
        }

        // ✅ Normal message
        return (
          <MessageBubble
            key={message?.id || message?.timestamp}
            message={message}
            isOwn={isMine}
            onReply={handleReply}
            onReaction={handleReaction}
            onPollVote={handlePollVote}
          />
        );
      })}
    </div>
  )
)}

{typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
<div ref={messagesEndRef} />

            </>
          )}
        </div>


      {/* Message Input */}
        <MessageInput
          onSendMessage={(msg) => sendMessage(activeGroup || groupId, msg.content)}
          onSendPoll={(poll) => sendPoll(activeGroup || groupId, poll)}  // ✅ ADD THIS
          onTyping={(isTyping) => {
            const gId = activeGroup || groupId;
            if (isTyping) sendTypingIndicator(gId);
            else sendTypingStopIndicator(gId);
          }}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          placeholder="Type a message..."
        />
        {/* <PollDisplay poll={poll} onVote={(pollId, optionIds) => handlePollVote(pollId, optionIds)} /> */}

    </div>
    
  );
};

export default ChatPage;
