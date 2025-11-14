/**
 * Student Preview Mode
 * Shows how the lesson will appear to students with mobile responsiveness
 */

'use client';

import { useState, useRef } from 'react';
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  PlayIcon,
  PauseIcon,
  DocumentTextIcon,
  PaperClipIcon,
  QuestionMarkCircleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

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

interface StudentPreviewProps {
  lesson: Lesson;
  onClose: () => void;
  className?: string;
}

export default function StudentPreview({ lesson, onClose, className = '' }: StudentPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [deviceView, setDeviceView] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showKnowledgeCheck, setShowKnowledgeCheck] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);

  const getDeviceClasses = () => {
    switch (deviceView) {
      case 'mobile':
        return 'max-w-sm mx-auto';
      case 'tablet':
        return 'max-w-2xl mx-auto';
      case 'desktop':
        return 'max-w-4xl mx-auto';
      default:
        return 'max-w-4xl mx-auto';
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const startKnowledgeCheck = () => {
    setShowKnowledgeCheck(true);
    setCurrentQuestion(0);
    setAnswers({});
    setQuizCompleted(false);
  };

  const handleAnswerSelect = (questionId: string, answer: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (lesson.knowledge_checks && lesson.knowledge_checks[0] && lesson.knowledge_checks[0].questions && currentQuestion < lesson.knowledge_checks[0].questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return '📄';
      case 'image':
        return '🖼️';
      case 'video':
        return '🎥';
      case 'audio':
        return '🎵';
      case 'document':
        return '📝';
      case 'archive':
        return '📦';
      case 'link':
        return '🔗';
      default:
        return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">Student Preview</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDeviceView('mobile')}
                className={`p-2 rounded ${deviceView === 'mobile' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Mobile View"
              >
                <DevicePhoneMobileIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setDeviceView('tablet')}
                className={`p-2 rounded ${deviceView === 'tablet' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Tablet View"
              >
                <span className="text-lg">📱</span>
              </button>
              <button
                onClick={() => setDeviceView('desktop')}
                className={`p-2 rounded ${deviceView === 'desktop' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title="Desktop View"
              >
                <ComputerDesktopIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className={`${getDeviceClasses()}`}>
            {/* Lesson Header */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
                  <p className="text-gray-600">{lesson.description}</p>
                </div>
                {lesson.is_free_preview && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Free Preview
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{lesson.estimated_duration} min</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span className="capitalize">{lesson.content_type}</span>
                </div>
              </div>
            </div>

            {/* Video Content */}
            {lesson.video_url && (
              <div className="bg-black rounded-lg overflow-hidden mb-6 relative">
                <video
                  ref={videoRef}
                  src={lesson.video_url}
                  className="w-full h-64 object-contain"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  controls={false}
                  preload="metadata"
                />
                
                {/* Video Controls */}
                <div className="bg-black bg-opacity-75 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={handlePlayPause}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
                      >
                        {isPlaying ? (
                          <PauseIcon className="h-5 w-5 text-white" />
                        ) : (
                          <PlayIcon className="h-5 w-5 text-white" />
                        )}
                      </button>
                      
                      <button
                        onClick={handleMuteToggle}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all"
                      >
                        {isMuted ? (
                          <span className="text-white text-sm">🔇</span>
                        ) : (
                          <span className="text-white text-sm">🔊</span>
                        )}
                      </button>
                    </div>
                    
                    <div className="text-white text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-600 rounded-full h-1">
                    <div 
                      className="bg-white h-1 rounded-full transition-all"
                      style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Lesson Content */}
            {lesson.content && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lesson Content</h3>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              </div>
            )}

            {/* Attachments */}
            {lesson.attachments && lesson.attachments.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <PaperClipIcon className="h-5 w-5 mr-2" />
                  Resources
                </h3>
                <div className="space-y-3">
                  {lesson.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getFileIcon(attachment.type)}</span>
                        <div>
                          <p className="font-medium text-gray-900">{attachment.name}</p>
                          {attachment.description && (
                            <p className="text-sm text-gray-600">{attachment.description}</p>
                          )}
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span className="capitalize">{attachment.type}</span>
                            {attachment.size && (
                              <>
                                <span>•</span>
                                <span>{formatFileSize(attachment.size)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Knowledge Checks */}
            {lesson.knowledge_checks && lesson.knowledge_checks.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                  Knowledge Check
                </h3>
                
                {!showKnowledgeCheck ? (
                  <div className="text-center py-8">
                    <QuestionMarkCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {lesson.knowledge_checks?.[0]?.title || 'Knowledge Check'}
                    </h4>
                    <p className="text-gray-600 mb-4">{lesson.knowledge_checks?.[0]?.description || ''}</p>
                    {lesson.knowledge_checks?.[0] && (
                      <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-6">
                        <span>{lesson.knowledge_checks[0].questions?.length || 0} questions</span>
                        <span>{lesson.knowledge_checks[0].totalPoints || 0} points</span>
                        {lesson.knowledge_checks[0].timeLimit && (
                          <span>{lesson.knowledge_checks[0].timeLimit} min</span>
                        )}
                        <span>{lesson.knowledge_checks[0].passingScore || 0}% passing</span>
                      </div>
                    )}
                    <button
                      onClick={startKnowledgeCheck}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Start Knowledge Check
                    </button>
                  </div>
                ) : (
                  <div>
                    {!quizCompleted ? (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm text-gray-500">
                            Question {currentQuestion + 1} of {lesson.knowledge_checks?.[0]?.questions?.length || 0}
                          </span>
                          <span className="text-sm text-gray-500">
                            {lesson.knowledge_checks?.[0]?.questions?.[currentQuestion]?.points || 0} points
                          </span>
                        </div>
                        
                        <div className="mb-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">
                            {lesson.knowledge_checks?.[0]?.questions?.[currentQuestion]?.question || ''}
                          </h4>
                          
                          {lesson.knowledge_checks && lesson.knowledge_checks[0] && lesson.knowledge_checks[0].questions && lesson.knowledge_checks[0].questions[currentQuestion] && (
                            <>
                              {lesson.knowledge_checks[0].questions[currentQuestion].type === 'multiple-choice' && (
                                <div className="space-y-2">
                                  {lesson.knowledge_checks[0].questions[currentQuestion].options?.map((option, index) => (
                                    <label key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={`question-${lesson.knowledge_checks[0].questions[currentQuestion].id}`}
                                        value={index}
                                        checked={answers[lesson.knowledge_checks[0].questions[currentQuestion].id] === index}
                                        onChange={(e) => handleAnswerSelect(lesson.knowledge_checks[0].questions[currentQuestion].id, parseInt(e.target.value))}
                                        className="text-indigo-600"
                                      />
                                      <span>{option}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                              
                              {lesson.knowledge_checks[0].questions[currentQuestion].type === 'true-false' && (
                                <div className="space-y-2">
                                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`question-${lesson.knowledge_checks[0].questions[currentQuestion].id}`}
                                      value="true"
                                      checked={answers[lesson.knowledge_checks[0].questions[currentQuestion].id] === 'true'}
                                      onChange={(e) => handleAnswerSelect(lesson.knowledge_checks[0].questions[currentQuestion].id, e.target.value)}
                                      className="text-indigo-600"
                                    />
                                    <span>True</span>
                                  </label>
                                  <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`question-${lesson.knowledge_checks[0].questions[currentQuestion].id}`}
                                      value="false"
                                      checked={answers[lesson.knowledge_checks[0].questions[currentQuestion].id] === 'false'}
                                      onChange={(e) => handleAnswerSelect(lesson.knowledge_checks[0].questions[currentQuestion].id, e.target.value)}
                                      className="text-indigo-600"
                                    />
                                    <span>False</span>
                                  </label>
                                </div>
                              )}
                              
                              {(lesson.knowledge_checks[0].questions[currentQuestion].type === 'short-answer' || 
                                lesson.knowledge_checks[0].questions[currentQuestion].type === 'essay') && (
                                <textarea
                                  value={answers[lesson.knowledge_checks[0].questions[currentQuestion].id] || ''}
                                  onChange={(e) => handleAnswerSelect(lesson.knowledge_checks[0].questions[currentQuestion].id, e.target.value)}
                                  placeholder="Enter your answer here..."
                                  rows={lesson.knowledge_checks[0].questions[currentQuestion].type === 'essay' ? 6 : 3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                />
                              )}
                            </>
                          )}
                        </div>
                        
                        <div className="flex justify-between">
                          <button
                            onClick={prevQuestion}
                            disabled={currentQuestion === 0}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          <button
                            onClick={nextQuestion}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                          >
                            {lesson.knowledge_checks?.[0]?.questions && currentQuestion === lesson.knowledge_checks[0].questions.length - 1 ? 'Submit' : 'Next'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500 mb-4" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">Knowledge Check Completed!</h4>
                        <p className="text-gray-600 mb-4">Great job! You've completed the knowledge check.</p>
                        <button
                          onClick={() => setShowKnowledgeCheck(false)}
                          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
