/**
 * Organization Admin Dashboard
 * Dashboard for organization administrators to manage their organization
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  UsersIcon, 
  AcademicCapIcon, 
  BookOpenIcon, 
  ChartBarIcon,
  PlusIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CogIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';
import { showToast } from '@/components/ui/Toast';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface OrganizationStats {
  totalTutors: number;
  totalStudents: number;
  totalCourses: number;
  activeEnrollments: number;
  revenueThisMonth: number;
  completionRate: number;
}

export default function OrganizationDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>('Your Organization');
  const [stats, setStats] = useState<OrganizationStats>({
    totalTutors: 0,
    totalStudents: 0,
    totalCourses: 0,
    activeEnrollments: 0,
    revenueThisMonth: 0,
    completionRate: 0
  });
  const [error, setError] = useState('');

  // Fetch organization dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!user || user.role !== 'organization_admin' || !user.organization_id) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Fetch organization name
      try {
        const orgResponse = await apiClient.getMyOrganization();
        if (orgResponse.data?.name) {
          setOrganizationName(orgResponse.data.name);
        }
      } catch (orgError) {
        console.warn('Could not fetch organization name:', orgError);
      }
      
      // Fetch all data in parallel
      const [tutorsResponse, studentsResponse, coursesResponse] = await Promise.all([
        apiClient.getUsers({ role: 'tutor', organization_id: user.organization_id, size: 1000 }),
        apiClient.getUsers({ role: 'student', organization_id: user.organization_id, size: 1000 }),
        apiClient.getCourses({ organization_id: user.organization_id, size: 1000 })
      ]);
      
      // Extract data from responses
      const tutorsData = Array.isArray(tutorsResponse.data) 
        ? tutorsResponse.data 
        : tutorsResponse.data?.users || [];
      const studentsData = Array.isArray(studentsResponse.data) 
        ? studentsResponse.data 
        : studentsResponse.data?.users || [];
      const coursesData = Array.isArray(coursesResponse.data) 
        ? coursesResponse.data 
        : coursesResponse.data?.courses || [];
      
      // Filter for correct roles (handle both roles array and role field)
      const tutors = tutorsData.filter((tutor: any) => {
        const userRoles = tutor.roles || (tutor.role ? [tutor.role] : []);
        return userRoles.includes('tutor') || userRoles.includes('instructor');
      });
      
      const students = studentsData.filter((student: any) => {
        const userRoles = student.roles || (student.role ? [student.role] : []);
        return userRoles.includes('student');
      });
      
      // Calculate stats
      const totalTutors = tutors.length;
      const totalStudents = students.length;
      const totalCourses = coursesData.length;
      
      // Calculate active enrollments (enrollments in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let activeEnrollments = 0;
      let totalEnrollments = 0;
      let completedEnrollments = 0;
      let totalRevenue = 0;
      
      // Fetch enrollments for all courses
      for (const course of coursesData) {
        try {
          const enrollmentsResponse = await apiClient.getCourseEnrollments(course.id);
          const enrollments = Array.isArray(enrollmentsResponse.data) 
            ? enrollmentsResponse.data 
            : [];
          
          totalEnrollments += enrollments.length;
          
          enrollments.forEach((enrollment: any) => {
            // Check if enrollment is active (within last 30 days)
            const enrollmentDate = new Date(enrollment.enrollment_date || enrollment.created_at);
            if (enrollmentDate >= thirtyDaysAgo) {
              activeEnrollments++;
            }
            
            // Check if completed
            if (enrollment.status === 'completed' || enrollment.progress_percentage === 100) {
              completedEnrollments++;
            }
            
            // Calculate revenue
            if (enrollment.payment_amount && enrollment.payment_status === 'paid') {
              totalRevenue += parseFloat(enrollment.payment_amount) || 0;
            }
          });
        } catch (enrollmentError) {
          console.warn(`Could not fetch enrollments for course ${course.id}:`, enrollmentError);
        }
      }
      
      // Calculate completion rate
      const completionRate = totalEnrollments > 0 
        ? Math.round((completedEnrollments / totalEnrollments) * 100) 
        : 0;
      
      // Calculate revenue this month
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      thisMonthStart.setHours(0, 0, 0, 0);
      
      let revenueThisMonth = 0;
      for (const course of coursesData) {
        try {
          const enrollmentsResponse = await apiClient.getCourseEnrollments(course.id);
          const enrollments = Array.isArray(enrollmentsResponse.data) 
            ? enrollmentsResponse.data 
            : [];
          
          enrollments.forEach((enrollment: any) => {
            const enrollmentDate = new Date(enrollment.enrollment_date || enrollment.created_at);
            if (enrollmentDate >= thisMonthStart && 
                enrollment.payment_amount && 
                enrollment.payment_status === 'paid') {
              revenueThisMonth += parseFloat(enrollment.payment_amount) || 0;
            }
          });
        } catch (enrollmentError) {
          // Skip courses with enrollment fetch errors
        }
      }
      
      setStats({
        totalTutors,
        totalStudents,
        totalCourses,
        activeEnrollments,
        revenueThisMonth: Math.round(revenueThisMonth),
        completionRate
      });
    } catch (error: unknown) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard data';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Check if user is organization admin and redirect if not
  useEffect(() => {
    console.log('OrganizationDashboard: Auth check - isLoading:', isLoading, 'user:', user, 'isRedirecting:', isRedirecting);
    if (!isLoading && user && user.role !== 'organization_admin' && !isRedirecting) {
      console.log('OrganizationDashboard: Redirecting - user role:', user.role);
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [user, router, isRedirecting, isLoading]);
  
  // Fetch dashboard data when user is available
  useEffect(() => {
    if (!isLoading && user && user.role === 'organization_admin' && user.organization_id) {
      fetchDashboardData();
    }
  }, [user, isLoading, fetchDashboardData]);
  
  // Refresh data when page regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user && user.role === 'organization_admin' && !loading) {
        fetchDashboardData();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, loading, fetchDashboardData]);

  // Show loading while checking authentication or fetching data
  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if redirecting or not organization admin
  if (isRedirecting || (user && user.role !== 'organization_admin')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Create Tutor',
      description: 'Add a new tutor to your organization',
      icon: UserGroupIcon,
      href: '/admin/tutors/create',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Create Course',
      description: 'Create a new course for your organization',
      icon: BookOpenIcon,
      href: '/admin/courses/create',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Manage Students',
      description: 'View and manage student enrollments',
      icon: UsersIcon,
      href: '/admin/students',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Organization Settings',
      description: 'Update organization details and settings',
      icon: CogIcon,
      href: '/admin/settings',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.first_name} {user?.last_name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Organization Admin</p>
          <p className="text-sm font-medium text-gray-900">{organizationName}</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tutors</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTutors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCourses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={() => router.push(action.href)}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${action.color} text-white`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">{action.title}</h3>
                    <p className="text-xs text-gray-500">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity - Placeholder for future implementation */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Activity feed coming soon</p>
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Revenue Overview</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-green-600">${stats.revenueThisMonth.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Active Enrollments</p>
              <p className="text-2xl font-bold text-blue-600">{stats.activeEnrollments}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalCourses}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone - Delete Organization */}
      {user?.organization_id && (
        <div className="bg-white rounded-lg shadow border border-red-200">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50">
            <h2 className="text-lg font-medium text-red-900">Danger Zone</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Delete Organization</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Permanently delete your organization and all associated data. This action cannot be undone.
                  You must remove all users and courses before deleting the organization.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          try {
            setLoading(true);
            setShowDeleteConfirm(false);
            await apiClient.deleteOrganization(user!.organization_id!.toString());
            showToast('Organization deleted successfully', 'success');
            // Logout and redirect to home after a short delay
            setTimeout(() => {
              logout();
              router.push('/');
            }, 2000);
          } catch (error: any) {
            console.error('Error deleting organization:', error);
            const errorMessage = error?.message || error?.response?.data?.detail || 'Failed to delete organization. Please try again.';
            showToast(errorMessage, 'error', 7000);
          } finally {
            setLoading(false);
          }
        }}
        title="Delete Organization"
        message="Are you sure you want to delete this organization? This action cannot be undone. All users and courses must be removed first."
        confirmText="Delete Organization"
        cancelText="Cancel"
        type="danger"
        isLoading={loading}
      />
    </div>
  );
}
