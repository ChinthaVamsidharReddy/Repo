// import React, { useState } from 'react';
// import { CheckIcon, ChartBarIcon, UserIcon } from '@heroicons/react/24/outline';
// import { useAuth } from '../../contexts/AuthContext';
// import relativeTime from 'dayjs/plugin/relativeTime';
// import dayjs from 'dayjs';
// dayjs.extend(relativeTime);


// const PollDisplay = ({ poll, onVote, className = '' }) => {
//   const pollId = poll.id || poll.pollId;
//   console.log(poll);
//   const { user } = useAuth();
//   const [selectedOptions, setSelectedOptions] = useState([]);
//   const [hasVoted, setHasVoted] = useState(
//     poll.options.some(option => 
//       option.votes.some(vote => vote.userId === user?.id)
//     )
//   );

//   const handleOptionSelect = (optionId) => {
//     if (hasVoted) return;

//     if (poll.allowMultiple) {
//       setSelectedOptions(prev => 
//         prev.includes(optionId) 
//           ? prev.filter(id => id !== optionId)
//           : [...prev, optionId]
//       );
//     } else {
//       setSelectedOptions([optionId]);
//     }
//   };

//   const handleVote = () => {
//     if (selectedOptions.length > 0 && !hasVoted) {
//       onVote(poll.id, selectedOptions);
//       setHasVoted(true);
//       setSelectedOptions([]);
//     }
//   };

//   const getVotePercentage = (option) => {
//     if (poll.totalVotes === 0) return 0;
//     return Math.round((option.votes.length / poll.totalVotes) * 100);
//   };

//   const getUserVotedOptions = () => {
//     return poll.options.filter(option =>
//       option.votes.some(vote => vote.userId === user?.id)
//     ).map(option => option.id);
//   };

//   const userVotedOptions = getUserVotedOptions();

//   return (
//     <div className={`bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 ${className}`}>
//       <div className="flex items-start gap-2 mb-3">
//         <ChartBarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
//         <div className="flex-1">
//           <h4 className="font-medium text-gray-900 dark:text-dark-text mb-2">
//             {poll.question}
//           </h4>
//           <div className="space-y-2">
//             {poll.options.map((option) => {
//               const percentage = getVotePercentage(option);
//               const isSelected = selectedOptions.includes(option.id);
//               const isUserVoted = userVotedOptions.includes(option.id);
              
//               return (
//                 <div key={option.id} className="relative">
//                   <button
//                     onClick={() => handleOptionSelect(option.id)}
//                     disabled={hasVoted}
//                     className={`w-full text-left p-3 rounded-lg border transition relative overflow-hidden ${
//                       hasVoted
//                         ? 'cursor-default'
//                         : 'cursor-pointer hover:bg-white dark:hover:bg-dark-surface'
//                     } ${
//                       isSelected
//                         ? 'border-blue-500 bg-blue-50 dark:bg-blue-800'
//                         : isUserVoted
//                         ? 'border-green-500 bg-green-50 dark:bg-green-800'
//                         : 'border-gray-300 dark:border-dark-border bg-white dark:bg-dark-input'
//                     }`}
//                   >
//                     {hasVoted && (
//                       <div
//                         className="absolute inset-0 bg-blue-100 dark:bg-blue-800 opacity-30"
//                         style={{ width: `${percentage}%` }}
//                       />
//                     )}
//                     <div className="relative flex items-center justify-between">
//                       <div className="flex items-center gap-2">
//                         {(isSelected || isUserVoted) && (
//                           <CheckIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
//                         )}
//                         <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
//                           {option.text}
//                         </span>
//                       </div>
//                       {hasVoted && (
//                         <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-dark-textSecondary">
//                           <span>{percentage}%</span>
//                           <span>({option.votes.length})</span>
//                         </div>
//                       )}
//                     </div>
//                   </button>
//                 </div>
//               );
//             })}
//           </div>

//           {!hasVoted && selectedOptions.length > 0 && (
//             <button
//               onClick={handleVote}
//               className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
//             >
//               Vote
//             </button>
//           )}

//           <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-dark-textSecondary">
//             <div className="flex items-center gap-1">
//               <UserIcon className="h-3 w-3" />
//               <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
//             </div>
//             <span>
//               {poll.anonymous ? 'Anonymous' : 'Public'} • 
//               {poll.allowMultiple ? ' Multiple choice' : ' Single choice'}
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PollDisplay;





// new code here below




