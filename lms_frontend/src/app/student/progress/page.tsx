/**
 * Student Progress Page
 * Comprehensive progress tracking and analytics for students
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import Image from 'next/image';
import { 
  ChartBarIcon,
  BookOpenIcon,
  ClockIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  TrophyIcon,
  FireIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  StarIcon
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';

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

interface EnrolledCourse {
  id: number;
  course_id: number;
  course: {
    id: number;
    title: string;
    description: string;
    thumbnail_url?: string;
    total_lessons: number;
    total_duration: number;
    category?: string;
    difficulty_level?: string;
  };
  status: string;
  progress_percentage: number;
  enrolled_at: string;
  completed_at?: string;
}

interface ProgressData {
  overview: {
    total_courses: number;
    completed_courses: number;
    in_progress_courses: number;
    total_lessons: number;
    completed_lessons: number;
    total_study_time: number;
    average_score: number;
    current_streak: number;
    longest_streak: number;
    certificates_earned: number;
  };
  progress_trend: {
    labels: string[];
    data: number[];
  };
  course_progress: {
    labels: string[];
    data: number[];
  };
  time_spent: {
    labels: string[];
    data: number[];
  };
  category_distribution: {
    labels: string[];
    data: number[];
  };
}

type TimePeriod = '7d' | '30d' | '90d' | 'all';

export default function StudentProgressPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('30d');
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
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
    if (!authLoading && user?.role === 'student') {
      loadProgressData();
    }
  }, [user, authLoading, timePeriod]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch enrolled courses
      const enrollmentsResponse = await apiClient.getMyEnrollments();
      let enrollments: EnrolledCourse[] = [];
      
      if (Array.isArray(enrollmentsResponse.data)) {
        enrollments = enrollmentsResponse.data;
      } else if (enrollmentsResponse.data?.enrollments && Array.isArray(enrollmentsResponse.data.enrollments)) {
        enrollments = enrollmentsResponse.data.enrollments;
      }

      setEnrolledCourses(enrollments);

      // Calculate progress data
      const totalCourses = enrollments.length;
      const completedCourses = enrollments.filter(e => e.status === 'completed' || e.progress_percentage >= 100).length;
      const inProgressCourses = enrollments.filter(e => e.status === 'active' && e.progress_percentage < 100).length;
      const totalLessons = enrollments.reduce((acc, e) => acc + (e.course?.total_lessons || 0), 0);
      const completedLessons = enrollments.reduce((acc, e) => {
        const courseLessons = e.course?.total_lessons || 0;
        return acc + Math.floor((e.progress_percentage || 0) * courseLessons / 100);
      }, 0);
      const averageProgress = enrollments.length > 0
        ? enrollments.reduce((acc, e) => acc + (e.progress_percentage || 0), 0) / enrollments.length
        : 0;

      // Progress data - overview from actual enrollments, charts will be empty until API is implemented
      const progressData: ProgressData = {
        overview: {
          total_courses: totalCourses,
          completed_courses: completedCourses,
          in_progress_courses: inProgressCourses,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          total_study_time: 0, // TODO: Implement study time tracking
          average_score: Math.round(averageProgress),
          current_streak: 0, // TODO: Implement streak tracking
          longest_streak: 0, // TODO: Implement streak tracking
          certificates_earned: completedCourses
        },
        progress_trend: {
          labels: [],
          data: []
        },
        course_progress: {
          labels: enrollments.slice(0, 5).map(e => e.course?.title || 'Course').slice(0, 20),
          data: enrollments.slice(0, 5).map(e => e.progress_percentage || 0)
        },
        time_spent: {
          labels: [],
          data: []
        },
        category_distribution: {
          labels: [],
          data: []
        }
      };

      setProgressData(progressData);
    } catch (error: unknown) {
      console.error('Error loading progress data:', error);
      setError('Failed to load progress data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const progressTrendChartData = {
    labels: progressData?.progress_trend.labels || [],
    datasets: [
      {
        label: 'Overall Progress (%)',
        data: progressData?.progress_trend.data || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const courseProgressChartData = {
    labels: progressData?.course_progress.labels || [],
    datasets: [
      {
        label: 'Progress (%)',
        data: progressData?.course_progress.data || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  };

  const timeSpentChartData = {
    labels: progressData?.time_spent.labels || [],
    datasets: [
      {
        label: 'Study Time (minutes)',
        data: progressData?.time_spent.data || [],
        backgroundColor: 'rgba(234, 179, 8, 0.8)',
        borderColor: 'rgb(234, 179, 8)',
        borderWidth: 1
      }
    ]
  };

  const categoryDistributionChartData = {
    labels: progressData?.category_distribution.labels || [],
    datasets: [
      {
        data: progressData?.category_distribution.data || [],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderColor: [
          'rgb(99, 102, 241)',
          'rgb(34, 197, 94)',
          'rgb(234, 179, 8)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      filler: {
        propagate: false,
      },
    },
  };

  const formatStudyTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading progress data...'}
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

  if (!progressData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-600">No progress data available</p>
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
          <h1 className="text-2xl font-bold text-gray-900">My Progress</h1>
          <p className="text-gray-600">Track your learning journey and achievements</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative w-48">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Courses */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Enrolled Courses</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {progressData.overview.total_courses}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      {progressData.overview.completed_courses} completed
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed Lessons</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {progressData.overview.completed_lessons}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      of {progressData.overview.total_lessons}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Study Time */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Study Time</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {formatStudyTime(progressData.overview.total_study_time)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FireIcon className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Current Streak</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {progressData.overview.current_streak}
                    </div>
                    <div className="ml-2 text-sm text-gray-500">
                      days (best: {progressData.overview.longest_streak})
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <StarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Progress</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {progressData.overview.average_score}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Certificates */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Certificates</dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {progressData.overview.certificates_earned}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Trend Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Trend</h3>
          <div className="h-64">
            <Line data={progressTrendChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Course Progress Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Course Progress</h3>
          <div className="h-64">
            <Bar data={courseProgressChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Time Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Study Time</h3>
          <div className="h-64">
            <Bar data={timeSpentChartData} options={chartOptions} />
          </div>
        </div>

        {/* Category Distribution Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Learning by Category</h3>
          <div className="h-64">
            <Doughnut data={categoryDistributionChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Course Progress List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Course Progress Details</h3>
        </div>
        <div className="overflow-hidden">
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No enrolled courses</h3>
              <p className="mt-1 text-sm text-gray-500">Enroll in courses to start tracking your progress</p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/student/catalog')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Browse Courses
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {enrolledCourses.map((enrollment) => (
                <div key={enrollment.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start">
                    {/* Course Thumbnail */}
                    <div className="flex-shrink-0">
                      {enrollment.course?.thumbnail_url ? (
                        <div className="relative h-20 w-32 rounded-lg overflow-hidden">
                          <Image
                            src={enrollment.course.thumbnail_url}
                            alt={enrollment.course.title || 'Course'}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-20 w-32 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <BookOpenIcon className="h-8 w-8 text-indigo-600" />
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="ml-6 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {enrollment.course?.title || 'Untitled Course'}
                          </h4>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            {enrollment.course?.category && (
                              <span>{enrollment.course.category}</span>
                            )}
                            {enrollment.course?.total_lessons !== undefined && (
                              <span>{enrollment.course.total_lessons} lessons</span>
                            )}
                            {enrollment.course?.total_duration && (
                              <span>{formatStudyTime(enrollment.course.total_duration)}</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-lg font-semibold text-gray-900">
                            {Math.round(enrollment.progress_percentage || 0)}%
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.status === 'completed' ? 'Completed' : 'In Progress'}
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>
                            {Math.floor((enrollment.progress_percentage || 0) * (enrollment.course?.total_lessons || 0) / 100)} / {enrollment.course?.total_lessons || 0} lessons
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              enrollment.progress_percentage >= 100
                                ? 'bg-green-600'
                                : enrollment.progress_percentage >= 50
                                ? 'bg-indigo-600'
                                : 'bg-yellow-500'
                            }`}
                            style={{ width: `${Math.min(enrollment.progress_percentage || 0, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex items-center space-x-4">
                        <button
                          onClick={() => router.push(`/student/courses/${enrollment.course_id}/learn`)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                        >
                          {enrollment.progress_percentage > 0 ? 'Continue Learning' : 'Start Learning'}
                        </button>
                        <button
                          onClick={() => router.push(`/student/courses/${enrollment.course_id}`)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

