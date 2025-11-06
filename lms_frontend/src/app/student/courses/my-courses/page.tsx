/**
 * My Courses Page
 * Shows all courses the student is enrolled in
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  BookOpenIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  ArrowRightIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface EnrolledCourse {
  id: number;
  course: {
    id: number;
    title: string;
    description: string;
    thumbnail_url?: string;
    total_lessons: number;
    total_duration: number;
    difficulty_level: string;
    category: string;
  };
  status: string;
  progress_percentage: number;
  enrollment_date: string; // Changed from enrolled_at to enrollment_date
  completion_date?: string; // Changed from completed_at to completion_date
}

export default function MyCoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Fetch enrolled courses
  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getMyEnrollments();
        console.log('Enrolled courses response:', response);
        
        // Handle different response structures
        let enrollments = [];
        if (Array.isArray(response.data)) {
          enrollments = response.data;
        } else if (response.data && Array.isArray(response.data.enrollments)) {
          enrollments = response.data.enrollments;
        } else {
          console.log('No enrollments found or unexpected response structure');
          enrollments = [];
        }
        
        console.log('📚 Processed enrollments for My Courses:', enrollments);
        console.log('📚 First enrollment structure:', enrollments[0]);
        
        setEnrolledCourses(enrollments);
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        setError('Failed to load enrolled courses. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'student') {
      fetchEnrolledCourses();
    }
  }, [user]);

  const filteredCourses = enrolledCourses.filter(course => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return course.status === 'active';
    if (filterStatus === 'completed') return course.status === 'completed';
    if (filterStatus === 'in_progress') return course.status === 'active' && course.progress_percentage > 0 && course.progress_percentage < 100;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Courses</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Retry
          </button>
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
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="text-gray-600">Your enrolled courses and learning progress</p>
        </div>
        <button
          onClick={() => router.push('/student/courses')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
        >
          <BookOpenIcon className="h-5 w-5 mr-2" />
          Browse All Courses
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {enrolledCourses.filter(c => c.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {enrolledCourses.filter(c => c.status === 'active' && c.progress_percentage > 0 && c.progress_percentage < 100).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AcademicCapIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {enrolledCourses.length > 0 
                  ? Math.round(enrolledCourses.reduce((acc, c) => acc + c.progress_percentage, 0) / enrolledCourses.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Your Courses</h2>
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All Courses' },
                { key: 'active', label: 'Active' },
                { key: 'in_progress', label: 'In Progress' },
                { key: 'completed', label: 'Completed' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilterStatus(filter.key)}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    filterStatus === filter.key
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="p-6">
          {filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((enrollment) => {
                const course = enrollment.course;
                
                // Skip if course data is missing
                if (!course) {
                  console.warn('Missing course data for enrollment:', enrollment);
                  return null;
                }
                
                const completedLessons = Math.floor((enrollment.progress_percentage / 100) * (course.total_lessons || 0));
                
                return (
                  <div key={enrollment.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    {/* Course Image */}
                    <div className="aspect-video bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpenIcon className="h-12 w-12 text-white" />
                      )}
                    </div>

                    {/* Course Content */}
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(enrollment.status)}`}>
                          {enrollment.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(course.difficulty_level || 'beginner')}`}>
                          {course.difficulty_level || 'beginner'}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title || 'Untitled Course'}</h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description || 'No description available'}</p>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(enrollment.progress_percentage || 0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${enrollment.progress_percentage || 0}%` }}
                          />
                        </div>
                      </div>

                      {/* Course Stats */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {formatDuration(course.total_duration || 0)}
                        </div>
                        <div className="flex items-center">
                          <BookOpenIcon className="h-4 w-4 mr-1" />
                          {completedLessons}/{course.total_lessons || 0} lessons
                        </div>
                      </div>

                      {/* Enrolled Date */}
                      <div className="text-xs text-gray-400 mb-4">
                        Enrolled on {enrollment.enrollment_date ? formatDate(enrollment.enrollment_date) : 'Unknown date'}
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => router.push(`/student/courses/${course.id}/learn`)}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center justify-center"
                      >
                        <PlayIcon className="h-4 w-4 mr-2" />
                        {enrollment.status === 'completed' ? 'Review Course' : 'Continue Learning'}
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filterStatus === 'all' ? 'No Enrolled Courses' : `No ${filterStatus} Courses`}
              </h3>
              <p className="text-gray-600 mb-4">
                {filterStatus === 'all' 
                  ? "You haven't enrolled in any courses yet."
                  : `You don't have any ${filterStatus} courses.`
                }
              </p>
              <button
                onClick={() => router.push('/student/courses')}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Browse Courses
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
