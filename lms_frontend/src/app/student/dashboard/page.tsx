/**
 * Student Dashboard
 * Dashboard for students to view enrolled courses and track progress
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  BookOpenIcon, 
  AcademicCapIcon, 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  DocumentTextIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

// Types for student dashboard data
interface EnrolledCourse {
  id: number;
  title: string;
  instructor: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  lastActivity: string;
  nextLesson: string;
  image?: string;
  course: {
    id: number;
    title: string;
    description: string;
    thumbnail_url?: string;
    total_lessons: number;
    total_duration: number;
  };
  status: string;
  progress_percentage: number;
  enrolled_at: string;
}

interface StudentStats {
  enrolledCourses: number;
  completedLessons: number;
  totalLessons: number;
  averageScore: number;
  certificatesEarned: number;
  studyTime: number;
}

export default function StudentDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    enrolledCourses: 0,
    completedLessons: 0,
    totalLessons: 0,
    averageScore: 0,
    certificatesEarned: 0,
    studyTime: 0
  });
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  // Check if user is student and redirect if not
  useEffect(() => {
    if (!isLoading && user && user.role !== 'student' && !isRedirecting) {
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [user, router, isRedirecting, isLoading]);

  // Fetch student data
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user || user.role !== 'student') return;
      
      try {
        setLoadingData(true);
        
        // Debug: Log enrollment data structure
        console.log('🔍 Fetching student enrollments...');
        
        // Fetch enrolled courses
        const enrollmentsResponse = await apiClient.getMyEnrollments();
        console.log('Enrollments response:', enrollmentsResponse);
        
        // Handle different response structures
        let enrollments = [];
        if (Array.isArray(enrollmentsResponse.data)) {
          enrollments = enrollmentsResponse.data;
        } else if (enrollmentsResponse.data && Array.isArray(enrollmentsResponse.data.enrollments)) {
          enrollments = enrollmentsResponse.data.enrollments;
        } else {
          console.log('No enrollments found or unexpected response structure');
          enrollments = [];
        }
        
        console.log('📚 Processed enrollments:', enrollments);
        console.log('📚 First enrollment structure:', enrollments[0]);
        
        setEnrolledCourses(enrollments);
        
        // Calculate stats
        const totalCourses = enrollments.length;
        const totalLessons = enrollments.reduce((acc: number, enrollment: any) => 
          acc + (enrollment.course?.total_lessons || 0), 0
        );
        const completedLessons = enrollments.reduce((acc: number, enrollment: any) => 
          acc + Math.floor((enrollment.progress_percentage || 0) * (enrollment.course?.total_lessons || 0) / 100), 0
        );
        const averageProgress = enrollments.length > 0 
          ? enrollments.reduce((acc: number, enrollment: any) => acc + (enrollment.progress_percentage || 0), 0) / enrollments.length
          : 0;
        
        setStats({
          enrolledCourses: totalCourses,
          completedLessons: completedLessons,
          totalLessons: totalLessons,
          averageScore: Math.round(averageProgress),
          certificatesEarned: enrollments.filter((e: any) => e.status === 'completed').length,
          studyTime: 0 // TODO: Implement study time tracking
        });
        
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('Failed to load dashboard data. Please try again.');
        // Set empty data to prevent crashes
        setEnrolledCourses([]);
        setStats({
          enrolledCourses: 0,
          completedLessons: 0,
          totalLessons: 0,
          averageScore: 0,
          certificatesEarned: 0,
          studyTime: 0
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (user && user.role === 'student') {
      fetchStudentData();
    }
  }, [user]);

  // Show loading while checking authentication or fetching data
  if (isLoading || loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if redirecting or not student
  if (isRedirecting || (user && user.role !== 'student')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show error if data loading failed
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
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

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson_completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'quiz_taken':
        return <DocumentTextIcon className="h-4 w-4 text-blue-500" />;
      case 'assignment_submitted':
        return <AcademicCapIcon className="h-4 w-4 text-purple-500" />;
      case 'certificate_earned':
        return <TrophyIcon className="h-4 w-4 text-yellow-500" />;
      default:
        return <BookOpenIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.first_name} {user?.last_name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Student</p>
          <p className="text-sm font-medium text-gray-900">Learning Progress</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Enrolled Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.enrolledCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Lessons</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedLessons}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrophyIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Certificates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.certificatesEarned}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">My Courses</h2>
          <button
            onClick={() => router.push('/student/courses/my-courses')}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            View All Courses →
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.length > 0 ? enrolledCourses.map((enrollment) => {
              const course = enrollment.course;
              const progress = enrollment.progress_percentage || 0;
              const completedLessons = Math.floor((progress / 100) * (course?.total_lessons || 0));
              
              // Skip if course data is missing
              if (!course) {
                console.warn('Missing course data for enrollment:', enrollment);
                return null;
              }
              
              return (
              <div key={enrollment.id || course.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <BookOpenIcon className="h-12 w-12 text-white" />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{course?.title || 'Course Title'}</h3>
                  <p className="text-sm text-gray-500 mb-3">by Instructor</p>
                  
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">
                    <p>{completedLessons} of {course?.total_lessons || 0} lessons completed</p>
                    <p className="text-gray-400">Status: {enrollment.status}</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/student/courses/${course?.id}/learn`)}
                      className="flex-1 bg-blue-600 text-white text-sm font-medium py-2 px-3 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Continue Learning
                    </button>
                    <button
                      onClick={() => router.push(`/student/courses/${course?.id}`)}
                      className="bg-gray-100 text-gray-700 text-sm font-medium py-2 px-3 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
              );
            }) : (
              <div className="col-span-full text-center py-12">
                <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Enrolled Courses</h3>
                <p className="text-gray-600 mb-4">You haven't enrolled in any courses yet.</p>
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

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {enrolledCourses.length > 0 ? (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Recent activity will appear here as you progress through your courses.</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No recent activity. Start learning to see your progress here!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Study Stats */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Study Statistics</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <ClockIcon className="h-8 w-8 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Study Time</p>
              <p className="text-2xl font-bold text-blue-600">{stats.studyTime}h</p>
              <p className="text-xs text-gray-400">This month</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}%</p>
              <p className="text-xs text-gray-400">Overall</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <TrophyIcon className="h-8 w-8 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-gray-500">Achievements</p>
              <p className="text-2xl font-bold text-purple-600">12</p>
              <p className="text-xs text-gray-400">Total earned</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
