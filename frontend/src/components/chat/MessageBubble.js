import React, { useState } from 'react';
import {
  DocumentIcon,
  PhotoIcon,
  MusicalNoteIcon,
  ArrowUturnLeftIcon,
  FaceSmileIcon,
} from '@heroicons/react/24/outline';
import PollDisplay from './PollDisplay'
import { useAuth } from '../../contexts/AuthContext';

const MessageBubble = ({ message, onReply, onReaction, onPollVote }) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // const isOwn = message.senderId?.toString() === user?.id?.toString();
  const storedUserId = localStorage.getItem("userId");
const currentUserId = user?.id || storedUserId;

const isOwn =
  message.senderId &&
  currentUserId &&
  String(message.senderId) === String(currentUserId);


  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <PhotoIcon className="h-4 w-4" />;
    if (fileType?.startsWith('audio/')) return <MusicalNoteIcon className="h-4 w-4" />;
    return <DocumentIcon className="h-4 w-4" />;
  };

  const handleReaction = (emoji) => {
    onReaction?.(message.id, emoji);
    setShowReactions(false);
  };

  const commonReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  const renderMessageContent = () => {
    switch (message.type) {
      case 'poll': {
        const pollData = message.poll || {
          id: message.id,
          question: message.pollQuestion || message.content,
          options: message.pollOptions || message.options || [],
        };
        return <PollDisplay poll={pollData} onVote={onPollVote} className="mt-2" />;
      }
      case 'file':
        return (
          <div className="flex items-center gap-2 p-2 bg-white bg-opacity-20 rounded">
            {getFileIcon(message.file?.type)}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.file?.name}</p>
              <p className="text-xs opacity-75">{message.file?.size}</p>
            </div>
            <button className="text-xs underline hover:no-underline">Download</button>
          </div>
        );
      case 'voice':
        return (
          <div className="flex items-center gap-2 p-2 bg-white bg-opacity-20 rounded">
            <MusicalNoteIcon className="h-4 w-4" />
            <div className="flex-1">
              <div className="w-32 h-1 bg-white bg-opacity-30 rounded-full">
                <div className="w-1/3 h-full bg-white rounded-full"></div>
              </div>
            </div>
            <span className="text-xs">{message.voice?.duration || '0:30'}</span>
          </div>
        );
      default:
        return <p className="break-words text-sm">{message.content}</p>;
    }
  };

  return (
    <div
      className={`flex w-full my-1 ${isOwn ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`relative max-w-[75%] md:max-w-[65%] p-2 rounded-2xl shadow-sm ${
          isOwn
            ? 'bg-blue-600 text-white rounded-br-none self-end'
            : 'bg-gray-200 dark:bg-dark-input text-gray-900 dark:text-dark-text rounded-bl-none'
        }`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {!isOwn && (
          <p className="text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300 opacity-80">
            {message.senderName}
          </p>
        )}

        {message.replyTo && (
          <div
            className={`mb-1 px-2 py-1 text-xs rounded-lg ${
              isOwn ? 'bg-blue-500 bg-opacity-40' : 'bg-gray-300 dark:bg-dark-border'
            }`}
          >
            <p className="opacity-75">Replying to {message.replyTo.senderName}</p>
            <p className="truncate">{message.replyTo.content}</p>
          </div>
        )}

        {renderMessageContent()}

        <div className="flex items-center justify-end mt-1 space-x-1">
          <span
            className={`text-[11px] ${
              isOwn ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {formatTime(message.timestamp)}
          </span>
          {isOwn && (
            <span className="text-[10px] opacity-75">
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && '✓✓'}
            </span>
          )}
        </div>

        {showActions && (
          <div
            className={`absolute -top-8 ${
              isOwn ? 'right-0' : 'left-0'
            } flex gap-1 bg-white dark:bg-dark-surface shadow-lg rounded-lg p-1`}
          >
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-input rounded text-gray-600 dark:text-dark-text"
              title="React"
            >
              <FaceSmileIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => onReply?.(message)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-input rounded text-gray-600 dark:text-dark-text"
              title="Reply"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {message.reactions && Object.keys(message.reactions).length > 0 && (
  <div className="flex flex-wrap gap-2 mt-1">
    {Object.entries(message.reactions).map(([emoji, users]) => (
      <button
        key={emoji}
        onClick={() => handleReaction(emoji)}
        className={`flex items-center gap-1 px-3 py-1 rounded-full border transition ${
          users.includes(user?.id)
            ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700'
            : 'bg-gray-100 dark:bg-dark-input border-gray-300 dark:border-dark-border'
        }`}
      >
        <span className="text-lg">{emoji}</span> {/* 👈 Larger emoji */}
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {users.length}
        </span>
      </button>
    ))}
  </div>
)}


        {showReactions && (
          <div
            className={`absolute z-20 ${
              isOwn ? 'right-0' : 'left-0'
            } -top-12 flex bg-white dark:bg-dark-surface shadow-lg rounded-lg p-2 gap-1`}
          >
            {commonReactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-input rounded text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
