/**
 * Student Assignments Page
 * View and manage all assignments and quizzes assigned to the student
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  PaperClipIcon,
  EyeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface Assignment {
  id: number;
  title: string;
  description?: string;
  type: 'quiz' | 'assignment';
  course_id?: number;
  course_title?: string;
  topic_id?: number;
  topic_title?: string;
  status: 'draft' | 'published' | 'archived';
  total_questions?: number;
  total_points?: number;
  time_limit?: number; // in minutes
  passing_score?: number;
  attempts_allowed?: number;
  attempts_used?: number;
  created_at: string;
  due_date?: string;
  submission_status?: 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'overdue';
  submission?: {
    id: number;
    submitted_at: string;
    score?: number;
    grade?: string;
    feedback?: string;
    status: string;
  };
  is_overdue?: boolean;
  days_until_due?: number;
}

type FilterType = 'all' | 'quiz' | 'assignment';
type FilterStatus = 'all' | 'not_started' | 'in_progress' | 'submitted' | 'graded' | 'overdue';

export default function StudentAssignmentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

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
    if (!authLoading && user?.role === 'student') {
      loadAssignments();
    }
  }, [user, authLoading]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError('');

      let assessments: Assignment[] = [];
      let enrollments: any[] = [];

      // Fetch all published assessments
      try {
        const response = await apiClient.getAssessments({ status: 'published' });
        
        if (Array.isArray(response.data)) {
          assessments = response.data;
        } else if (response.data?.assessments && Array.isArray(response.data.assessments)) {
          assessments = response.data.assessments;
        }
      } catch (assessmentsError: unknown) {
        // Gracefully handle 404 (endpoint not implemented yet)
        if (assessmentsError && typeof assessmentsError === 'object' && 'response' in assessmentsError) {
          const apiError = assessmentsError as { response?: { status?: number } };
          if (apiError.response?.status === 404) {
            console.log('Assessments endpoint not available yet');
            assessments = [];
          } else {
            throw assessmentsError;
          }
        } else {
          throw assessmentsError;
        }
      }

      // Get student's enrolled courses to filter assignments
      try {
        const enrollmentsResponse = await apiClient.getMyEnrollments();
        if (Array.isArray(enrollmentsResponse.data)) {
          enrollments = enrollmentsResponse.data;
        } else if (enrollmentsResponse.data?.enrollments && Array.isArray(enrollmentsResponse.data.enrollments)) {
          enrollments = enrollmentsResponse.data.enrollments;
        }
      } catch (enrollmentsError: unknown) {
        // Gracefully handle 404 (endpoint not implemented yet)
        if (enrollmentsError && typeof enrollmentsError === 'object' && 'response' in enrollmentsError) {
          const apiError = enrollmentsError as { response?: { status?: number } };
          if (apiError.response?.status === 404) {
            console.log('Enrollments endpoint not available yet');
            enrollments = [];
          } else {
            throw enrollmentsError;
          }
        } else {
          throw enrollmentsError;
        }
      }

      const enrolledCourseIds = enrollments.map((e: any) => e.course_id || e.course?.id).filter(Boolean);

      // Filter assessments to only show those from enrolled courses
      const studentAssignments = assessments
        .filter(assessment => !assessment.course_id || enrolledCourseIds.includes(assessment.course_id))
        .map(assessment => {
          // Calculate submission status and due date info
          const dueDate = assessment.due_date ? new Date(assessment.due_date) : null;
          const now = new Date();
          const isOverdue = dueDate && dueDate < now && !assessment.submission?.submitted_at;
          const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

          // Determine submission status (mock data - TODO: Replace with actual API data)
          let submissionStatus: Assignment['submission_status'] = 'not_started';
          if (assessment.submission?.submitted_at) {
            if (assessment.submission.status === 'graded') {
              submissionStatus = 'graded';
            } else {
              submissionStatus = 'submitted';
            }
          } else if (isOverdue) {
            submissionStatus = 'overdue';
          }

          return {
            ...assessment,
            submission_status: submissionStatus,
            is_overdue: isOverdue ?? false,
            days_until_due: daysUntilDue ?? null,
            attempts_used: assessment.attempts_used || 0
          } as Assignment;
        });

      setAssignments(studentAssignments);
    } catch (error: unknown) {
      console.error('Error loading assignments:', error);
      setError('Failed to load assignments. Please try again.');
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter assignments based on search and filters
  const filteredAssignments = assignments.filter(assignment => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        assignment.title.toLowerCase().includes(searchLower) ||
        assignment.description?.toLowerCase().includes(searchLower) ||
        assignment.course_title?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filterType !== 'all' && assignment.type !== filterType) {
      return false;
    }

    // Status filter
    if (filterStatus !== 'all' && assignment.submission_status !== filterStatus) {
      return false;
    }

    return true;
  });

  // Get status badge
  const getStatusBadge = (assignment: Assignment) => {
    const status = assignment.submission_status || 'not_started';
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    switch (status) {
      case 'graded':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Graded
          </span>
        );
      case 'submitted':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <ClockIcon className="h-3 w-3 mr-1" />
            Submitted
          </span>
        );
      case 'in_progress':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <ClockIcon className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      case 'overdue':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Overdue
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <XCircleIcon className="h-3 w-3 mr-1" />
            Not Started
          </span>
        );
    }
  };

  // Get due date display
  const getDueDateDisplay = (assignment: Assignment) => {
    if (!assignment.due_date) return null;

    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    const isOverdue = dueDate < now && !assignment.submission?.submitted_at;
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (isOverdue) {
      const daysOverdue = Math.abs(daysUntilDue);
      return (
        <span className="text-red-600 font-medium">
          {daysOverdue === 0 ? 'Due today' : `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`}
        </span>
      );
    } else if (daysUntilDue === 0) {
      return <span className="text-orange-600 font-medium">Due today</span>;
    } else if (daysUntilDue === 1) {
      return <span className="text-orange-600 font-medium">Due tomorrow</span>;
    } else if (daysUntilDue <= 7) {
      return <span className="text-yellow-600 font-medium">{daysUntilDue} days left</span>;
    } else {
      return <span className="text-gray-600">{dueDate.toLocaleDateString()}</span>;
    }
  };

  const handleViewAssignment = (assignment: Assignment) => {
    if (assignment.type === 'quiz') {
      router.push(`/student/assignments/${assignment.id}/take`);
    } else {
      router.push(`/student/assignments/${assignment.id}/submit`);
    }
  };

  const handleViewResults = (assignment: Assignment) => {
    router.push(`/student/assignments/${assignment.id}/results`);
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading assignments...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not student
  if (!user || user.role !== 'student') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    total: assignments.length,
    notStarted: assignments.filter(a => a.submission_status === 'not_started').length,
    inProgress: assignments.filter(a => a.submission_status === 'in_progress').length,
    submitted: assignments.filter(a => a.submission_status === 'submitted').length,
    graded: assignments.filter(a => a.submission_status === 'graded').length,
    overdue: assignments.filter(a => a.submission_status === 'overdue').length
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
        <p className="text-gray-600">View and submit your assignments and quizzes</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Not Started</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.notStarted}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.inProgress}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Submitted</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.submitted}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Graded</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.graded}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.overdue}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="quiz">Quizzes</option>
              <option value="assignment">Assignments</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredAssignments.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'You don\'t have any assignments yet. Assignments will appear here when your instructors create them.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {assignment.type === 'quiz' ? (
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <PaperClipIcon className="h-6 w-6 text-purple-600" />
                              </div>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-medium text-gray-900">{assignment.title}</h3>
                              {getStatusBadge(assignment)}
                            </div>
                            {assignment.description && (
                              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{assignment.description}</p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              {assignment.course_title && (
                                <div className="flex items-center">
                                  <BookOpenIcon className="h-4 w-4 mr-1" />
                                  {assignment.course_title}
                                </div>
                              )}
                              {assignment.total_points && (
                                <div className="flex items-center">
                                  <span>{assignment.total_points} points</span>
                                </div>
                              )}
                              {assignment.time_limit && (
                                <div className="flex items-center">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  {assignment.time_limit} min
                                </div>
                              )}
                              {assignment.attempts_allowed && (
                                <div className="flex items-center">
                                  <span>
                                    {assignment.attempts_used || 0} / {assignment.attempts_allowed} attempts
                                  </span>
                                </div>
                              )}
                              {assignment.due_date && (
                                <div className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  {getDueDateDisplay(assignment)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    {assignment.submission_status === 'graded' && assignment.submission?.score !== undefined && (
                      <div className="text-right mr-4">
                        <div className="text-lg font-semibold text-gray-900">
                          {assignment.submission.score} / {assignment.total_points || 100}
                        </div>
                        {assignment.submission.grade && (
                          <div className="text-sm text-gray-500">Grade: {assignment.submission.grade}</div>
                        )}
                      </div>
                    )}
                    {assignment.submission_status === 'graded' ? (
                      <button
                        onClick={() => handleViewResults(assignment)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        View Results
                      </button>
                    ) : (
                      <button
                        onClick={() => handleViewAssignment(assignment)}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                          assignment.submission_status === 'overdue'
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                      >
                        {assignment.submission_status === 'not_started' || assignment.submission_status === 'overdue'
                          ? 'Start'
                          : assignment.submission_status === 'in_progress'
                          ? 'Continue'
                          : 'View'}
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

