/**
 * Tutor Assessments Page
 * View and manage all assessments (quizzes and assignments) created by the tutor
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  ClockIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/ui/Breadcrumb';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Assessment {
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
  submissions_count?: number;
  created_at: string;
  updated_at?: string;
  due_date?: string;
}

interface AssessmentsResponse {
  assessments: Assessment[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function TutorAssessmentsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'quiz' | 'assignment'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [filterCourse, setFilterCourse] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalAssessments, setTotalAssessments] = useState(0);

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

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        size: 20
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (filterType !== 'all') {
        params.type = filterType;
      }

      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      if (filterCourse !== 'all') {
        params.course_id = filterCourse;
      }

      // Filter by tutor's courses
      if (user?.id) {
        params.instructor_id = user.id;
      }

      const response = await apiClient.getAssessments(params);
      
      // Handle different response structures
      let assessmentsData: Assessment[] = [];
      if (Array.isArray(response.data)) {
        assessmentsData = response.data;
      } else if (response.data?.assessments && Array.isArray(response.data.assessments)) {
        assessmentsData = response.data.assessments;
        const data = response.data as AssessmentsResponse;
        setTotalPages(data.pages || 1);
        setTotalAssessments(data.total || assessmentsData.length);
      } else {
        assessmentsData = [];
      }

      setAssessments(assessmentsData);
      if (!response.data?.pages) {
        setTotalPages(1);
        setTotalAssessments(assessmentsData.length);
      }
    } catch (error: unknown) {
      console.error('Error loading assessments:', error);
      
      // Check if it's a 404 (API endpoint not implemented yet)
      if (error && typeof error === 'object' && 'status' in error && (error as { status?: number }).status === 404) {
        // API endpoint not available yet - show empty state instead of error
        setAssessments([]);
        setTotalPages(1);
        setTotalAssessments(0);
        setError(''); // Clear error to show empty state message instead
      } else {
        // Other errors - show error message
        const errorMessage = error && typeof error === 'object' && 'message' in error
          ? (error as { message?: string }).message
          : undefined;
        setError(errorMessage || 'Failed to load assessments. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user?.role === 'tutor') {
      loadAssessments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, currentPage, searchTerm, filterType, filterStatus, filterCourse]);

  const handleViewAssessment = (assessmentId: number) => {
    router.push(`/tutor/assessments/${assessmentId}`);
  };

  const handleEditAssessment = (assessmentId: number) => {
    router.push(`/tutor/assessments/${assessmentId}/edit`);
  };

  const handleDeleteAssessment = async (assessmentId: number) => {
    if (confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
      try {
        // TODO: Implement delete API call
        // await apiClient.deleteAssessment(assessmentId);
        // loadAssessments();
        console.log('Delete assessment:', assessmentId);
        alert('Delete functionality will be implemented soon.');
      } catch (error) {
        console.error('Error deleting assessment:', error);
        alert('Failed to delete assessment. Please try again.');
      }
    }
  };

  // Get unique courses for filter
  const courses = ['all', ...Array.from(new Set(assessments.map(a => a.course_title).filter(Boolean)))];
  const uniqueCourses = courses.filter((course, index, self) => self.indexOf(course) === index);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get type color
  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'quiz':
        return 'bg-blue-100 text-blue-800';
      case 'assignment':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading assessments...'}
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
          <p className="text-gray-600">Manage your quizzes and assignments</p>
        </div>
        <button
          onClick={() => router.push('/tutor/assessments/create')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Assessment
        </button>
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

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as 'all' | 'quiz' | 'assignment');
                setCurrentPage(1);
              }}
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
              onChange={(e) => {
                setFilterStatus(e.target.value as 'all' | 'draft' | 'published' | 'archived');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <select
              value={filterCourse}
              onChange={(e) => {
                setFilterCourse(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {uniqueCourses.map(course => (
                <option key={course} value={course === 'all' ? 'all' : course}>
                  {course === 'all' ? 'All Courses' : course}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assessments List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Questions/Points
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          {assessment.type === 'quiz' ? (
                            <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
                          ) : (
                            <BookOpenIcon className="h-6 w-6 text-purple-600" />
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{assessment.title}</div>
                        {assessment.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">{assessment.description}</div>
                        )}
                        {assessment.due_date && (
                          <div className="text-xs text-gray-400 mt-1">
                            Due: {new Date(assessment.due_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(assessment.type)}`}>
                      {assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {assessment.course_title || '—'}
                    </div>
                    {assessment.topic_title && (
                      <div className="text-xs text-gray-500">{assessment.topic_title}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {assessment.type === 'quiz' ? (
                        <>
                          {assessment.total_questions || 0} questions
                          {assessment.total_points && (
                            <span className="text-xs text-gray-500 ml-2">
                              ({assessment.total_points} pts)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          {assessment.total_points || 0} points
                        </>
                      )}
                    </div>
                    {assessment.time_limit && (
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {assessment.time_limit} min
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UsersIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {assessment.submissions_count || 0}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assessment.status)}`}>
                      {assessment.status || 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(assessment.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewAssessment(assessment.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View Assessment"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditAssessment(assessment.id)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit Assessment"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAssessment(assessment.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Assessment"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {assessments.length === 0 && !loading && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterCourse !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first assessment.'}
            </p>
            {!searchTerm && filterType === 'all' && filterStatus === 'all' && filterCourse === 'all' && (
              <div className="mt-6">
                <button
                  onClick={() => router.push('/tutor/assessments/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Assessment
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * 20 + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * 20, totalAssessments)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{totalAssessments}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                    let page;
                    if (totalPages <= 10) {
                      page = i + 1;
                    } else if (currentPage <= 5) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 4) {
                      page = totalPages - 9 + i;
                    } else {
                      page = currentPage - 4 + i;
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

