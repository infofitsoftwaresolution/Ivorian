/**
 * Create Assessment Page
 * Tutor page for creating new assessments (quizzes or assignments)
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  DocumentTextIcon,
  ArrowLeftIcon,
  BookOpenIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';
import AdvancedQuizBuilder from '@/components/course/AdvancedQuizBuilder';
import AdvancedAssignmentBuilder from '@/components/course/AdvancedAssignmentBuilder';

// Form validation schema
const assessmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['quiz', 'assignment']),
  course_id: z.number().optional(),
  topic_id: z.number().optional(),
  time_limit: z.number().min(0).optional(),
  passing_score: z.number().min(0).max(100).optional(),
  attempts_allowed: z.number().min(1).optional(),
  due_date: z.string().optional(),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface Course {
  id: number;
  title: string;
}

export default function CreateAssessmentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [showAssignmentBuilder, setShowAssignmentBuilder] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [assignmentData, setAssignmentData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      type: 'quiz',
      status: 'draft',
    }
  });

  const assessmentType = watch('type');
  const selectedCourseId = watch('course_id');

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

  // Load tutor's courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await apiClient.getCourses();
        
        let coursesData: Course[] = [];
        if (Array.isArray(response.data)) {
          coursesData = response.data;
        } else if (response.data?.courses && Array.isArray(response.data.courses)) {
          coursesData = response.data.courses;
        }

        setCourses(coursesData);
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    if (user?.role === 'tutor') {
      loadCourses();
    }
  }, [user]);

  // Load topics when course is selected
  const [availableTopics, setAvailableTopics] = useState<Array<{ id: number; title: string }>>([]);
  
  useEffect(() => {
    const loadTopics = async () => {
      if (!selectedCourseId) {
        setAvailableTopics([]);
        return;
      }

      try {
        const response = await apiClient.getCourseTopics(selectedCourseId);
        let topicsData: Array<{ id: number; title: string }> = [];
        
        if (Array.isArray(response.data)) {
          topicsData = response.data;
        } else if (response.data?.topics && Array.isArray(response.data.topics)) {
          topicsData = response.data.topics;
        }

        setAvailableTopics(topicsData);
      } catch (error) {
        console.error('Error loading topics:', error);
        setAvailableTopics([]);
      }
    };

    loadTopics();
  }, [selectedCourseId]);

  const handleQuizSave = (questions: any[]) => {
    setQuizQuestions(questions);
    setShowQuizBuilder(false);
  };

  const handleAssignmentSave = (assignment: any) => {
    setAssignmentData(assignment);
    setShowAssignmentBuilder(false);
  };

  const onSubmit = async (data: AssessmentFormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Validate that quiz has questions or assignment has data
      if (data.type === 'quiz' && quizQuestions.length === 0) {
        setError('Please add at least one question to the quiz.');
        setLoading(false);
        return;
      }

      if (data.type === 'assignment' && !assignmentData) {
        setError('Please complete the assignment details.');
        setLoading(false);
        return;
      }

      // Prepare assessment data
      const assessmentData: Record<string, any> = {
        title: data.title,
        description: data.description || '',
        type: data.type,
        status: data.status,
        instructor_id: user?.id,
      };

      if (data.course_id) {
        assessmentData.course_id = data.course_id;
      }

      if (data.topic_id) {
        assessmentData.topic_id = data.topic_id;
      }

      if (data.time_limit) {
        assessmentData.time_limit = data.time_limit;
      }

      if (data.passing_score) {
        assessmentData.passing_score = data.passing_score;
      }

      if (data.attempts_allowed) {
        assessmentData.attempts_allowed = data.attempts_allowed;
      }

      if (data.due_date) {
        assessmentData.due_date = data.due_date;
      }

      // Add quiz or assignment specific data
      if (data.type === 'quiz') {
        assessmentData.questions = quizQuestions;
        assessmentData.total_questions = quizQuestions.length;
        assessmentData.total_points = quizQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
      } else {
        assessmentData.assignment_data = assignmentData;
        assessmentData.total_points = assignmentData.maxPoints || 100;
      }

      console.log('Creating assessment with data:', assessmentData);
      
      // Call backend API
      const response = await apiClient.createAssessment(assessmentData);
      console.log('Assessment created successfully:', response);
      
      // Show success message
      setSuccess('Assessment created successfully! Redirecting to assessments list...');
      
      // Reset form
      reset();
      setQuizQuestions([]);
      setAssignmentData(null);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/tutor/assessments');
      }, 2000);

    } catch (err: any) {
      console.error('Error creating assessment:', err);
      console.log('Error object:', JSON.stringify(err, null, 2));
      console.log('Error details:', err.details);
      
      let errorMessage = 'Failed to create assessment';
      
      if (err instanceof ApiError) {
        errorMessage = err.message;
      } else if (err instanceof Error && err.message) {
        errorMessage = err.message;
      } else if (err.message && !err.message.startsWith('HTTP')) {
        errorMessage = err.message;
      } else if (err.details) {
        if (err.details.detail) {
          if (Array.isArray(err.details.detail)) {
            errorMessage = err.details.detail.map((e: any) => {
              if (typeof e === 'string') return e;
              if (e.msg) return `${e.loc?.join('.') || 'Field'}: ${e.msg}`;
              return JSON.stringify(e);
            }).join(', ');
          } else if (typeof err.details.detail === 'string') {
            errorMessage = err.details.detail;
          }
        } else if (err.details.message) {
          errorMessage = err.details.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authLoading || loadingCourses) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading courses...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not tutor
  if (!user || user.role !== 'tutor') {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Assessment</h1>
            <p className="text-gray-600">Create a new quiz or assignment</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="mt-1 text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assessment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assessment Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setValue('type', 'quiz');
                    setShowQuizBuilder(false);
                    setShowAssignmentBuilder(false);
                  }}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    assessmentType === 'quiz'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <DocumentTextIcon className={`h-8 w-8 mx-auto mb-2 ${
                    assessmentType === 'quiz' ? 'text-indigo-600' : 'text-gray-400'
                  }`} />
                  <div className={`font-medium ${
                    assessmentType === 'quiz' ? 'text-indigo-900' : 'text-gray-700'
                  }`}>
                    Quiz
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('type', 'assignment');
                    setShowQuizBuilder(false);
                    setShowAssignmentBuilder(false);
                  }}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    assessmentType === 'assignment'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <BookOpenIcon className={`h-8 w-8 mx-auto mb-2 ${
                    assessmentType === 'assignment' ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <div className={`font-medium ${
                    assessmentType === 'assignment' ? 'text-purple-900' : 'text-gray-700'
                  }`}>
                    Assignment
                  </div>
                </button>
              </div>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>

            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('title')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter assessment title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter assessment description (optional)"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Course Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course (Optional)
              </label>
              <select
                {...register('course_id', { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a course (optional)</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              {errors.course_id && (
                <p className="mt-1 text-sm text-red-600">{errors.course_id.message}</p>
              )}
            </div>

            {/* Topic Selection (only if course is selected) */}
            {selectedCourseId && availableTopics.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic (Optional)
                </label>
                <select
                  {...register('topic_id', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select a topic (optional)</option>
                  {availableTopics.map(topic => (
                    <option key={topic.id} value={topic.id}>
                      {topic.title}
                    </option>
                  ))}
                </select>
                {errors.topic_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.topic_id.message}</p>
                )}
              </div>
            )}

            {/* Time Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <div className="relative">
                <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  {...register('time_limit', { valueAsNumber: true })}
                  min="0"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="No limit"
                />
              </div>
              {errors.time_limit && (
                <p className="mt-1 text-sm text-red-600">{errors.time_limit.message}</p>
              )}
            </div>

            {/* Passing Score (for quizzes) */}
            {assessmentType === 'quiz' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  {...register('passing_score', { valueAsNumber: true })}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 70"
                />
                {errors.passing_score && (
                  <p className="mt-1 text-sm text-red-600">{errors.passing_score.message}</p>
                )}
              </div>
            )}

            {/* Attempts Allowed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attempts Allowed
              </label>
              <input
                type="number"
                {...register('attempts_allowed', { valueAsNumber: true })}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Unlimited"
              />
              {errors.attempts_allowed && (
                <p className="mt-1 text-sm text-red-600">{errors.attempts_allowed.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <input
                type="datetime-local"
                {...register('due_date')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quiz Builder or Assignment Builder */}
        {assessmentType === 'quiz' ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Quiz Questions</h2>
              {quizQuestions.length > 0 && (
                <span className="text-sm text-gray-500">
                  {quizQuestions.length} question{quizQuestions.length !== 1 ? 's' : ''} added
                </span>
              )}
            </div>
            
            {!showQuizBuilder ? (
              <div>
                {quizQuestions.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No questions added</h3>
                    <p className="mt-1 text-sm text-gray-500">Click the button below to start building your quiz</p>
                    <button
                      type="button"
                      onClick={() => setShowQuizBuilder(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Add Questions
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quizQuestions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                {question.type}
                              </span>
                              {question.points && (
                                <span className="text-xs text-gray-500">
                                  {question.points} pts
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-900">{question.question || question.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setShowQuizBuilder(true)}
                      className="w-full mt-4 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:border-indigo-500 hover:text-indigo-600"
                    >
                      {quizQuestions.length > 0 ? 'Add More Questions' : 'Add Questions'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <AdvancedQuizBuilder
                onSave={handleQuizSave}
                onCancel={() => setShowQuizBuilder(false)}
                initialQuestions={quizQuestions}
              />
            )}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Assignment Details</h2>
              {assignmentData && (
                <span className="text-sm text-gray-500">
                  Assignment configured
                </span>
              )}
            </div>
            
            {!showAssignmentBuilder ? (
              <div>
                {!assignmentData ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No assignment details</h3>
                    <p className="mt-1 text-sm text-gray-500">Click the button below to configure your assignment</p>
                    <button
                      type="button"
                      onClick={() => setShowAssignmentBuilder(true)}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                    >
                      Configure Assignment
                    </button>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Title:</span>
                        <span className="ml-2 text-sm text-gray-900">{assignmentData.title}</span>
                      </div>
                      {assignmentData.description && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Description:</span>
                          <span className="ml-2 text-sm text-gray-900">{assignmentData.description}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-500">Max Points:</span>
                        <span className="ml-2 text-sm text-gray-900">{assignmentData.maxPoints || 100}</span>
                      </div>
                      {assignmentData.dueDate && (
                        <div>
                          <span className="text-sm font-medium text-gray-500">Due Date:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(assignmentData.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAssignmentBuilder(true)}
                      className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit Assignment Details
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <AdvancedAssignmentBuilder
                onSave={handleAssignmentSave}
                onCancel={() => setShowAssignmentBuilder(false)}
                initialAssignment={assignmentData}
              />
            )}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-4 bg-white shadow rounded-lg p-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              'Create Assessment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

