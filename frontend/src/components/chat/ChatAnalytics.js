import React, { useState } from 'react';
import { ChartBarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useChat } from '../../contexts/ChatContext';

const ChatAnalytics = ({ groupId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getGroupMessages } = useChat();

  const messages = getGroupMessages(groupId);

  const stats = {
    totalMessages: messages.length,
    uniqueSenders: new Set(messages.map((m) => m.senderId)).size,
    averageLength: messages.length > 0
      ? Math.round(messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length)
      : 0,
    longestMessage: messages.length > 0
      ? Math.max(...messages.map((m) => m.content.length))
      : 0
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-input rounded-lg transition text-gray-600 dark:text-dark-text"
        title="Chat analytics (📊)"
      >
        <ChartBarIcon className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-surface rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text">
                Chat Analytics
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-input rounded transition"
              >
                <XMarkIcon className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Messages</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">
                  {stats.totalMessages}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Unique Senders</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-300">
                  {stats.uniqueSenders}
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Avg Message Length</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-300">
                  {stats.averageLength} chars
                </p>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Longest Message</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-300">
                  {stats.longestMessage} chars
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAnalytics;
