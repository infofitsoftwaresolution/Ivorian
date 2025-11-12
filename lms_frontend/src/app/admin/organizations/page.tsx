/**
 * Organizations Management Page
 * Super Admin page for managing all organizations on the platform
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  BuildingOfficeIcon, 
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';

interface Organization {
  id: number;
  name: string;
  description: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  industry: string;
  size: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
  course_count: number;
}

export default function OrganizationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterIndustry, setFilterIndustry] = useState('all');

  // Check if user is super admin
  useEffect(() => {
    console.log('OrganizationsPage: Auth check - authLoading:', authLoading, 'user:', user);
    if (!authLoading && !user) {
      console.log('OrganizationsPage: No user found, redirecting to login');
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'super_admin') {
      console.log('OrganizationsPage: Redirecting - user:', user, 'role:', user?.role);
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    console.log('OrganizationsPage: Data loading check - authLoading:', authLoading, 'user role:', user?.role);
    if (!authLoading && user?.role === 'super_admin') {
      console.log('OrganizationsPage: Starting data load...');
      loadOrganizations();
    }
  }, [user, authLoading]);

  // Reload data when page becomes visible or when query param indicates new creation
  useEffect(() => {
    if (!user || user.role !== 'super_admin') return;

    // Check if we have a query param indicating a new organization was created
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('created') === 'true') {
      // Remove the query param and reload
      window.history.replaceState({}, '', '/admin/organizations');
      setTimeout(() => loadOrganizations(), 100);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading) {
        loadOrganizations();
      }
    };

    const handleFocus = () => {
      if (!loading) {
        loadOrganizations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, loading]);

  const loadOrganizations = async () => {
    try {
      console.log('OrganizationsPage: Loading organizations...');
      setLoading(true);
      
      // Fetch real data from API
      const response = await apiClient.getOrganizations();
      const orgsData = response.data?.organizations || response.data || [];
      
      const processedOrgs: Organization[] = Array.isArray(orgsData) ? orgsData.map((org: any) => ({
        id: org.id,
        name: org.name || 'Unnamed Organization',
        description: org.description || '',
        website: org.website || '',
        contact_email: org.contact_email || org.email || '',
        contact_phone: org.contact_phone || org.phone || '',
        industry: org.industry || 'General',
        size: org.size || 'Unknown',
        is_active: org.is_active !== false,
        created_at: org.created_at || new Date().toISOString(),
        user_count: org.user_count || 0,
        course_count: org.course_count || 0
      })) : [];

      setOrganizations(processedOrgs);
      console.log('OrganizationsPage: Data loaded successfully', processedOrgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
      setOrganizations([]);
    } finally {
      setLoading(false);
      console.log('OrganizationsPage: Loading completed');
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

  const handleDeleteOrganization = async (orgId: number) => {
    if (confirm('Are you sure you want to delete this organization? This action cannot be undone.')) {
      try {
        setLoading(true);
        await apiClient.deleteOrganization(orgId.toString());
        await loadOrganizations();
      } catch (error: any) {
        console.error('Error deleting organization:', error);
        alert(error?.response?.data?.detail || 'Failed to delete organization. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter organizations based on search and filters
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.contact_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.industry.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && org.is_active) ||
                         (filterStatus === 'inactive' && !org.is_active);
    
    const matchesIndustry = filterIndustry === 'all' || org.industry === filterIndustry;
    
    return matchesSearch && matchesStatus && matchesIndustry;
  });

  // Get unique industries for filter
  const industries = ['all', ...Array.from(new Set(organizations.map(org => org.industry)))];

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading organizations...'}
          </p>
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
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600">Manage all organizations on the platform</p>
        </div>
        <button
          onClick={handleCreateOrganization}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Organization
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Industry Filter */}
          <div>
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {industries.map(industry => (
                <option key={industry} value={industry}>
                  {industry === 'all' ? 'All Industries' : industry}
                </option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end text-sm text-gray-500">
            {filteredOrganizations.length} of {organizations.length} organizations
          </div>
        </div>
      </div>

      {/* Organizations List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrganizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        <div className="text-sm text-gray-500">{org.contact_email}</div>
                        <div className="text-xs text-gray-400">{org.website}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{org.industry}</div>
                      <div className="text-xs text-gray-500">{org.size}</div>
                    </div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleViewOrganization(org.id)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="View Organization"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditOrganization(org.id)}
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit Organization"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteOrganization(org.id)}
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

        {/* Empty State */}
        {filteredOrganizations.length === 0 && (
          <div className="text-center py-12">
            <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterIndustry !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating a new organization.'}
            </p>
            {!searchTerm && filterStatus === 'all' && filterIndustry === 'all' && (
              <div className="mt-6">
                <button
                  onClick={handleCreateOrganization}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Organization
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
