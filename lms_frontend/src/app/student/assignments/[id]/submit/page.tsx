/**
 * Submit Assignment Page
 * Student page for submitting assignments
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  PaperClipIcon,
  XMarkIcon,
  ClockIcon,
  BookOpenIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface Assignment {
  id: number;
  title: string;
  description?: string;
  type: 'quiz' | 'assignment';
  total_points?: number;
  due_date?: string;
  course_title?: string;
  assignment_data?: {
    instructions?: string;
    maxPoints?: number;
    allowedFileTypes?: string[];
    maxFileSize?: number;
  };
}

export default function SubmitAssignmentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assignmentId = params?.id as string;
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'student') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (!authLoading && user?.role === 'student' && assignmentId) {
      loadAssignment();
    }
  }, [user, authLoading, assignmentId]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.getAssessment(parseInt(assignmentId));
      const assignmentData = response.data;
      
      if (assignmentData.type !== 'assignment') {
        router.push(`/student/assignments/${assignmentId}/take`);
        return;
      }

      setAssignment(assignmentData);

      // Load saved draft if exists
      const savedDraft = localStorage.getItem(`assignment_${assignmentId}_draft`);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setSubmissionText(draft.text || '');
        } catch (e) {
          console.error('Error loading saved draft:', e);
        }
      }
    } catch (error: unknown) {
      console.error('Error loading assignment:', error);
      setError('Failed to load assignment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save draft
  useEffect(() => {
    const autoSaveTimer = setTimeout(() => {
      if (submissionText || files.length > 0) {
        localStorage.setItem(`assignment_${assignmentId}_draft`, JSON.stringify({
          text: submissionText,
          timestamp: new Date().toISOString()
        }));
      }
    }, 2000);

    return () => clearTimeout(autoSaveTimer);
  }, [submissionText, files, assignmentId]);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const allowedTypes = assignment?.assignment_data?.allowedFileTypes || [];
    const maxSize = assignment?.assignment_data?.maxFileSize || 10 * 1024 * 1024; // Default 10MB

    Array.from(selectedFiles).forEach(file => {
      // Check file type
      if (allowedTypes.length > 0) {
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedTypes.includes(fileExtension) && !allowedTypes.includes(file.type)) {
          setError(`File type not allowed: ${file.name}. Allowed types: ${allowedTypes.join(', ')}`);
          return;
        }
      }

      // Check file size
      if (file.size > maxSize) {
        setError(`File too large: ${file.name}. Maximum size: ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
        return;
      }

      setFiles(prev => [...prev, file]);
    });
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const handleSubmit = async () => {
    if (!assignment) return;

    if (!submissionText.trim() && files.length === 0) {
      setError('Please provide a submission (text or files).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Clear saved draft
      localStorage.removeItem(`assignment_${assignmentId}_draft`);

      // Prepare submission data
      const formData = new FormData();
      formData.append('assignment_id', assignment.id.toString());
      formData.append('submission_text', submissionText);
      
      files.forEach((file, index) => {
        formData.append(`files`, file);
      });

      // TODO: Replace with actual API call when available
      // await apiClient.submitAssignment(assignment.id, formData);
      console.log('Submitting assignment:', {
        assignment_id: assignment.id,
        text: submissionText,
        files: files.map(f => f.name)
      });

      // Redirect to results page
      router.push(`/student/assignments/${assignmentId}/results`);
    } catch (error: unknown) {
      console.error('Error submitting assignment:', error);
      setError('Failed to submit assignment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getDueDateDisplay = () => {
    if (!assignment?.due_date) return null;
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    const isOverdue = dueDate < now;
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (isOverdue) {
      return (
        <div className="flex items-center text-red-600">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          <span>Overdue: {dueDate.toLocaleDateString()}</span>
        </div>
      );
    } else if (daysUntilDue === 0) {
      return (
        <div className="flex items-center text-orange-600">
          <ClockIcon className="h-5 w-5 mr-2" />
          <span>Due today</span>
        </div>
      );
    } else if (daysUntilDue === 1) {
      return (
        <div className="flex items-center text-orange-600">
          <ClockIcon className="h-5 w-5 mr-2" />
          <span>Due tomorrow</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-gray-600">
          <ClockIcon className="h-5 w-5 mr-2" />
          <span>Due: {dueDate.toLocaleDateString()} ({daysUntilDue} days left)</span>
        </div>
      );
    }
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading assignment...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not student or no assignment
  if (!user || user.role !== 'student' || !assignment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
            {assignment.description && (
              <p className="text-gray-600 mt-1">{assignment.description}</p>
            )}
            {assignment.course_title && (
              <p className="text-sm text-gray-500 mt-1">
                <BookOpenIcon className="h-4 w-4 inline mr-1" />
                {assignment.course_title}
              </p>
            )}
            {getDueDateDisplay() && (
              <div className="mt-2">
                {getDueDateDisplay()}
              </div>
            )}
          </div>
          {assignment.total_points && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Points</div>
              <div className="text-2xl font-bold text-gray-900">{assignment.total_points}</div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {assignment.assignment_data?.instructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Instructions</h3>
          <div className="text-gray-700 whitespace-pre-wrap">
            {assignment.assignment_data.instructions}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Submission Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Submission</h2>

        {/* Text Submission */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Written Response
          </label>
          <textarea
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            placeholder="Enter your assignment response here..."
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Your work is automatically saved as you type.
          </p>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attachments
          </label>
          {assignment.assignment_data?.allowedFileTypes && (
            <p className="text-sm text-gray-500 mb-2">
              Allowed file types: {assignment.assignment_data.allowedFileTypes.join(', ')}
            </p>
          )}
          {assignment.assignment_data?.maxFileSize && (
            <p className="text-sm text-gray-500 mb-2">
              Maximum file size: {(assignment.assignment_data.maxFileSize / 1024 / 1024).toFixed(2)}MB
            </p>
          )}

          {/* Drag and Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <PaperClipIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop files here, or{' '}
              <label className="text-indigo-600 hover:text-indigo-700 cursor-pointer">
                browse
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </label>
            </p>
            <p className="text-xs text-gray-500">
              You can upload multiple files
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <PaperClipIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!submissionText.trim() && files.length === 0)}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}

