import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatBubbleLeftIcon, XMarkIcon, BellSlashIcon } from '@heroicons/react/24/outline';

const MessagingWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getGroupMessages, getUnreadCount } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [joinedGroups, setJoinedGroups] = useState([]);

  const loadGroups = () => {
    if (!user?.id) return;
    
    try {
      // Get study groups that user has joined (excluding archived ones for the widget)
      const studyGroups = JSON.parse(localStorage.getItem("studyGroups") || '[]');
      const joined = studyGroups.filter(g => g && g.members && Array.isArray(g.members) && g.members.includes(user.id) && !g.archived);
      setJoinedGroups(joined);
    } catch (error) {
      console.error('Error loading study groups:', error);
      setJoinedGroups([]);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [user?.id]);

  // Listen for localStorage changes (when groups are joined from other components)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'studyGroups' || e.key === null) {
        loadGroups();
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom events from same tab
    const handleCustomStorageChange = () => {
      loadGroups();
    };
    window.addEventListener('studyGroupsUpdated', handleCustomStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('studyGroupsUpdated', handleCustomStorageChange);
    };
  }, [user?.id]);

  // Add a refresh interval to catch any missed updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadGroups();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  const getGroupSettings = (groupId) => {
    try {
      return JSON.parse(localStorage.getItem(`groupSettings_${groupId}`) || '{}');
    } catch (error) {
      console.error('Error loading group settings:', error);
      return {};
    }
  };

  const handleOpenChat = (groupId) => {
    navigate(`/chat/${groupId}`);
    setIsOpen(false);
  };

  const getLastMessage = (groupId) => {
    try {
      const messages = getGroupMessages(groupId);
      if (!messages || messages.length === 0) return 'No messages yet';
      const lastMsg = messages[messages.length - 1];
      if (!lastMsg || !lastMsg.content) return 'No messages yet';
      return lastMsg.content.substring(0, 40) + (lastMsg.content.length > 40 ? '...' : '');
    } catch (error) {
      console.error('Error getting last message:', error);
      return 'No messages yet';
    }
  };

  const unreadCount = joinedGroups.reduce((sum, group) => sum + getUnreadCount(group.id), 0);

  return (
    <>
      {/* Widget Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition transform hover:scale-110 z-40"
        title="Messages"
      >
        <div className="relative">
          <ChatBubbleLeftIcon className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Widget Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 bg-white dark:bg-dark-surface rounded-lg shadow-2xl z-50 flex flex-col max-h-96">
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <h3 className="font-semibold">Messages</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-blue-700 rounded transition"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto">
            {joinedGroups.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-dark-textSecondary text-sm">
                No study groups yet. Join a group to chat!
              </div>
            ) : (
              joinedGroups.map((group) => {
                const unread = getUnreadCount(group.id);
                return (
                  <button
                    key={group.id}
                    onClick={() => handleOpenChat(group.id)}
                    className={`w-full px-4 py-3 border-b border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-input transition text-left ${
                      selectedGroup === group.id ? 'bg-blue-50 dark:bg-dark-input' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="text-2xl">{group.avatar || '💬'}</span>
                        {getGroupSettings(group.id).muteNotifications && (
                          <div className="absolute -bottom-1 -right-1 bg-gray-500 rounded-full p-0.5">
                            <BellSlashIcon className="h-2 w-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-dark-text truncate">
                            {group.name}
                          </p>
                          {getGroupSettings(group.id).muteNotifications && (
                            <BellSlashIcon className="h-3 w-3 text-gray-500" title="Muted" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-dark-textSecondary truncate">
                          {getLastMessage(group.id)}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className={`text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ${
                          getGroupSettings(group.id).muteNotifications ? 'bg-gray-500' : 'bg-red-500'
                        }`}>
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-dark-border px-4 py-2 bg-gray-50 dark:bg-dark-input rounded-b-lg">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
            >
              View All Groups
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MessagingWidget;
