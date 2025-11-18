/**
 * Tutor Dashboard
 * Enhanced dashboard for tutors to manage courses and view student progress
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';
import { 
  BookOpenIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  PlusIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import Breadcrumb from '@/components/ui/Breadcrumb';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface DashboardStats {
  totalCourses: number;
  totalStudents: number;
  totalLessons: number;
  completionRate: number;
  totalEarnings: number;
  thisMonthEarnings: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  status: string;
  total_lessons: number;
  total_duration: number;
  enrollment_count: number;
  created_at: string;
  thumbnail_url?: string;
}

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  last_login?: string;
  created_at?: string;
  enrolled_courses: number;
}

export default function TutorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [organizationName, setOrganizationName] = useState<string>('Your Organization');
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
    completionRate: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState('');

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Fetch organization name from user profile
      try {
        const profileResponse = await apiClient.getUserProfile();
        if (profileResponse.data?.organization_name) {
          setOrganizationName(profileResponse.data.organization_name);
        }
      } catch (profileError) {
        console.warn('Could not fetch organization name:', profileError);
        // Keep default "Your Organization" if fetch fails
      }
      
      // Fetch courses
      const coursesResponse = await apiClient.getCourses();
      const coursesData = Array.isArray(coursesResponse.data) 
        ? coursesResponse.data 
        : coursesResponse.data?.courses || [];
      setCourses(coursesData.slice(0, 5)); // Show only recent 5 courses
      
      // Fetch students
      // Backend automatically filters by organization_id for tutors
      const studentsResponse = await apiClient.getUsers({ role: 'student' });
      const studentsData = Array.isArray(studentsResponse.data) 
        ? studentsResponse.data 
        : studentsResponse.data?.users || [];
      
      // Filter for students - handle both roles array and role field
      const studentUsers = studentsData.filter((userItem: any) => {
        const userRoles = userItem.roles || (userItem.role ? [userItem.role] : []);
        return userRoles.includes('student');
      });
      
      // Sort by created_at (most recent first) and take top 5
      const sortedStudents = studentUsers
        .sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);
      
      setStudents(sortedStudents);
      
      // Calculate stats from real data
      const totalCourses = coursesData.length;
      const totalStudents = studentUsers.length;
      const totalLessons = coursesData.reduce((acc: number, course: any) => acc + (course.total_lessons || 0), 0);
      
      // Calculate completion rate from enrollments if available
      let completionRate = 0;
      if (totalCourses > 0 && studentUsers.length > 0) {
        // This is a placeholder - actual completion rate should come from analytics
        // For now, calculate based on courses with enrollments
        const coursesWithEnrollments = coursesData.filter((c: any) => (c.enrollment_count || 0) > 0).length;
        completionRate = Math.round((coursesWithEnrollments / totalCourses) * 100);
      }
      
      setStats({
        totalCourses,
        totalStudents,
        totalLessons,
        completionRate,
        totalEarnings: 0, // TODO: Implement earnings calculation
        thisMonthEarnings: 0 // TODO: Implement monthly earnings
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  // Refresh data when page comes into focus (e.g., returning from other pages)
  useEffect(() => {
    const handleFocus = () => {
      if (user && !loading) {
        fetchDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, loading, fetchDashboardData]);

  const quickActions = [
    {
      title: 'Create Course',
      description: 'Create a new course with topics and lessons',
      icon: BookOpenIcon,
      href: '/tutor/courses/create',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Manage Students',
      description: 'View and manage student enrollments',
      icon: UserGroupIcon,
      href: '/tutor/students',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Add Student',
      description: 'Add new students to your organization',
      icon: UserGroupIcon,
      href: '/tutor/students/create',
      color: 'bg-emerald-500 hover:bg-emerald-600'
    },
    {
      title: 'Create Assessment',
      description: 'Create quizzes and assignments',
      icon: DocumentTextIcon,
      href: '/tutor/assessments/create',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'View Analytics',
      description: 'Track student progress and performance',
      icon: ChartBarIcon,
      href: '/tutor/analytics',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.first_name}!</h1>
            <p className="text-indigo-100 mt-2">Here's what's happening with your courses and students</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/tutor/courses')}
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg hover:bg-white/30 transition-all duration-200 flex items-center space-x-2"
            >
              <EyeIcon className="h-5 w-5" />
              <span>View All Courses</span>
            </button>
            <div className="text-right">
              <p className="text-indigo-200 text-sm">Tutor</p>
              <p className="text-white font-medium">{organizationName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-green-600">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+12%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-green-600">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+8%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl">
                <DocumentTextIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Lessons</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLessons}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-blue-600">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <ChartBarIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-green-600">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-gray-600 text-sm">Get started with these common tasks</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="group p-6 border border-gray-200 rounded-xl hover:shadow-lg hover:border-indigo-200 transition-all duration-300 text-left bg-gradient-to-br from-white to-gray-50"
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`p-4 rounded-xl ${action.color} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Courses and Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Courses */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Courses</h2>
                <p className="text-gray-600 text-sm">Your latest course activities</p>
              </div>
              <button
                onClick={() => router.push('/tutor/courses')}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
              >
                View All
                <ArrowTrendingUpIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {courses.length > 0 ? courses.map((course) => (
                <div key={course.id} className="group flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <BookOpenIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{course.title}</h3>
                      <p className="text-xs text-gray-500">{course.enrollment_count || 0} students • {course.total_lessons || 0} lessons</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : course.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {course.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(course.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/tutor/courses/${course.id}/edit`)}
                      className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit Course"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/tutor/courses/${course.id}`)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <BookOpenIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No courses yet</p>
                  <button
                    onClick={() => router.push('/tutor/courses/create')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create Your First Course
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Students */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Recent Students</h2>
                <p className="text-gray-600 text-sm">Latest student registrations</p>
              </div>
              <button
                onClick={() => router.push('/tutor/students')}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
              >
                View All
                <ArrowTrendingUpIcon className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {students.length > 0 ? students.map((student) => (
                <div key={student.id} className="group flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md hover:border-indigo-200 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {student.first_name.charAt(0)}{student.last_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-xs text-gray-500">{student.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {student.enrolled_courses || 0} courses
                        </span>
                        <span className="text-xs text-gray-400">
                          Joined {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'Recently'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/tutor/students/${student.id}`)}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    View
                  </button>
                </div>
              )) : (
                <div className="text-center py-8">
                  <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No students yet</p>
                  <button
                    onClick={() => router.push('/tutor/students/create')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Add Your First Student
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

