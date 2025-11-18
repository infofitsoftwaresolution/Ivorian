/**
 * Organization Admin Dashboard
 * Dashboard for organization administrators to manage their organization
 */

'use client';

import { useState, useEffect } from 'react';
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

// Mock data for organization dashboard
const mockStats = {
  totalTutors: 12,
  totalStudents: 156,
  totalCourses: 24,
  activeEnrollments: 89,
  revenueThisMonth: 12500,
  completionRate: 78
};

const mockRecentActivity = [
  { id: 1, type: 'tutor_created', message: 'New tutor John Doe joined', time: '2 hours ago' },
  { id: 2, type: 'course_created', message: 'Course "Advanced JavaScript" was created', time: '1 day ago' },
  { id: 3, type: 'enrollment', message: '15 new student enrollments', time: '2 days ago' },
  { id: 4, type: 'completion', message: 'Course "Python Basics" completed by 8 students', time: '3 days ago' }
];

export default function OrganizationDashboard() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user is organization admin and redirect if not
  useEffect(() => {
    console.log('OrganizationDashboard: Auth check - isLoading:', isLoading, 'user:', user, 'isRedirecting:', isRedirecting);
    if (!isLoading && user && user.role !== 'organization_admin' && !isRedirecting) {
      console.log('OrganizationDashboard: Redirecting - user role:', user.role);
      setIsRedirecting(true);
      router.push('/dashboard');
    }
  }, [user, router, isRedirecting, isLoading]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
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
          <p className="text-sm font-medium text-gray-900">Your Organization</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tutors</p>
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalTutors}</p>
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
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalStudents}</p>
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
              <p className="text-2xl font-bold text-gray-900">{mockStats.totalCourses}</p>
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
              <p className="text-2xl font-bold text-gray-900">{mockStats.completionRate}%</p>
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

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
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
              <p className="text-2xl font-bold text-green-600">${mockStats.revenueThisMonth.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Active Enrollments</p>
              <p className="text-2xl font-bold text-blue-600">{mockStats.activeEnrollments}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Growth</p>
              <p className="text-2xl font-bold text-green-600">+12%</p>
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
                onClick={async () => {
                  if (confirm('Are you sure you want to delete this organization? This action cannot be undone. All users and courses must be removed first.')) {
                    try {
                      setLoading(true);
                      await apiClient.deleteOrganization(user.organization_id!.toString());
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
                  }
                }}
                disabled={loading}
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span className="ml-2">Deleting...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete Organization
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
