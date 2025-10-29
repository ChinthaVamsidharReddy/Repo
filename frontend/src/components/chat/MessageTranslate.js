import React, { useState } from 'react';
import { LanguageIcon } from '@heroicons/react/24/outline';

const MessageTranslate = ({ message }) => {
  const [isTranslated, setIsTranslated] = useState(false);
  const [translatedText, setTranslatedText] = useState('');

  const languages = {
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ja: 'Japanese',
    zh: 'Chinese',
    hi: 'Hindi'
  };

  const handleTranslate = (lang) => {
    setTranslatedText(`[${languages[lang]}] ${message.content}`);
    setIsTranslated(true);
  };

  return (
    <div className="relative group">
      <button
        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-dark-border rounded transition text-gray-400"
        title="Translate"
      >
        <LanguageIcon className="h-4 w-4" />
      </button>

      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none group-hover:pointer-events-auto z-50 p-2 grid grid-cols-2 gap-1">
        {Object.entries(languages).map(([code, name]) => (
          <button
            key={code}
            onClick={() => handleTranslate(code)}
            className="px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-dark-input rounded text-gray-900 dark:text-dark-text"
          >
            {name}
          </button>
        ))}
      </div>

      {isTranslated && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-sm text-gray-900 dark:text-dark-text">
          {translatedText}
        </div>
      )}
    </div>
  );
};

export default MessageTranslate;
