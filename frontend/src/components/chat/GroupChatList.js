// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useChat } from '../../contexts/ChatContext';
// import { PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline';

// const GroupChatList = () => {
//   const navigate = useNavigate();
//   const { getGroupMessages, getUnreadCount } = useChat();
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [newGroupName, setNewGroupName] = useState('');

//   const demoGroups = [
//     { id: 'group1', name: 'CS101 - Intro to CS', members: 8, avatar: '💻' },
//     { id: 'group2', name: 'MATH201 - Calculus II', members: 12, avatar: '📐' },
//     { id: 'group3', name: 'PHYS301 - Quantum Mechanics', members: 5, avatar: '⚛️' }
//   ];

//   const handleCreateGroup = () => {
//     if (newGroupName.trim()) {
//       setNewGroupName('');
//       setShowCreateModal(false);
//     }
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex items-center justify-between mb-6">
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Study Groups</h2>
//         <button
//           onClick={() => setShowCreateModal(true)}
//           className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
//         >
//           <PlusIcon className="h-5 w-5" />
//           New Group
//         </button>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {demoGroups.map((group) => (
//           <button
//             key={group.id}
//             onClick={() => navigate(`/chat/${group.id}`)}
//             className="p-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg hover:shadow-lg transition"
//           >
//             <div className="text-center">
//               <div className="text-4xl mb-2">{group.avatar}</div>
//               <h3 className="font-semibold text-gray-900 dark:text-dark-text mb-1">
//                 {group.name}
//               </h3>
//               <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-dark-textSecondary">
//                 <UserGroupIcon className="h-4 w-4" />
//                 {group.members} members
//               </div>
//               {getUnreadCount(group.id) > 0 && (
//                 <div className="mt-2 inline-block bg-red-500 text-white text-xs px-2 py-1 rounded-full">
//                   {getUnreadCount(group.id)} new
//                 </div>
//               )}
//             </div>
//           </button>
//         ))}
//       </div>

//       {showCreateModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-dark-surface rounded-lg p-6 max-w-md w-full mx-4">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-dark-text mb-4">
//               Create New Group
//             </h3>
//             <input
//               type="text"
//               value={newGroupName}
//               onChange={(e) => setNewGroupName(e.target.value)}
//               placeholder="Group name"
//               className="w-full px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg mb-4 dark:bg-dark-input dark:text-dark-text"
//             />
//             <div className="flex gap-2">
//               <button
//                 onClick={handleCreateGroup}
//                 className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
//               >
//                 Create
//               </button>
//               <button
//                 onClick={() => setShowCreateModal(false)}
//                 className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 rounded-lg transition"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default GroupChatList;
