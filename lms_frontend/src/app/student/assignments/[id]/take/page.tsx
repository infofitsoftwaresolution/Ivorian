/**
 * Take Quiz/Assessment Page
 * Student page for taking quizzes and assessments
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookOpenIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface Question {
  id: number;
  questionText: string;
  type: 'mcq' | 'multiple-correct' | 'true-false' | 'short-answer' | 'essay' | 'video' | 'comprehension';
  points?: number;
  options?: Array<{
    id: number;
    text: string;
    isCorrect?: boolean;
  }>;
  correctAnswer?: string;
  explanation?: string;
}

interface Assessment {
  id: number;
  title: string;
  description?: string;
  type: 'quiz' | 'assignment';
  total_questions?: number;
  total_points?: number;
  time_limit?: number; // in minutes
  passing_score?: number;
  attempts_allowed?: number;
  questions?: Question[];
  course_title?: string;
}

export default function TakeAssessmentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params?.id as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
    if (!authLoading && user?.role === 'student' && assessmentId) {
      loadAssessment();
    }
  }, [user, authLoading, assessmentId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 0) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Auto-save effect
  useEffect(() => {
    if (startTime && Object.keys(answers).length > 0) {
      // Auto-save every 30 seconds
      autoSaveIntervalRef.current = setInterval(() => {
        autoSave();
      }, 30000);
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [answers, startTime]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.getAssessment(parseInt(assessmentId));
      const assessmentData = response.data;
      
      setAssessment(assessmentData);

      // Initialize timer if time limit exists
      if (assessmentData.time_limit) {
        setTimeRemaining(assessmentData.time_limit * 60); // Convert minutes to seconds
      }

      // Initialize start time
      setStartTime(new Date());

      // Load saved progress if exists
      // TODO: Load from API when available
      const savedProgress = localStorage.getItem(`assessment_${assessmentId}_progress`);
      if (savedProgress) {
        try {
          const progress = JSON.parse(savedProgress);
          setAnswers(progress.answers || {});
          setCurrentQuestion(progress.currentQuestion || 0);
        } catch (e) {
          console.error('Error loading saved progress:', e);
        }
      }
    } catch (error: unknown) {
      console.error('Error loading assessment:', error);
      setError('Failed to load assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const autoSave = async () => {
    try {
      // Save progress to localStorage
      localStorage.setItem(`assessment_${assessmentId}_progress`, JSON.stringify({
        answers,
        currentQuestion,
        timestamp: new Date().toISOString()
      }));

      // TODO: Save to API when available
      // await apiClient.saveAssessmentProgress(assessmentId, { answers, currentQuestion });
    } catch (error) {
      console.error('Error auto-saving:', error);
    }
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (assessment?.questions && currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleTimeUp = () => {
    // Auto-submit when time is up
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    setIsSubmitting(true);
    try {
      // Clear saved progress
      localStorage.removeItem(`assessment_${assessmentId}_progress`);

      // Submit assessment
      // TODO: Replace with actual API call when available
      const submissionData = {
        assessment_id: assessment.id,
        answers,
        time_taken: startTime ? Math.floor((new Date().getTime() - startTime.getTime()) / 1000) : 0
      };

      // await apiClient.submitAssessment(assessment.id, submissionData);
      console.log('Submitting assessment:', submissionData);

      // Redirect to results page
      router.push(`/student/assignments/${assessmentId}/results`);
    } catch (error: unknown) {
      console.error('Error submitting assessment:', error);
      setError('Failed to submit assessment. Please try again.');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const isQuestionAnswered = (questionId: number) => {
    const answer = answers[questionId];
    if (answer === undefined || answer === null || answer === '') return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return true;
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading assessment...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not student or no assessment
  if (!user || user.role !== 'student' || !assessment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const questions = assessment.questions || [];
  const currentQ = questions[currentQuestion];

  if (!currentQ) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No questions available</p>
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
            <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
            {assessment.description && (
              <p className="text-gray-600 mt-1">{assessment.description}</p>
            )}
            {assessment.course_title && (
              <p className="text-sm text-gray-500 mt-1">
                <BookOpenIcon className="h-4 w-4 inline mr-1" />
                {assessment.course_title}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {timeRemaining !== null && (
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <ClockIcon className="h-5 w-5" />
                <span className="font-semibold">{formatTime(timeRemaining)}</span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              {getAnsweredCount()} / {questions.length} answered
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4 sticky top-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Question Navigation</h3>
            <div className="grid grid-cols-5 lg:grid-cols-1 gap-2">
              {questions.map((q, index) => (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestion(index)}
                  className={`p-2 rounded-md text-sm font-medium transition-colors ${
                    index === currentQuestion
                      ? 'bg-indigo-600 text-white'
                      : isQuestionAnswered(q.id)
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{getAnsweredCount()} / {questions.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${(getAnsweredCount() / questions.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Question Area */}
        <div className="lg:col-span-3">
          <div className="bg-white shadow rounded-lg p-6">
            {/* Question Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-sm text-gray-500">Question {currentQuestion + 1} of {questions.length}</span>
                {currentQ.points && (
                  <span className="ml-2 text-sm text-gray-500">({currentQ.points} points)</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {isQuestionAnswered(currentQ.id) && (
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    Answered
                  </span>
                )}
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded capitalize">
                  {currentQ.type.replace('-', ' ')}
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">{currentQ.questionText}</h2>

              {/* MCQ / Multiple Correct */}
              {(currentQ.type === 'mcq' || currentQ.type === 'multiple-correct') && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        (Array.isArray(answers[currentQ.id]) && answers[currentQ.id].includes(option.id)) ||
                        answers[currentQ.id] === option.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type={currentQ.type === 'multiple-correct' ? 'checkbox' : 'radio'}
                        name={`question-${currentQ.id}`}
                        checked={
                          currentQ.type === 'multiple-correct'
                            ? Array.isArray(answers[currentQ.id]) && answers[currentQ.id].includes(option.id)
                            : answers[currentQ.id] === option.id
                        }
                        onChange={() => {
                          if (currentQ.type === 'multiple-correct') {
                            const currentAnswers = Array.isArray(answers[currentQ.id]) ? answers[currentQ.id] : [];
                            const newAnswers = currentAnswers.includes(option.id)
                              ? currentAnswers.filter((id: number) => id !== option.id)
                              : [...currentAnswers, option.id];
                            handleAnswerChange(currentQ.id, newAnswers);
                          } else {
                            handleAnswerChange(currentQ.id, option.id);
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-gray-700">{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* True/False */}
              {currentQ.type === 'true-false' && (
                <div className="space-y-3">
                  {[
                    { id: 'true', text: 'True' },
                    { id: 'false', text: 'False' }
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        answers[currentQ.id] === option.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQ.id}`}
                        checked={answers[currentQ.id] === option.id}
                        onChange={() => handleAnswerChange(currentQ.id, option.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-gray-700">{option.text}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Short Answer / Essay */}
              {(currentQ.type === 'short-answer' || currentQ.type === 'essay') && (
                <textarea
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                  placeholder="Enter your answer here..."
                  rows={currentQ.type === 'essay' ? 8 : 4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Previous
              </button>

              <div className="flex items-center space-x-3">
                {currentQuestion < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Next
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="inline-flex items-center px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Submit Assessment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Submission</h3>
            <p className="text-sm text-gray-600 mb-6">
              You have answered {getAnsweredCount()} out of {questions.length} questions. 
              Are you sure you want to submit your assessment? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

