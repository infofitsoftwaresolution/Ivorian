/**
 * Resource Attachment System
 * Supports PDFs, files, links, and other resources
 */

'use client';

import { useState, useRef } from 'react';
import { 
  DocumentIcon,
  LinkIcon,
  PhotoIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Attachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'video' | 'audio' | 'document' | 'archive' | 'link';
  url: string;
  size?: number;
  description?: string;
}

interface ResourceAttachmentsProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  className?: string;
}

export default function ResourceAttachments({ 
  attachments = [], 
  onAttachmentsChange,
  className = '' 
}: ResourceAttachmentsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkData, setLinkData] = useState({ name: '', url: '', description: '' });
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <DocumentIcon className="h-8 w-8 text-red-500" />;
      case 'image':
        return <PhotoIcon className="h-8 w-8 text-green-500" />;
      case 'video':
        return <VideoCameraIcon className="h-8 w-8 text-blue-500" />;
      case 'audio':
        return <MusicalNoteIcon className="h-8 w-8 text-purple-500" />;
      case 'document':
        return <DocumentTextIcon className="h-8 w-8 text-gray-500" />;
      case 'archive':
        return <ArchiveBoxIcon className="h-8 w-8 text-orange-500" />;
      case 'link':
        return <LinkIcon className="h-8 w-8 text-indigo-500" />;
      default:
        return <DocumentIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  const getFileType = (filename: string, mimeType: string): Attachment['type'] => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    if (mimeType.includes('pdf') || extension === 'pdf') return 'pdf';
    if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) return 'image';
    if (mimeType.includes('video') || ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension || '')) return 'video';
    if (mimeType.includes('audio') || ['mp3', 'wav', 'ogg', 'm4a'].includes(extension || '')) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension || '')) return 'archive';
    if (['doc', 'docx', 'txt', 'rtf'].includes(extension || '')) return 'document';
    
    return 'document';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError('');

    try {
      const newAttachments: Attachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          setError(`File ${file.name} is too large. Maximum size is 50MB.`);
          continue;
        }

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              return 100;
            }
            return prev + 10;
          });
        }, 100);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock S3 URL
        const mockS3Url = `https://your-s3-bucket.amazonaws.com/resources/${Date.now()}-${file.name}`;
        
        clearInterval(progressInterval);
        
        const attachment: Attachment = {
          id: Date.now().toString() + i,
          name: file.name,
          type: getFileType(file.name, file.type),
          url: mockS3Url,
          size: file.size,
          description: ''
        };

        newAttachments.push(attachment);
      }

      onAttachmentsChange([...attachments, ...newAttachments]);
      setIsUploading(false);
      setUploadProgress(0);
    } catch (error) {
      setError('Failed to upload files. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleAddLink = () => {
    if (!linkData.name.trim() || !linkData.url.trim()) {
      setError('Please fill in both name and URL');
      return;
    }

    try {
      new URL(linkData.url);
      
      const attachment: Attachment = {
        id: Date.now().toString(),
        name: linkData.name,
        type: 'link',
        url: linkData.url,
        description: linkData.description
      };

      onAttachmentsChange([...attachments, attachment]);
      setShowLinkModal(false);
      setLinkData({ name: '', url: '', description: '' });
      setError('');
    } catch {
      setError('Please enter a valid URL');
    }
  };

  const handleRemoveAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(attachment => attachment.id !== id));
  };

  const handlePreview = (attachment: Attachment) => {
    if (attachment.type === 'link') {
      window.open(attachment.url, '_blank');
    } else {
      // For files, you might want to open in a new tab or modal
      window.open(attachment.url, '_blank');
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isUploading && <LoadingSpinner size="sm" />}
              <PlusIcon className="h-4 w-4" />
              <span>Upload Files</span>
            </button>
            
            <button
              onClick={() => setShowLinkModal(true)}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2"
            >
              <LinkIcon className="h-4 w-4" />
              <span>Add Link</span>
            </button>
          </div>
          
          <p className="text-sm text-gray-500">
            Upload PDFs, images, videos, documents, or add external links
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.rtf,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp4,.avi,.mov,.wmv,.flv,.mp3,.wav,.ogg,.m4a,.zip,.rar,.7z"
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Uploading files...</span>
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
      </div>

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Attached Resources</h4>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(attachment.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="capitalize">{attachment.type}</span>
                      {attachment.size && (
                        <>
                          <span>•</span>
                          <span>{formatFileSize(attachment.size)}</span>
                        </>
                      )}
                    </div>
                    {attachment.description && (
                      <p className="text-xs text-gray-600 mt-1">{attachment.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePreview(attachment)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Preview"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  
                  {attachment.type !== 'link' && (
                    <button
                      onClick={() => handleDownload(attachment)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Download"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Remove"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Add External Link</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Name *
                </label>
                <input
                  type="text"
                  value={linkData.name}
                  onChange={(e) => setLinkData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Course Materials"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL *
                </label>
                <input
                  type="url"
                  value={linkData.url}
                  onChange={(e) => setLinkData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={linkData.description}
                  onChange={(e) => setLinkData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
            
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkData({ name: '', url: '', description: '' });
                  setError('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLink}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
