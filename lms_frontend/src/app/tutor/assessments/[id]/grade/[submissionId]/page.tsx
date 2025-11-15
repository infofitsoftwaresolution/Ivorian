/**
 * Grade Submission Page
 * Tutor page for grading student submissions
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BookOpenIcon,
  UserIcon,
  PaperClipIcon,
  ExclamationTriangleIcon
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
  rubric?: Array<{
    id: string;
    title: string;
    description: string;
    points: number;
    levels: {
      excellent: string;
      good: string;
      satisfactory: string;
      needsImprovement: string;
    };
  }>;
}

interface Submission {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  submitted_at: string;
  submission_text?: string;
  files?: Array<{
    id: number;
    name: string;
    url: string;
    size: number;
  }>;
  answers?: Record<number, any>;
  questions?: Question[];
  score?: number;
  total_points?: number;
  feedback?: string;
  status: string;
  time_taken?: number;
}

interface Assessment {
  id: number;
  title: string;
  description?: string;
  type: 'quiz' | 'assignment';
  total_points?: number;
  course_title?: string;
  assignment_data?: {
    rubric?: Array<{
      id: string;
      title: string;
      description: string;
      points: number;
      levels: {
        excellent: string;
        good: string;
        satisfactory: string;
        needsImprovement: string;
      };
    }>;
  };
}

export default function GradeSubmissionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params?.id as string;
  const submissionId = params?.submissionId as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Grading state
  const [score, setScore] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [questionScores, setQuestionScores] = useState<Record<number, number>>({});
  const [rubricScores, setRubricScores] = useState<Record<string, { level: string; points: number }>>({});

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'tutor') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (!authLoading && user?.role === 'tutor' && assessmentId && submissionId) {
      loadData();
    }
  }, [user, authLoading, assessmentId, submissionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load assessment
      const assessmentResponse = await apiClient.getAssessment(parseInt(assessmentId));
      setAssessment(assessmentResponse.data);

      // TODO: Load submission from API when available
      // const submissionResponse = await apiClient.getSubmission(parseInt(submissionId));
      // setSubmission(submissionResponse.data);

      // Mock submission data
      const mockSubmission: Submission = {
        id: parseInt(submissionId),
        student_id: 1,
        student_name: 'John Doe',
        student_email: 'john@example.com',
        submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        submission_text: assessmentResponse.data.type === 'assignment' 
          ? 'This is my assignment submission. I have completed all the requirements and included detailed explanations for each section.'
          : undefined,
        files: assessmentResponse.data.type === 'assignment' ? [
          {
            id: 1,
            name: 'assignment.pdf',
            url: '#',
            size: 1024000
          }
        ] : undefined,
        answers: assessmentResponse.data.type === 'quiz' ? {
          1: 'Answer 1',
          2: 'Answer 2'
        } : undefined,
        questions: assessmentResponse.data.questions?.map((q: Question) => ({
          ...q,
          studentAnswer: q.id === 1 ? 'Correct answer' : 'Wrong answer'
        })),
        status: 'submitted',
        time_taken: 1800
      };

      setSubmission(mockSubmission);
      
      // Initialize scores
      if (mockSubmission.score !== undefined) {
        setScore(mockSubmission.score);
      }
      if (mockSubmission.feedback) {
        setFeedback(mockSubmission.feedback);
      }
    } catch (error: unknown) {
      console.error('Error loading submission:', error);
      setError('Failed to load submission. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalScore = () => {
    if (assessment?.type === 'quiz' && submission?.questions) {
      // Calculate from question scores
      return Object.values(questionScores).reduce((sum, s) => sum + s, 0);
    } else if (assessment?.type === 'assignment' && assessment.assignment_data?.rubric) {
      // Calculate from rubric scores
      return Object.values(rubricScores).reduce((sum, r) => sum + r.points, 0);
    }
    return score;
  };

  const handleSave = async () => {
    if (!assessment || !submission) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const totalScore = calculateTotalScore();
      const percentage = assessment.total_points 
        ? Math.round((totalScore / assessment.total_points) * 100)
        : 0;

      // TODO: Replace with actual API call when available
      // await apiClient.gradeSubmission(submission.id, {
      //   score: totalScore,
      //   feedback,
      //   question_scores: questionScores,
      //   rubric_scores: rubricScores,
      //   status: 'graded'
      // });

      console.log('Grading submission:', {
        submission_id: submission.id,
        score: totalScore,
        feedback,
        question_scores: questionScores,
        rubric_scores: rubricScores
      });

      setSuccess('Grade saved successfully!');
      setTimeout(() => {
        router.push(`/tutor/assessments/${assessmentId}/submissions`);
      }, 1500);
    } catch (error: unknown) {
      console.error('Error saving grade:', error);
      setError('Failed to save grade. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading submission...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not tutor or no assessment/submission
  if (!user || user.role !== 'tutor' || !assessment || !submission) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const totalScore = calculateTotalScore();
  const maxPoints = assessment.total_points || 100;
  const percentage = Math.round((totalScore / maxPoints) * 100);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/tutor/assessments/${assessmentId}/submissions`)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
                {assessment.course_title && (
                  <p className="text-sm text-gray-500 mt-1">
                    <BookOpenIcon className="h-4 w-4 inline mr-1" />
                    {assessment.course_title}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Points</div>
            <div className="text-2xl font-bold text-gray-900">{maxPoints}</div>
          </div>
        </div>
      </div>

      {/* Student Info */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{submission.student_name}</h3>
              <p className="text-sm text-gray-500">{submission.student_email}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Submitted</div>
            <div className="text-sm font-medium text-gray-900">
              {new Date(submission.submitted_at).toLocaleString()}
            </div>
            {submission.time_taken && (
              <div className="text-xs text-gray-500 mt-1">
                <ClockIcon className="h-3 w-3 inline mr-1" />
                {formatTime(submission.time_taken)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Assignment Submission */}
          {assessment.type === 'assignment' && (
            <>
              {submission.submission_text && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Written Response</h3>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{submission.submission_text}</p>
                  </div>
                </div>
              )}

              {submission.files && submission.files.length > 0 && (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
                  <div className="space-y-3">
                    {submission.files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <PaperClipIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quiz Answers */}
          {assessment.type === 'quiz' && submission.questions && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Student Answers</h3>
              <div className="space-y-6">
                {submission.questions.map((question, index) => (
                  <div key={question.id} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                        {question.points && (
                          <span className="ml-2 text-sm text-gray-500">({question.points} points)</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={question.points || maxPoints}
                          value={questionScores[question.id] || 0}
                          onChange={(e) => setQuestionScores(prev => ({
                            ...prev,
                            [question.id]: parseFloat(e.target.value) || 0
                          }))}
                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                          placeholder="Score"
                        />
                        <span className="text-sm text-gray-500">/ {question.points || 0}</span>
                      </div>
                    </div>
                    <h4 className="text-base font-medium text-gray-900 mb-3">{question.questionText}</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Student Answer: </span>
                        {typeof question.studentAnswer === 'object'
                          ? JSON.stringify(question.studentAnswer)
                          : question.studentAnswer || 'No answer provided'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Grading Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 sticky top-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Grading</h3>

            {/* Score Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Score
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max={maxPoints}
                  value={assessment.type === 'quiz' ? totalScore : score}
                  onChange={(e) => setScore(parseFloat(e.target.value) || 0)}
                  disabled={assessment.type === 'quiz'}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                />
                <span className="text-sm text-gray-500">/ {maxPoints}</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Percentage: <span className="font-medium">{percentage}%</span>
              </div>
            </div>

            {/* Rubric Scoring (for assignments) */}
            {assessment.type === 'assignment' && assessment.assignment_data?.rubric && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rubric Scoring
                </label>
                <div className="space-y-4">
                  {assessment.assignment_data.rubric.map((criteria) => {
                    const rubricScore = rubricScores[criteria.id] || { level: '', points: 0 };
                    return (
                      <div key={criteria.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{criteria.title}</span>
                          <span className="text-xs text-gray-500">{criteria.points} pts</span>
                        </div>
                        <select
                          value={rubricScore.level}
                          onChange={(e) => {
                            const level = e.target.value;
                            let points = 0;
                            if (level === 'excellent') points = criteria.points;
                            else if (level === 'good') points = criteria.points * 0.8;
                            else if (level === 'satisfactory') points = criteria.points * 0.6;
                            else if (level === 'needsImprovement') points = criteria.points * 0.4;

                            setRubricScores(prev => ({
                              ...prev,
                              [criteria.id]: { level, points }
                            }));
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm mb-2"
                        >
                          <option value="">Select level</option>
                          <option value="excellent">Excellent ({criteria.points} pts)</option>
                          <option value="good">Good ({Math.round(criteria.points * 0.8)} pts)</option>
                          <option value="satisfactory">Satisfactory ({Math.round(criteria.points * 0.6)} pts)</option>
                          <option value="needsImprovement">Needs Improvement ({Math.round(criteria.points * 0.4)} pts)</option>
                        </select>
                        {rubricScore.level && (
                          <p className="text-xs text-gray-600 mt-1">
                            {criteria.levels[rubricScore.level as keyof typeof criteria.levels]}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide feedback to the student..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Grade'}
              </button>
              <button
                onClick={() => router.push(`/tutor/assessments/${assessmentId}/submissions`)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