import React, { useState, useMemo } from 'react';
import { CheckIcon, ChartBarIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import relativeTime from 'dayjs/plugin/relativeTime';
import dayjs from 'dayjs';
dayjs.extend(relativeTime);

const PollDisplay = ({ poll, onVote, className = '', isOwn = false }) => {
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [hasVoted, setHasVoted] = useState(() =>
    Boolean(
      poll?.options?.some((option) =>
        option.votes?.some((vote) => String(vote.userId) === String(user?.id))
      )
    )
  );

  // Derived safe values
  const safeOptions = poll?.options || [];
  const totalVotes = poll?.totalVotes ?? safeOptions.reduce((s, o) => s + (o.votes?.length || 0), 0);
  const createdAtIso = poll?.createdAt || poll?.timestamp || null;

  const handleOptionSelect = (optionId) => {
    if (hasVoted) return;

    if (poll?.allowMultiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = () => {
    if (selectedOptions.length > 0 && !hasVoted) {
      onVote?.(poll.id || poll.pollId, selectedOptions);
      setHasVoted(true);
      setSelectedOptions([]);
    }
  };

  const getVotePercentage = (option) => {
    if (!totalVotes) return 0;
    return Math.round(((option.votes?.length || 0) / totalVotes) * 100);
  };

  const getUserVotedOptions = () =>
    safeOptions
      .filter((option) => option.votes?.some((v) => String(v.userId) === String(user?.id)))
      .map((o) => o.id);

  const userVotedOptions = useMemo(getUserVotedOptions, [poll, user]);

  // time labels
  const relativeLabel = createdAtIso ? dayjs(createdAtIso).fromNow() : '';
  const exactLabel = createdAtIso ? dayjs(createdAtIso).format('hh:mm A, MMM D, YYYY') : '';

  // styling
  const containerBase = `rounded-lg p-4 ${className}`;
  const bgClass = isOwn
    ? 'bg-blue-600 text-white'
    : 'bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 text-gray-900 dark:text-dark-text';

  return (
    <div className={`${containerBase} ${bgClass}`}>
      <div className="flex items-start gap-2 mb-3">
        <ChartBarIcon className={`${isOwn ? 'text-white' : 'text-blue-600 dark:text-blue-400'} h-5 w-5 mt-0.5`} />
        <div className="flex-1">
          <h4 className={`font-medium mb-2 ${isOwn ? 'text-white' : 'text-gray-900 dark:text-dark-text'}`}>
            {poll.question || 'Untitled poll'}
          </h4>

          <div className="space-y-2">
            {safeOptions.map((option) => {
              const percentage = getVotePercentage(option);
              const isSelected = selectedOptions.includes(option.id);
              const isUserVoted = userVotedOptions.includes(option.id);

              const optionBg =
                isSelected || isUserVoted
                  ? isOwn
                    ? 'bg-blue-700'
                    : 'bg-blue-50 dark:bg-blue-800'
                  : isOwn
                  ? 'bg-blue-600 bg-opacity-10'
                  : 'bg-white dark:bg-dark-input';

              const borderClass = isSelected ? 'border-blue-300' : isUserVoted ? 'border-green-300' : 'border-gray-300';

              return (
                <div key={option.id} className="relative">
                  <button
                    onClick={() => handleOptionSelect(option.id)}
                    disabled={hasVoted}
                    className={`w-full text-left p-3 rounded-lg border transition relative overflow-hidden ${borderClass} ${optionBg}`}
                  >
                    {hasVoted && (
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{ width: `${percentage}%`, background: isOwn ? 'rgba(255,255,255,0.15)' : undefined }}
                      />
                    )}
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {(isSelected || isUserVoted) && (
                          <CheckIcon className={`h-4 w-4 ${isOwn ? 'text-white' : 'text-green-600 dark:text-green-400'}`} />
                        )}
                        <span className={`text-sm font-medium ${isOwn ? 'text-white' : 'text-gray-900 dark:text-dark-text'}`}>
                          {option.text}
                        </span>
                      </div>
                      {hasVoted && (
                        <div className={`flex items-center gap-2 text-xs ${isOwn ? 'text-white/80' : 'text-gray-600 dark:text-dark-textSecondary'}`}>
                          <span>{percentage}%</span>
                          <span>({option.votes?.length || 0})</span>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {!hasVoted && selectedOptions.length > 0 && (
            <button
              onClick={handleVote}
              className={`mt-3 px-4 py-2 rounded-lg text-sm ${isOwn ? 'bg-white text-blue-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              Vote
            </button>
          )}

          <div className={`mt-3 flex items-center justify-between text-xs ${isOwn ? 'text-white/80' : 'text-gray-500 dark:text-dark-textSecondary'}`}>
            <div className="flex items-center gap-1">
              <UserIcon className="h-3 w-3" />
              <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
            </div>

            <div className="text-right">
              <div>{poll.anonymous ? 'Anonymous' : 'Public'} • {poll.allowMultiple ? 'Multiple choice' : 'Single choice'}</div>
              {createdAtIso && (
                <div className="text-[11px] opacity-80 mt-1">
                  <span>{relativeLabel}</span> • <span>{exactLabel}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PollDisplay;
