/**
 * InfoFit Labs Platform Dashboard
 * Super Admin dashboard for platform management
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  BookOpenIcon, 
  CurrencyDollarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';
import { showToast } from '@/components/ui/Toast';

interface Organization {
  id: number;
  name: string;
  description: string;
  website: string;
  contact_email: string;
  industry: string;
  size: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
  course_count: number;
}

interface PlatformStats {
  total_organizations: number;
  total_users: number;
  total_courses: number;
  total_revenue: number;
  active_organizations: number;
  new_organizations_this_month: number;
}

export default function PlatformDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Check if user is super admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (!authLoading && user?.role === 'super_admin') {
      loadPlatformData();
    }
  }, [user, authLoading]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading]);

  const loadPlatformData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from API
      const [orgsResponse, statsResponse, coursesResponse, usersResponse] = await Promise.all([
        apiClient.getOrganizations().catch(() => ({ data: { organizations: [] } })),
        apiClient.getPlatformStats().catch(() => ({ data: {} })),
        apiClient.getCourses().catch(() => ({ data: { courses: [] } })),
        apiClient.getUsers({ size: 1 }).catch(() => ({ data: { total: 0 } }))
      ]);

      // Process organizations
      const orgsData = orgsResponse.data?.organizations || orgsResponse.data || [];
      const processedOrgs: Organization[] = Array.isArray(orgsData) ? orgsData.map((org: any) => ({
        id: org.id,
        name: org.name || 'Unnamed Organization',
        description: org.description || '',
        website: org.website || '',
        contact_email: org.contact_email || org.email || '',
        industry: org.industry || 'General',
        size: org.size || 'Unknown',
        is_active: org.is_active !== false,
        created_at: org.created_at || new Date().toISOString(),
        user_count: org.user_count || 0,
        course_count: org.course_count || 0
      })) : [];

      // Process stats
      const statsData = statsResponse.data || {};
      const coursesData = coursesResponse.data?.courses || coursesResponse.data || [];
      const totalCourses = Array.isArray(coursesData) ? coursesData.length : 0;
      const totalUsers = usersResponse.data?.total || 0;
      const activeOrgs = processedOrgs.filter(org => org.is_active).length;
      const thisMonth = new Date().getMonth();
      const newOrgsThisMonth = processedOrgs.filter(org => {
        const createdDate = new Date(org.created_at);
        return createdDate.getMonth() === thisMonth;
      }).length;

      const calculatedStats: PlatformStats = {
        total_organizations: statsData.total_organizations || processedOrgs.length,
        total_users: statsData.total_users || totalUsers,
        total_courses: statsData.total_courses || totalCourses,
        total_revenue: statsData.total_revenue || 0,
        active_organizations: statsData.active_organizations || activeOrgs,
        new_organizations_this_month: statsData.new_organizations_this_month || newOrgsThisMonth
      };

      setOrganizations(processedOrgs);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading platform data:', error);
      // Set empty data on error
      setOrganizations([]);
      setStats({
        total_organizations: 0,
        total_users: 0,
        total_courses: 0,
        total_revenue: 0,
        active_organizations: 0,
        new_organizations_this_month: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = () => {
    router.push('/admin/organizations/create');
  };

  const handleViewOrganization = (orgId: number) => {
    router.push(`/admin/organizations/${orgId}`);
  };

  const handleEditOrganization = (orgId: number) => {
    router.push(`/admin/organizations/${orgId}/edit`);
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading platform data...'}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
            <p>Data Loading: {loading ? 'Yes' : 'No'}</p>
            <p>User Role: {user?.role || 'None'}</p>
            <p>User ID: {user?.id || 'None'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not super admin
  if (!user || user.role !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
          <div className="mt-2 text-xs text-gray-500">
            <p>User: {user ? 'Present' : 'Null'}</p>
            <p>Role: {user?.role || 'None'}</p>
            <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-gray-600">Monitor platform-wide analytics and manage organizations</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={handleCreateOrganization}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Organization
          </button>
          <button
            onClick={() => {
              setLoading(true);
              loadPlatformData();
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Platform-Specific Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 overflow-hidden shadow-lg rounded-lg text-white">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Total Organizations</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_organizations}</p>
                  <p className="text-indigo-200 text-xs mt-2">
                    {stats.active_organizations} active
                  </p>
                </div>
                <BuildingOfficeIcon className="h-12 w-12 text-indigo-200 opacity-50" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 overflow-hidden shadow-lg rounded-lg text-white">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Organizations</p>
                  <p className="text-3xl font-bold mt-1">{stats.active_organizations}</p>
                  <p className="text-green-200 text-xs mt-2">
                    {stats.new_organizations_this_month} new this month
                  </p>
                </div>
                <UsersIcon className="h-12 w-12 text-green-200 opacity-50" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 overflow-hidden shadow-lg rounded-lg text-white">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Platform Users</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_users.toLocaleString()}</p>
                  <p className="text-purple-200 text-xs mt-2">
                    Across all organizations
                  </p>
                </div>
                <UsersIcon className="h-12 w-12 text-purple-200 opacity-50" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 overflow-hidden shadow-lg rounded-lg text-white">
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm font-medium">Platform Revenue</p>
                  <p className="text-3xl font-bold mt-1">${stats.total_revenue.toLocaleString()}</p>
                  <p className="text-amber-200 text-xs mt-2">
                    Total platform earnings
                  </p>
                </div>
                <CurrencyDollarIcon className="h-12 w-12 text-amber-200 opacity-50" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Growth Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">New Organizations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.new_organizations_this_month}</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <PlusIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_courses}</p>
                <p className="text-xs text-gray-500 mt-1">Platform-wide</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <BookOpenIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Growth Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.new_organizations_this_month > 0 
                    ? `${Math.round((stats.new_organizations_this_month / Math.max(stats.total_organizations, 1)) * 100)}%`
                    : '0%'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Monthly growth</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Organizations List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 md:px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Organizations</h3>
          <p className="text-sm text-gray-500 mt-1">Quick overview of platform organizations</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{org.name}</div>
                      <div className="text-sm text-gray-500">{org.contact_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {org.industry}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {org.user_count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {org.course_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      org.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {org.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewOrganization(org.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditOrganization(org.id)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete ${org.name}? This action cannot be undone. All users and courses must be removed first.`)) {
                          try {
                            setLoading(true);
                            await apiClient.deleteOrganization(org.id.toString());
                            showToast(`${org.name} deleted successfully`, 'success');
                            await loadPlatformData();
                          } catch (error: any) {
                            console.error('Error deleting organization:', error);
                            const errorMessage = error?.message || error?.response?.data?.detail || 'Failed to delete organization. Please try again.';
                            showToast(errorMessage, 'error', 7000);
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Organization"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
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
