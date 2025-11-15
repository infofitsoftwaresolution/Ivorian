/**
 * Assessment Results Page
 * Student page for viewing assessment/assignment results
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BookOpenIcon,
  ArrowLeftIcon,
  TrophyIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface Question {
  id: number;
  questionText: string;
  type: string;
  points?: number;
  studentAnswer?: any;
  correctAnswer?: any;
  isCorrect?: boolean;
  explanation?: string;
}

interface Submission {
  id: number;
  submitted_at: string;
  score?: number;
  total_points?: number;
  percentage?: number;
  grade?: string;
  feedback?: string;
  status: string;
  time_taken?: number;
  questions?: Question[];
}

interface Assessment {
  id: number;
  title: string;
  description?: string;
  type: 'quiz' | 'assignment';
  total_points?: number;
  passing_score?: number;
  course_title?: string;
}

export default function AssessmentResultsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params?.id as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      loadResults();
    }
  }, [user, authLoading, assessmentId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError('');

      // Load assessment
      const assessmentResponse = await apiClient.getAssessment(parseInt(assessmentId));
      setAssessment(assessmentResponse.data);

      // TODO: Load submission results from API when available
      // const resultsResponse = await apiClient.getAssessmentResults(parseInt(assessmentId));
      // setSubmission(resultsResponse.data);

      // Mock submission data for now
      const mockSubmission: Submission = {
        id: 1,
        submitted_at: new Date().toISOString(),
        score: 85,
        total_points: assessmentResponse.data.total_points || 100,
        percentage: 85,
        grade: 'B',
        feedback: 'Great work! You demonstrated a good understanding of the concepts.',
        status: 'graded',
        time_taken: 1800, // 30 minutes in seconds
        questions: assessmentResponse.data.questions?.map((q: Question, index: number) => ({
          ...q,
          studentAnswer: index % 2 === 0 ? 'Correct answer' : 'Wrong answer',
          isCorrect: index % 2 === 0,
          explanation: index % 2 === 0 ? 'Correct!' : 'The correct answer is...'
        }))
      };

      setSubmission(mockSubmission);
    } catch (error: unknown) {
      console.error('Error loading results:', error);
      setError('Failed to load results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getGradeColor = (grade?: string, percentage?: number) => {
    if (!grade && !percentage) return 'text-gray-600';
    
    const score = percentage || 0;
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPassStatus = () => {
    if (!assessment?.passing_score || !submission?.percentage) return null;
    return submission.percentage >= assessment.passing_score;
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading results...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not student or no assessment/submission
  if (!user || user.role !== 'student' || !assessment || !submission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const passStatus = getPassStatus();
  const questions = submission.questions || [];

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
          <button
            onClick={() => router.push('/student/assignments')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Assignments
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Your Score</h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>
          <div className={`text-4xl font-bold ${getGradeColor(submission.grade, submission.percentage)}`}>
            {submission.score} / {submission.total_points}
          </div>
          <div className={`text-lg font-medium mt-2 ${getGradeColor(submission.grade, submission.percentage)}`}>
            {submission.percentage}%
          </div>
          {submission.grade && (
            <div className={`text-sm font-medium mt-1 ${getGradeColor(submission.grade, submission.percentage)}`}>
              Grade: {submission.grade}
            </div>
          )}
        </div>

        {/* Pass/Fail Status */}
        {passStatus !== null && (
          <div className={`bg-white shadow rounded-lg p-6 ${passStatus ? 'border-2 border-green-500' : 'border-2 border-red-500'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              {passStatus ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <XCircleIcon className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className={`text-2xl font-bold ${passStatus ? 'text-green-600' : 'text-red-600'}`}>
              {passStatus ? 'Passed' : 'Failed'}
            </div>
            {assessment.passing_score && (
              <div className="text-sm text-gray-500 mt-2">
                Passing Score: {assessment.passing_score}%
              </div>
            )}
          </div>
        )}

        {/* Time Taken */}
        {submission.time_taken && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500">Time Taken</h3>
              <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatTime(submission.time_taken)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              Submitted: {new Date(submission.submitted_at).toLocaleString()}
            </div>
          </div>
        )}
      </div>

      {/* Feedback */}
      {submission.feedback && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Instructor Feedback</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
        </div>
      )}

      {/* Question Review (for quizzes) */}
      {assessment.type === 'quiz' && questions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Question Review</h3>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className={`border-2 rounded-lg p-6 ${
                  question.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                    {question.points && (
                      <span className="text-sm text-gray-500">({question.points} points)</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {question.isCorrect ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-600" />
                        <span className="text-sm font-medium text-green-600">Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-5 w-5 text-red-600" />
                        <span className="text-sm font-medium text-red-600">Incorrect</span>
                      </>
                    )}
                  </div>
                </div>

                <h4 className="text-base font-medium text-gray-900 mb-3">{question.questionText}</h4>

                <div className="space-y-2 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Your Answer: </span>
                    <span className="text-sm text-gray-900">
                      {typeof question.studentAnswer === 'object'
                        ? JSON.stringify(question.studentAnswer)
                        : question.studentAnswer || 'No answer provided'}
                    </span>
                  </div>
                  {!question.isCorrect && question.correctAnswer && (
                    <div>
                      <span className="text-sm font-medium text-green-700">Correct Answer: </span>
                      <span className="text-sm text-green-900">
                        {typeof question.correctAnswer === 'object'
                          ? JSON.stringify(question.correctAnswer)
                          : question.correctAnswer}
                      </span>
                    </div>
                  )}
                </div>

                {question.explanation && (
                  <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Explanation: </span>
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={() => router.push('/student/assignments')}
          className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Assignments
        </button>
        {assessment.type === 'quiz' && (
          <button
            onClick={() => router.push(`/student/assignments/${assessmentId}/take`)}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Retake Quiz
          </button>
        )}
      </div>
    </div>
  );
}

