import React, { useState, useRef } from 'react';
import { 
  PaperClipIcon, 
  PhotoIcon, 
  DocumentIcon, 
  MicrophoneIcon,
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';

const FileUpload = ({ onFileSelect, onVoiceRecord }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  const handleFileSelect = (event, type = 'file') => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      const fileData = {
        file,
        type,
        name: file.name,
        size: formatFileSize(file.size),
        url: URL.createObjectURL(file)
      };
      onFileSelect(fileData);
    });
    setShowOptions(false);
    event.target.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const audioFile = {
          file: blob,
          type: 'voice',
          name: `Voice message ${new Date().toLocaleTimeString()}.wav`,
          size: formatFileSize(blob.size),
          duration: formatTime(recordingTime),
          url: URL.createObjectURL(blob)
        };
        onVoiceRecord(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
      setShowOptions(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const uploadOptions = [
    {
      icon: <DocumentIcon className="h-5 w-5" />,
      label: 'Document',
      accept: '.pdf,.doc,.docx,.txt,.xlsx,.pptx',
      onClick: () => fileInputRef.current?.click()
    },
    {
      icon: <PhotoIcon className="h-5 w-5" />,
      label: 'Photo/Video',
      accept: 'image/*,video/*',
      onClick: () => imageInputRef.current?.click()
    },
    {
      icon: <MicrophoneIcon className="h-5 w-5" />,
      label: isRecording ? 'Stop Recording' : 'Voice Message',
      onClick: isRecording ? stopRecording : startRecording
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="p-2 text-gray-600 dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-input rounded-lg transition"
        title="Attach file"
      >
        <PaperClipIcon className="h-5 w-5" />
      </button>

      {showOptions && (
        <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-dark-surface shadow-lg rounded-lg border border-gray-200 dark:border-dark-border p-2 min-w-48">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900 dark:text-dark-text">
              Attach
            </h3>
            <button
              onClick={() => setShowOptions(false)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-dark-input rounded"
            >
              <XMarkIcon className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          
          <div className="space-y-1">
            {uploadOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.onClick}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-dark-input rounded-lg transition ${
                  isRecording && option.label.includes('Recording') 
                    ? 'bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-300' 
                    : 'text-gray-700 dark:text-dark-text'
                }`}
              >
                {option.icon}
                <span className="text-sm">{option.label}</span>
                {isRecording && option.label.includes('Recording') && (
                  <span className="ml-auto text-xs">
                    {formatTime(recordingTime)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {isRecording && (
            <div className="mt-3 p-2 bg-red-50 dark:bg-red-900 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600 dark:text-red-300">
                  Recording... {formatTime(recordingTime)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
        onChange={(e) => handleFileSelect(e, 'file')}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => handleFileSelect(e, 'media')}
        className="hidden"
      />
    </div>
  );
};

export default FileUpload;
