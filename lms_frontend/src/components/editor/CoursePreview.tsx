/**
 * Course Preview Component
 * Shows how the entire course will appear to students
 */

'use client';

import { useState } from 'react';
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  PlayIcon,
  PauseIcon,
  DocumentTextIcon,
  PaperClipIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';

interface Topic {
  id: number;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  isExpanded?: boolean;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  video_url: string;
  content_type: string;
  order: number;
  estimated_duration: number;
  is_free_preview: boolean;
  attachments?: Array<{
    id: string;
    name: string;
    type: 'pdf' | 'image' | 'video' | 'audio' | 'document' | 'archive' | 'link';
    url: string;
    size?: number;
    description?: string;
  }>;
  knowledge_checks?: Array<{
    id: string;
    title: string;
    description: string;
    questions: Array<{
      id: string;
      type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
      question: string;
      options?: string[];
      correctAnswer?: string | number;
      explanation?: string;
      points: number;
      timeLimit?: number;
    }>;
    totalPoints: number;
    timeLimit?: number;
    passingScore: number;
  }>;
}

interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
  topics: Topic[];
}

interface CoursePreviewProps {
  course: Course;
  onClose: () => void;
  className?: string;
}

export default function CoursePreview({ course, onClose, className = '' }: CoursePreviewProps) {
  const [deviceView, setDeviceView] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set([course.topics[0]?.id]));

  const getDeviceClasses = () => {
    switch (deviceView) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      default:
        return 'max-w-4xl mx-auto';
    }
  };

  const toggleTopicExpansion = (topicId: number) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-xl shadow-2xl w-full h-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Course Preview</h2>
              <p className="text-indigo-100">See how students will experience your course</p>
            </div>
            
            {/* Device Toggle */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => setDeviceView('mobile')}
                  className={`p-2 rounded ${deviceView === 'mobile' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/20'}`}
                  title="Mobile View"
                >
                  <DevicePhoneMobileIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setDeviceView('tablet')}
                  className={`p-2 rounded ${deviceView === 'tablet' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/20'}`}
                  title="Tablet View"
                >
                  <span className="text-lg">📱</span>
                </button>
                <button
                  onClick={() => setDeviceView('desktop')}
                  className={`p-2 rounded ${deviceView === 'desktop' ? 'bg-white text-indigo-600' : 'text-white hover:bg-white/20'}`}
                  title="Desktop View"
                >
                  <ComputerDesktopIcon className="h-5 w-5" />
                </button>
              </div>
              
              <button
                onClick={onClose}
                className="ml-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-full">
          {/* Course Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                <p className="text-sm text-gray-600">{course.description}</p>
              </div>

              {/* Course Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Course Progress</span>
                  <span className="text-sm text-gray-500">0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                </div>
              </div>

              {/* Topics */}
              <div className="space-y-2">
                {course.topics.map((topic, index) => (
                  <div key={topic.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleTopicExpansion(topic.id)}
                      className="w-full flex items-center p-3 text-left hover:bg-gray-100 transition-colors"
                    >
                      {expandedTopics.has(topic.id) ? (
                        <ChevronDownIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {topic.title || `Topic ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {topic.lessons.length} lessons
                        </div>
                      </div>
                    </button>

                    {/* Lessons */}
                    {expandedTopics.has(topic.id) && (
                      <div className="border-t border-gray-200 bg-white">
                        {topic.lessons.map((lesson, lessonIndex) => (
                          <button
                            key={lesson.id}
                            onClick={() => setSelectedLesson(lesson)}
                            className={`w-full flex items-center p-3 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                              selectedLesson?.id === lesson.id
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-6 flex justify-center mr-3">
                              {lesson.content_type === 'video' ? (
                                <PlayIcon className="h-4 w-4" />
                              ) : (
                                <DocumentTextIcon className="h-4 w-4" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm break-words">
                                {lesson.title || `Lesson ${lessonIndex + 1}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {lesson.estimated_duration || 0} min
                                {lesson.is_free_preview && ' • Free Preview'}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className={`${getDeviceClasses()} p-6`}>
              {selectedLesson ? (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedLesson.title}</h1>
                      <p className="text-gray-600">{selectedLesson.description}</p>
                    </div>
                    {selectedLesson.is_free_preview && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Free Preview
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-4 w-4" />
                      <span>{selectedLesson.estimated_duration} min</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DocumentTextIcon className="h-4 w-4" />
                      <span className="capitalize">{selectedLesson.content_type}</span>
                    </div>
                  </div>

                  {/* Video Content */}
                  {selectedLesson.video_url && (
                    <div className="bg-black rounded-lg overflow-hidden mb-6">
                      <video
                        src={selectedLesson.video_url}
                        className="w-full h-64 object-contain"
                        controls
                        preload="metadata"
                      />
                    </div>
                  )}

                  {/* Text Content */}
                  {selectedLesson.content && (
                    <div className="prose prose-sm max-w-none mb-6">
                      <div dangerouslySetInnerHTML={{ __html: selectedLesson.content }} />
                    </div>
                  )}

                  {/* Attachments */}
                  {selectedLesson.attachments && selectedLesson.attachments.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Resources</h3>
                      <div className="space-y-2">
                        {selectedLesson.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <PaperClipIcon className="h-5 w-5 text-gray-400 mr-3" />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{attachment.name}</div>
                              {attachment.description && (
                                <div className="text-xs text-gray-500">{attachment.description}</div>
                              )}
                            </div>
                            <button className="text-indigo-600 hover:text-indigo-800 text-sm">
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Knowledge Checks */}
                  {selectedLesson.knowledge_checks && selectedLesson.knowledge_checks.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Knowledge Checks</h3>
                      <div className="space-y-3">
                        {selectedLesson.knowledge_checks.map((kc) => (
                          <div key={kc.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{kc.title}</h4>
                                <p className="text-sm text-gray-600">{kc.description}</p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>{kc.questions.length} questions</span>
                                  <span>{kc.totalPoints} points</span>
                                  {kc.timeLimit && <span>{kc.timeLimit} min</span>}
                                  <span>{kc.passingScore}% passing</span>
                                </div>
                              </div>
                              <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm">
                                Start Quiz
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Lesson</h3>
                  <p className="text-gray-500">Choose a lesson from the sidebar to preview its content</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
