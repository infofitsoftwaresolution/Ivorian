/**
 * Video Upload and Preview Component
 * Supports URL embedding and file upload with preview
 */

'use client';

import { useState, useRef } from 'react';
import { 
  PlayIcon,
  PauseIcon,
  PhotoIcon,
  LinkIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { apiClient } from '@/lib/api/client';

interface VideoUploaderProps {
  videoUrl?: string;
  onVideoChange: (url: string) => void;
  onRemove?: () => void;
  className?: string;
}

export default function VideoUploader({ 
  videoUrl = '', 
  onVideoChange, 
  onRemove,
  className = '' 
}: VideoUploaderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [error, setError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = parseFloat(e.target.value);
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    // Validate file size (max 500MB for videos)
    if (file.size > 500 * 1024 * 1024) {
      setError('File size must be less than 500MB');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      // Upload video to S3 via backend API
      const response = await apiClient.uploadVideo(
        file,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Handle different response structures
      let videoUrl: string | undefined;
      if (response.data && typeof response.data === 'object') {
        if ('url' in response.data && typeof response.data.url === 'string') {
          videoUrl = response.data.url;
        } else if ('data' in response.data && response.data.data && typeof response.data.data === 'object' && 'url' in response.data.data) {
          videoUrl = response.data.data.url;
        }
      }
      
      if (videoUrl) {
        setUploadProgress(100);
        onVideoChange(videoUrl);
        setIsUploading(false);
        setUploadProgress(0);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Video upload error:', error);
      const errorMessage = error?.message || error?.details?.detail || 'Failed to upload video. Please try again.';
      setError(errorMessage);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput);
      onVideoChange(urlInput);
      setShowUrlInput(false);
      setUrlInput('');
      setError('');
    } catch {
      setError('Please enter a valid URL');
    }
  };

  const handleRemove = () => {
    onVideoChange('');
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Preview */}
      {videoUrl && (
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-64 object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
          
          {/* Video Controls Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
            <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center space-x-4">
              <button
                onClick={handlePlayPause}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all"
              >
                {isPlaying ? (
                  <PauseIcon className="h-6 w-6 text-gray-800" />
                ) : (
                  <PlayIcon className="h-6 w-6 text-gray-800" />
                )}
              </button>
              
              <button
                onClick={handleMuteToggle}
                className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all"
              >
                {isMuted ? (
                  <span className="text-gray-800 text-sm">🔇</span>
                ) : (
                  <span className="text-gray-800 text-sm">🔊</span>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
            <div className="flex items-center space-x-2 text-white text-sm">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-all"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Options */}
      {!videoUrl && (
        <div className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">Upload Video File</p>
              <p className="text-sm text-gray-500">Drag and drop or click to select</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2 mx-auto"
              >
                {isUploading && <LoadingSpinner size="sm" />}
                <span>{isUploading ? 'Uploading...' : 'Choose File'}</span>
              </button>
            </div>
          </div>

          {/* URL Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors">
            <LinkIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">Add Video URL</p>
              <p className="text-sm text-gray-500">Paste a video URL from YouTube, Vimeo, or S3</p>
              <button
                onClick={() => setShowUrlInput(true)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Add URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* URL Input Modal */}
      {showUrlInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Add Video URL</h3>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInput('');
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleUrlSubmit}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center space-x-2"
              >
                <CheckIcon className="h-4 w-4" />
                <span>Add Video</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Uploading video...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
