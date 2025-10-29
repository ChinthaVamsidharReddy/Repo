import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

const ReadReceipts = ({ message, readBy = [] }) => {
  if (!readBy || readBy.length === 0) return null;

  return (
    <div className="flex items-center gap-1 mt-1">
      {readBy.length === 1 ? (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <CheckIcon className="h-3 w-3" />
          <span>Read by {readBy[0]}</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <CheckIcon className="h-3 w-3" />
          <CheckIcon className="h-3 w-3" />
          <span>Read by {readBy.length}</span>
        </div>
      )}
    </div>
  );
};

export default ReadReceipts;
