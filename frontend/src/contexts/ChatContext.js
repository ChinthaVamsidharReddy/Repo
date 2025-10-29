// src/context/ChatContext.js
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const ChatContext = createContext();
export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);

  const [messages, setMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});
  const [unreadCount, setUnreadCount] = useState({});

  const stompRef = useRef(null);
  const subscriptionsRef = useRef({});
  const messageQueueRef = useRef([]);
  const subQueueRef = useRef(new Set());
  const typingTimeoutRef = useRef({});

  const SOCKJS_URL =
    process.env.REACT_APP_WS_URL || "http://localhost:8080/ws/chat";

  /* ---------------------- STOMP Connection ---------------------- */
  const connectStomp = () => {
    if (stompRef.current && stompRef.current.connected) {
      console.log("[chat] STOMP already connected - reuse");
      return;
    }

    const token = localStorage.getItem("token") || "";

    const socketFactory = () => new SockJS(SOCKJS_URL);
    const client = new Client({
      webSocketFactory: socketFactory,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (msg) => {
        if (msg && typeof msg === "string") console.log("[STOMP]", msg);
      },
    });

    client.connectHeaders = { Authorization: token ? `Bearer ${token}` : "" };

    client.onConnect = (frame) => {
      console.log("[chat] ✅ STOMP connected:", frame?.headers);
      stompRef.current = client;
      setConnected(true);

      // Resubscribe to queued groups
      if (subQueueRef.current.size > 0) {
        subQueueRef.current.forEach((gId) => _subscribeToGroup(gId));
        subQueueRef.current.clear();
      }

      // Flush queued messages
      if (messageQueueRef.current.length > 0) {
        messageQueueRef.current.forEach(({ destination, body }) => {
          try {
            client.publish({ destination, body });
          } catch (err) {
            console.error("[chat] publish failed during flush", err);
          }
        });
        messageQueueRef.current = [];
      }
    };

    client.onWebSocketClose = () => setConnected(false);
    client.onDisconnect = () => setConnected(false);
    client.onStompError = (frame) =>
      console.error("[chat] ❌ Broker error:", frame?.headers?.message || frame);

    stompRef.current = client;
    client.activate();
  };

  useEffect(() => {
    if (!user?.id && !localStorage.getItem("token")) return;
    connectStomp();

    return () => {
      const client = stompRef.current;
      if (client) {
        Object.values(subscriptionsRef.current).forEach((sub) =>
          sub.unsubscribe?.()
        );
        subscriptionsRef.current = {};
        if (client.active) client.deactivate();
      }
      stompRef.current = null;
      setConnected(false);
      messageQueueRef.current = [];
      subQueueRef.current.clear();
    };
  }, [user?.id]);

  /* ---------------------- Helper: Add Message ---------------------- */
  const addMessage = (groupId, msg) => {
    setMessages((prev) => {
      const arr = Array.isArray(prev[groupId]) ? [...prev[groupId]] : [];

      const exists = arr.some(
        (m) =>
          (m.id && msg.id && String(m.id) === String(msg.id)) ||
          (m.content === msg.content &&
            m.timestamp === msg.timestamp &&
            m.senderId === msg.senderId)
      );
      if (exists) return prev;

      arr.push(msg);
      return { ...prev, [groupId]: arr };
    });
  };

  /* ---------------------- Group Subscription ---------------------- */
  const _subscribeToGroup = (groupId) => {
    const client = stompRef.current;
    if (!client || !client.connected) {
      subQueueRef.current.add(groupId);
      return;
    }
    if (subscriptionsRef.current[groupId]) return;

    console.log(`[chat] 🔹 Subscribing to /topic/group.${groupId}`);
    const sub = client.subscribe(`/topic/group.${groupId}`, (msg) => {
      try {
        const payload = JSON.parse(msg.body); // ✅ define payload FIRST
        handleIncoming(payload);
      } catch (err) {
        console.error("[chat] Invalid message payload", err);
      }
    });

    subscriptionsRef.current[groupId] = sub;
  };

  const unsubscribeGroup = (groupId) => {
    const sub = subscriptionsRef.current[groupId];
    if (sub) sub.unsubscribe?.();
    delete subscriptionsRef.current[groupId];
    subQueueRef.current.delete(groupId);
    if (activeGroup === groupId) setActiveGroup(null);
    console.log("[chat] 🔹 Unsubscribed from", groupId);
  };

  /* ---------------------- Message Handling ---------------------- */
  const handleIncoming = (payload) => {
    console.log("📥 [Chat] Incoming:", payload);
    const { type, groupId } = payload;
    if (!groupId && groupId !== 0) return;

    switch (type) {
      case "message": {
        const msg = payload.message;
        if (!msg?.senderId) return;

        setMessages((prev) => {
          const arr = Array.isArray(prev[groupId]) ? [...prev[groupId]] : [];

          const duplicate = arr.some(
            (m) =>
              (m.id && msg.id && String(m.id) === String(msg.id)) ||
              (m.localOnly &&
                m.content === msg.content &&
                String(m.senderId) === String(msg.senderId) &&
                Math.abs(new Date(msg.timestamp) - new Date(m.timestamp)) < 1500)
          );
          if (duplicate) return prev;

          const filtered = arr.filter(
            (m) =>
              !(
                m.localOnly &&
                m.content === msg.content &&
                String(m.senderId) === String(msg.senderId)
              )
          );

          filtered.push({ ...msg, localOnly: false });
          return { ...prev, [groupId]: filtered };
        });

        if (activeGroup !== groupId) {
          setUnreadCount((prev) => ({
            ...prev,
            [groupId]: (prev[groupId] || 0) + 1,
          }));
        }
        break;
      }

      case "typing": {
        const tUser = payload.message || payload;
        if (!tUser?.userId || tUser.userId === user?.id) return;

        const normalizedUser = {
          userId: String(tUser.userId),
          userName: tUser.userName || tUser.username || tUser.name || "Someone",
        };

        setTypingUsers((prev) => {
          const existing = prev[groupId] || [];
          const updated = [
            ...existing.filter((u) => u.userId !== normalizedUser.userId),
            normalizedUser,
          ];
          return { ...prev, [groupId]: updated };
        });
        break;
      }

      case "typing_stop": {
        const tUser = payload.message || payload;
        if (!tUser?.userId) return;
        setTypingUsers((prev) => ({
          ...prev,
          [groupId]: (prev[groupId] || []).filter(
            (u) => u.userId !== String(tUser.userId)
          ),
        }));
        break;
      }

      // case "poll": {
      //   const pollData = payload.content || payload;
      //   if (!pollData) return;

      //   setMessages((prev) => {
      //     const arr = Array.isArray(prev[groupId]) ? [...prev[groupId]] : [];
      //     const exists = arr.some(
      //       (m) => m.type === "poll" && String(m.poll?.id) === String(pollData.id)
      //     );
      //     if (exists) return prev;
      //     arr.push({
      //       id: `poll-${pollData.id || Date.now()}`,
      //       type: "poll",
      //       poll: pollData,
      //     });
      //     return { ...prev, [groupId]: arr };
      //   });
      //   break;
      // }


//       case "poll": {
//   // server payload might be payload.message or payload.content etc — normalize
//   const pollData = (payload.message && payload.message.poll) ? payload.message.poll : (payload.content || payload.poll || payload);
//   if (!pollData) return;

//   setMessages((prev) => {
//     const arr = Array.isArray(prev[groupId]) ? [...prev[groupId]] : [];

//     // If server poll has an id, try to find & replace a matching optimistic poll (match by question + senderName)
//     if (pollData.id) {
//       const matchIndex = arr.findIndex(
//         (m) =>
//           m.type === "poll" &&
//           (m.localOnly === true) &&
//           String(m.senderId || m.poll?.senderId || "") === String(payload.senderId || payload.senderId) &&
//           (m.poll?.question === pollData.question)
//       );

//       const serverMessage = {
//         id: `poll-${pollData.id}`,
//         type: "poll",
//         poll: pollData,
//         senderId: payload.senderId || payload.senderId || null,
//         senderName: payload.senderName || payload.senderName || "System",
//         timestamp: pollData.createdAt || payload.timestamp || new Date().toISOString(),
//         localOnly: false,
//       };

//       if (matchIndex !== -1) {
//         arr[matchIndex] = serverMessage;
//       } else {
//         // avoid duplicates
//         const exists = arr.some((m) => m.type === "poll" && String(m.poll?.id) === String(pollData.id));
//         if (!exists) arr.push(serverMessage);
//       }

//       return { ...prev, [groupId]: arr };
//     }

//     // fallback: just push if no id provided
//     const exists = arr.some((m) => m.type === "poll" && m.poll?.question === pollData.question && m.senderName === payload.senderName);
//     if (!exists) {
//       arr.push({
//         id: `poll-${pollData.id || Date.now()}`,
//         type: "poll",
//         poll: pollData,
//         senderId: payload.senderId || null,
//         senderName: payload.senderName || "System",
//         timestamp: pollData.createdAt || payload.timestamp || new Date().toISOString(),
//       });
//     }
//     return { ...prev, [groupId]: arr };
//   });

//   break;
// }

case "poll": {
  const pollData = payload.content || payload;
  if (!pollData) return;

  setMessages((prev) => {
    const arr = Array.isArray(prev[groupId]) ? [...prev[groupId]] : [];

    // ❌ fix duplication (check both local and real poll)
    const exists = arr.some(
      (m) =>
        m.type === "poll" &&
        (String(m.poll?.id) === String(pollData.id) ||
         (m.localOnly && m.poll?.question === pollData.question))
    );
    if (exists) return prev;

    arr.push({
      id: `poll-${pollData.id || Date.now()}`,
      type: "poll",
      poll: pollData,
      localOnly: false,
    });

    return { ...prev, [groupId]: arr };
  });
  break;
}



      case "poll_vote": {
        const updatedPoll = payload.message || payload;
        setMessages((prev) => {
          const arr = Array.isArray(prev[groupId]) ? [...prev[groupId]] : [];
          const updated = arr.map((m) =>
            m.poll?.id === updatedPoll.id ? { ...m, poll: updatedPoll } : m
          );
          return { ...prev, [groupId]: updated };
        });
        break;
      }

      case "presence":
        setOnlineUsers((prev) => ({
          ...prev,
          [groupId]: payload.onlineUsers || [],
        }));
        break;

      default:
        console.debug("[chat] unhandled payload:", type);
    }
  };

  /* ---------------------- Helpers ---------------------- */
  const _publishOrQueue = (destination, payload) => {
    const client = stompRef.current;
    const body = JSON.stringify(payload);

    if (client?.connected) {
      try {
        client.publish({ destination, body });
        return;
      } catch (err) {
        console.error("[chat] publish error, queueing", err);
      }
    }
    messageQueueRef.current.push({ destination, body });
  };

  /* ---------------------- Send Message ---------------------- */
  const sendMessage = (groupId, content) => {
    if (!groupId || !content) return;
    const senderId = user?.id || localStorage.getItem("userId");
    const senderName = user?.name || localStorage.getItem("name");

    const message = {
      groupId,
      senderId,
      senderName,
      content,
      timestamp: new Date().toISOString(),
      type: "text",
      localOnly: true,
    };

    setMessages((prev) => {
      const arr = Array.isArray(prev[groupId]) ? [...prev[groupId]] : [];
      arr.push(message);
      return { ...prev, [groupId]: arr };
    });

    _publishOrQueue("/app/chat.sendMessage", message);
    setUnreadCount((prev) => ({ ...prev, [groupId]: 0 }));
  };

  /* ---------------------- Send Poll ---------------------- */
  // const sendPoll = (groupId, pollData) => {
  //   if (!groupId || !pollData) return;

  //   const userId = user?.id || localStorage.getItem("userId");
  //   const userName =
  //     user?.name || user?.username || localStorage.getItem("name") || "Anonymous";

  //   const cleanedPollData = {
  //     question: pollData.question,
  //     options: pollData.options.map((o) => ({ text: o.text })),
  //     allowMultiple: pollData.allowMultiple || false,
  //     anonymous: pollData.anonymous || false,
  //     groupId,
  //   };

  //   const payload = {
  //     ...cleanedPollData,
  //     type: "poll",
  //     senderId: userId,
  //     senderName: userName,
  //     timestamp: new Date().toISOString(),
  //   };

  //   _publishOrQueue("/app/chat.sendPoll", payload);
  // };


  // new code here below

  const sendPoll = (groupId, pollData) => {
  if (!groupId || !pollData) return;

  const userId = user?.id || localStorage.getItem("userId");
  const userName =
    user?.name || user?.username || localStorage.getItem("name") || "Anonymous";

  const cleanedPollData = {
    question: pollData.question,
    options: pollData.options.map((o) => ({
      id: null,
      text: o.text,
      votes: [],
    })),
    allowMultiple: pollData.allowMultiple || false,
    anonymous: pollData.anonymous || false,
    groupId,
    creatorId: pollData.creatorId || userId,        // ✅ add creatorId
    creatorName: pollData.creatorName || userName,  // ✅ add creatorName
  };

  const tempId = `temp-poll-${Date.now()}`;
  const optimisticPoll = {
    id: tempId,
    type: "poll",
    poll: {
      ...cleanedPollData,
      id: null,
      createdAt: new Date().toISOString(),
      totalVotes: 0,
    },
    senderId: userId,
    senderName: userName,
    timestamp: new Date().toISOString(),
    localOnly: true,
  };

  addMessage(groupId, optimisticPoll);

  const payload = {
    ...cleanedPollData,
    type: "poll",
    senderId: userId,
    senderName: userName,
    timestamp: new Date().toISOString(),
  };

  _publishOrQueue("/app/chat.sendPoll", payload);
};

  

  /* ---------------------- Typing Indicator ---------------------- */
  const sendTypingIndicator = (groupId) => {
    if (!groupId || !stompRef.current?.connected) return;

    const userId = user?.id || localStorage.getItem("userId");
    const userName =
      user?.name || user?.username || localStorage.getItem("name") || "Anonymous";

    const typingPayload = { type: "typing", groupId, userId, userName };

    stompRef.current.publish({
      destination: "/app/chat.typing",
      body: JSON.stringify(typingPayload),
    });

    if (typingTimeoutRef.current[groupId])
      clearTimeout(typingTimeoutRef.current[groupId]);
    typingTimeoutRef.current[groupId] = setTimeout(() => {
      stompRef.current.publish({
        destination: "/app/chat.typing",
        body: JSON.stringify({
          type: "typing_stop",
          groupId,
          userId,
          userName,
        }),
      });
    }, 2500);
  };

  const sendTypingStopIndicator = (groupId) => {
    if (!groupId || !stompRef.current?.connected) return;
    const payload = {
      type: "typing_stop",
      groupId,
      typingUser: { id: user?.id, name: user?.name },
    };
    stompRef.current.publish({
      destination: "/app/chat.typing",
      body: JSON.stringify(payload),
    });
  };

  /* ---------------------- Reactions / Polls ---------------------- */
  const addReaction = (groupId, messageId, emoji) =>
    _publishOrQueue("/app/chat.reaction", {
      type: "reaction",
      groupId,
      messageId,
      emoji,
      userId: user?.id,
    });

  const votePoll = (groupId, messageId, pollId, optionIds) =>
    _publishOrQueue("/app/chat.pollVote", {
      type: "poll_vote",
      groupId,
      messageId,
      pollId,
      optionIds,
      userId: user?.id,
    });

  /* ---------------------- Getters ---------------------- */
  const getGroupMessages = (groupId) => messages[groupId] || [];
  const getTypingUsers = (groupId) => typingUsers[groupId] || [];
  const getOnlineUsers = (groupId) => onlineUsers[groupId] || [];
  const getUnreadCount = (groupId) => unreadCount[groupId] || 0;

  const openGroup = (groupId) => {
    if (!groupId) return;
    if (activeGroup && activeGroup !== groupId) unsubscribeGroup(activeGroup);
    setActiveGroup(groupId);
    _subscribeToGroup(groupId);
    setUnreadCount((prev) => ({ ...prev, [groupId]: 0 }));
  };

  const markAsRead = (groupId) =>
    setUnreadCount((prev) => ({ ...prev, [groupId]: 0 }));

  /* ---------------------- Context Value ---------------------- */
  const value = {
    connected,
    activeGroup,
    setActiveGroup,
    openGroup,
    closeGroup: unsubscribeGroup,
    sendMessage,
    sendTypingIndicator,
    addReaction,
    sendTypingStopIndicator,
    sendPoll,
    votePoll,
    getGroupMessages,
    getTypingUsers,
    getOnlineUsers,
    getUnreadCount,
    markAsRead,
    messages,
    typingUsers,
    onlineUsers,
    unreadCount,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
