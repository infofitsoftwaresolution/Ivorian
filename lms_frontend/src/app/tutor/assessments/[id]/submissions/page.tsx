/**
 * Assessment Submissions Page
 * Tutor page for viewing all student submissions for an assessment
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  UserIcon,
  ArrowLeftIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface Submission {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  submitted_at: string;
  score?: number;
  total_points?: number;
  percentage?: number;
  grade?: string;
  status: 'submitted' | 'graded' | 'returned' | 'late';
  time_taken?: number;
  is_late?: boolean;
  attempts?: number;
}

interface Assessment {
  id: number;
  title: string;
  description?: string;
  type: 'quiz' | 'assignment';
  total_points?: number;
  due_date?: string;
  course_title?: string;
  submissions_count?: number;
}

type FilterStatus = 'all' | 'submitted' | 'graded' | 'returned' | 'late';

export default function AssessmentSubmissionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params?.id as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

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
    if (!authLoading && user?.role === 'tutor' && assessmentId) {
      loadData();
    }
  }, [user, authLoading, assessmentId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load assessment
      const assessmentResponse = await apiClient.getAssessment(parseInt(assessmentId));
      setAssessment(assessmentResponse.data);

      // TODO: Load submissions from API when available
      // const submissionsResponse = await apiClient.getAssessmentSubmissions(parseInt(assessmentId));
      // setSubmissions(submissionsResponse.data);

      // Mock submissions data
      const mockSubmissions: Submission[] = [
        {
          id: 1,
          student_id: 1,
          student_name: 'John Doe',
          student_email: 'john@example.com',
          submitted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          score: 85,
          total_points: 100,
          percentage: 85,
          grade: 'B',
          status: 'graded',
          time_taken: 1800,
          is_late: false,
          attempts: 1
        },
        {
          id: 2,
          student_id: 2,
          student_name: 'Jane Smith',
          student_email: 'jane@example.com',
          submitted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          score: 92,
          total_points: 100,
          percentage: 92,
          grade: 'A',
          status: 'graded',
          time_taken: 2100,
          is_late: false,
          attempts: 1
        },
        {
          id: 3,
          student_id: 3,
          student_name: 'Bob Johnson',
          student_email: 'bob@example.com',
          submitted_at: new Date().toISOString(),
          status: 'submitted',
          is_late: true,
          attempts: 1
        },
        {
          id: 4,
          student_id: 4,
          student_name: 'Alice Williams',
          student_email: 'alice@example.com',
          submitted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          score: 78,
          total_points: 100,
          percentage: 78,
          grade: 'C',
          status: 'returned',
          time_taken: 1500,
          is_late: false,
          attempts: 2
        }
      ];

      setSubmissions(mockSubmissions);
    } catch (error: unknown) {
      console.error('Error loading submissions:', error);
      setError('Failed to load submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(submission => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        submission.student_name.toLowerCase().includes(searchLower) ||
        submission.student_email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Status filter
    if (filterStatus !== 'all' && submission.status !== filterStatus) {
      return false;
    }

    return true;
  });

  const getStatusBadge = (submission: Submission) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

    switch (submission.status) {
      case 'graded':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Graded
          </span>
        );
      case 'returned':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Returned
          </span>
        );
      case 'late':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
            Late
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <ClockIcon className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Calculate stats
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.status === 'submitted').length,
    graded: submissions.filter(s => s.status === 'graded').length,
    late: submissions.filter(s => s.is_late).length,
    averageScore: submissions.filter(s => s.score !== undefined).length > 0
      ? Math.round(submissions.filter(s => s.score !== undefined).reduce((acc, s) => acc + (s.percentage || 0), 0) / submissions.filter(s => s.score !== undefined).length)
      : 0
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading submissions...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not tutor or no assessment
  if (!user || user.role !== 'tutor' || !assessment) {
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
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/tutor/assessments')}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
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
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push(`/tutor/assessments/${assessmentId}/analytics`)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              View Analytics
            </button>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
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
                <ClockIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.pending}</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Late</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.late}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                  <dd className="text-lg font-semibold text-gray-900">{stats.averageScore}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="submitted">Pending</option>
              <option value="graded">Graded</option>
              <option value="returned">Returned</option>
              <option value="late">Late</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Taken
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {submission.student_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{submission.student_name}</div>
                        <div className="text-sm text-gray-500">{submission.student_email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(submission.submitted_at).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(submission.submitted_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(submission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {submission.score !== undefined ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {submission.score} / {submission.total_points || assessment.total_points || 100}
                        </div>
                        <div className="text-sm text-gray-500">
                          {submission.percentage}% {submission.grade && `(${submission.grade})`}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(submission.time_taken)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.attempts || 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => router.push(`/tutor/assessments/${assessmentId}/grade/${submission.id}`)}
                      className={`${
                        submission.status === 'submitted' || submission.status === 'late'
                          ? 'text-indigo-600 hover:text-indigo-900'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      title={submission.status === 'submitted' || submission.status === 'late' ? 'Grade' : 'View/Edit Grade'}
                    >
                      {submission.status === 'submitted' || submission.status === 'late' ? (
                        <PencilIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredSubmissions.length === 0 && (
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No submissions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'No students have submitted this assessment yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

