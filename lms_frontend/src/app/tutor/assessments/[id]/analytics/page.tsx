/**
 * Assessment Analytics Page
 * Tutor page for viewing assessment analytics and statistics
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  ArrowLeftIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Assessment {
  id: number;
  title: string;
  description?: string;
  type: 'quiz' | 'assignment';
  total_points?: number;
  course_title?: string;
  submissions_count?: number;
}

interface AnalyticsData {
  overview: {
    total_submissions: number;
    graded: number;
    pending: number;
    average_score: number;
    pass_rate: number;
    completion_rate: number;
  };
  score_distribution: {
    labels: string[];
    data: number[];
  };
  submission_timeline: {
    labels: string[];
    data: number[];
  };
  question_performance?: {
    labels: string[];
    correct: number[];
    incorrect: number[];
  };
  top_students: Array<{
    id: number;
    name: string;
    score: number;
    percentage: number;
  }>;
}

export default function AssessmentAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const assessmentId = params?.id as string;
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      // TODO: Load analytics from API when available
      // const analyticsResponse = await apiClient.getAssessmentAnalytics(parseInt(assessmentId));
      // setAnalytics(analyticsResponse.data);

      // Mock analytics data
      const mockAnalytics: AnalyticsData = {
        overview: {
          total_submissions: 45,
          graded: 38,
          pending: 7,
          average_score: 82,
          pass_rate: 76,
          completion_rate: 90
        },
        score_distribution: {
          labels: ['0-50', '51-60', '61-70', '71-80', '81-90', '91-100'],
          data: [2, 3, 5, 12, 15, 8]
        },
        submission_timeline: {
          labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
          data: [5, 8, 12, 10, 6, 3, 1]
        },
        question_performance: assessmentResponse.data.type === 'quiz' ? {
          labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'],
          correct: [42, 38, 40, 35, 39],
          incorrect: [3, 7, 5, 10, 6]
        } : undefined,
        top_students: [
          { id: 1, name: 'Jane Smith', score: 95, percentage: 95 },
          { id: 2, name: 'John Doe', score: 92, percentage: 92 },
          { id: 3, name: 'Alice Williams', score: 90, percentage: 90 },
          { id: 4, name: 'Bob Johnson', score: 88, percentage: 88 },
          { id: 5, name: 'Charlie Brown', score: 87, percentage: 87 }
        ]
      };

      setAnalytics(mockAnalytics);
    } catch (error: unknown) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  const scoreDistributionChartData = {
    labels: analytics?.score_distribution.labels || [],
    datasets: [
      {
        label: 'Number of Students',
        data: analytics?.score_distribution.data || [],
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      }
    ]
  };

  const submissionTimelineChartData = {
    labels: analytics?.submission_timeline.labels || [],
    datasets: [
      {
        label: 'Submissions',
        data: analytics?.submission_timeline.data || [],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const questionPerformanceChartData = analytics?.question_performance ? {
    labels: analytics.question_performance.labels,
    datasets: [
      {
        label: 'Correct',
        data: analytics.question_performance.correct,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      },
      {
        label: 'Incorrect',
        data: analytics.question_performance.incorrect,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      }
    ]
  } : null;

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading analytics...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not tutor or no assessment/analytics
  if (!user || user.role !== 'tutor' || !assessment || !analytics) {
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
                onClick={() => router.push(`/tutor/assessments/${assessmentId}/submissions`)}
                className="text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{assessment.title} - Analytics</h1>
                {assessment.course_title && (
                  <p className="text-sm text-gray-500 mt-1">
                    <BookOpenIcon className="h-4 w-4 inline mr-1" />
                    {assessment.course_title}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Submissions</dt>
                  <dd className="text-lg font-semibold text-gray-900">{analytics.overview.total_submissions}</dd>
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
                  <dd className="text-lg font-semibold text-gray-900">{analytics.overview.graded}</dd>
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
                  <dd className="text-lg font-semibold text-gray-900">{analytics.overview.pending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                  <dd className="text-lg font-semibold text-gray-900">{analytics.overview.average_score}%</dd>
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
                  <dt className="text-sm font-medium text-gray-500 truncate">Pass Rate</dt>
                  <dd className="text-lg font-semibold text-gray-900">{analytics.overview.pass_rate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completion</dt>
                  <dd className="text-lg font-semibold text-gray-900">{analytics.overview.completion_rate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Score Distribution</h3>
          <div className="h-64">
            <Bar data={scoreDistributionChartData} options={chartOptions} />
          </div>
        </div>

        {/* Submission Timeline */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Submission Timeline</h3>
          <div className="h-64">
            <Line data={submissionTimelineChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Question Performance (for quizzes) */}
      {assessment.type === 'quiz' && questionPerformanceChartData && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Question Performance</h3>
          <div className="h-64">
            <Bar data={questionPerformanceChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Top Students */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performers</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.top_students.map((student, index) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-lg font-bold ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        #{index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.score} / {assessment.total_points || 100}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${student.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">{student.percentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

