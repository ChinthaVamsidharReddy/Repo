import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useChat } from '../../contexts/ChatContext';

const ChatExport = ({ groupId, groupName }) => {
  const { getGroupMessages } = useChat();

  const handleExport = (format) => {
    const messages = getGroupMessages(groupId);
    let content = '';

    if (format === 'txt') {
      content = messages
        .map((msg) => `[${new Date(msg.timestamp).toLocaleString()}] ${msg.senderName}: ${msg.content}`)
        .join('\n');
    } else if (format === 'json') {
      content = JSON.stringify(messages, null, 2);
    } else if (format === 'csv') {
      content = 'Timestamp,Sender,Message\n';
      content += messages
        .map((msg) => `"${new Date(msg.timestamp).toLocaleString()}","${msg.senderName}","${msg.content.replace(/"/g, '""')}"`)
        .join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${groupName}-chat.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative group">
      <button
        className="p-2 hover:bg-gray-100 dark:hover:bg-dark-input rounded-lg transition text-gray-600 dark:text-dark-text"
        title="Export chat (📥)"
      >
        <ArrowDownTrayIcon className="h-6 w-6" />
      </button>

      <div className="absolute right-0 top-full mt-2 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto z-50">
        <button
          onClick={() => handleExport('txt')}
          className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-input text-sm text-gray-900 dark:text-dark-text"
        >
          Export as TXT
        </button>
        <button
          onClick={() => handleExport('json')}
          className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-input text-sm text-gray-900 dark:text-dark-text"
        >
          Export as JSON
        </button>
        <button
          onClick={() => handleExport('csv')}
          className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-dark-input text-sm text-gray-900 dark:text-dark-text"
        >
          Export as CSV
        </button>
      </div>
    </div>
  );
};

export default ChatExport;
