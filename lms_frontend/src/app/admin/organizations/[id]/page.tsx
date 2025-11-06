/**
 * Organization Detail View
 * Super Admin page for viewing detailed organization information
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  BuildingOfficeIcon, 
  UsersIcon,
  BookOpenIcon,
  ChartBarIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  PencilIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';

interface Organization {
  id: number;
  name: string;
  description: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  industry: string;
  size: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
  course_count: number;
  revenue: number;
  completion_rate: number;
}

export default function OrganizationDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is super admin
  useEffect(() => {
    console.log('OrganizationDetailPage: Auth check - authLoading:', authLoading, 'user:', user);
    if (!authLoading && !user) {
      console.log('OrganizationDetailPage: No user found, redirecting to login');
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'super_admin') {
      console.log('OrganizationDetailPage: Redirecting - user:', user, 'role:', user?.role);
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    console.log('OrganizationDetailPage: Data loading check - authLoading:', authLoading, 'user role:', user?.role);
    if (!authLoading && user?.role === 'super_admin' && organizationId) {
      console.log('OrganizationDetailPage: Starting data load for org ID:', organizationId);
      loadOrganization();
    }
  }, [user, authLoading, organizationId]);

  const loadOrganization = async () => {
    try {
      console.log('OrganizationDetailPage: Loading organization...');
      setLoading(true);
      
      // Add a small delay to simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // TODO: Replace with actual API call
      // const response = await apiClient.getOrganization(organizationId);
      
      // Mock data for now
      const mockOrganization: Organization = {
        id: parseInt(organizationId),
        name: "Tech Academy",
        description: "Leading technology education provider specializing in software development, data science, and digital transformation. We offer comprehensive training programs for individuals and corporate teams.",
        website: "https://techacademy.com",
        contact_email: "admin@techacademy.com",
        contact_phone: "+1-555-0123",
        address: "123 Tech Street, Silicon Valley, CA 94025",
        industry: "Technology",
        size: "51-200",
        is_active: true,
        created_at: "2024-01-15",
        user_count: 1250,
        course_count: 45,
        revenue: 125000,
        completion_rate: 78
      };

      setOrganization(mockOrganization);
      console.log('OrganizationDetailPage: Data loaded successfully');
    } catch (error) {
      console.error('Error loading organization:', error);
    } finally {
      setLoading(false);
      console.log('OrganizationDetailPage: Loading completed');
    }
  };

  const handleEditOrganization = () => {
    router.push(`/admin/organizations/${organizationId}/edit`);
  };

  const handleBackToList = () => {
    router.push('/admin/organizations');
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading organization...'}
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

  // Show error if organization not found
  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Organization not found</h3>
          <p className="mt-1 text-sm text-gray-500">
            The organization you're looking for doesn't exist.
          </p>
          <div className="mt-6">
            <button
              onClick={handleBackToList}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Organizations
            </button>
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
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToList}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-600">{organization.description}</p>
          </div>
        </div>
        <button
          onClick={handleEditOrganization}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit Organization
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{organization.user_count.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">{organization.course_count}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{organization.completion_rate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${organization.revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Organization Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Industry</p>
                <p className="text-sm text-gray-500">{organization.industry}</p>
              </div>
            </div>
            <div className="flex items-center">
              <UsersIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Company Size</p>
                <p className="text-sm text-gray-500">{organization.size}</p>
              </div>
            </div>
            <div className="flex items-center">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Created</p>
                <p className="text-sm text-gray-500">{new Date(organization.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="h-5 w-5 mr-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  organization.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {organization.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Status</p>
                <p className="text-sm text-gray-500">{organization.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <GlobeAltIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Website</p>
                <a 
                  href={organization.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {organization.website}
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <a 
                  href={`mailto:${organization.contact_email}`}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {organization.contact_email}
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <a 
                  href={`tel:${organization.contact_phone}`}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {organization.contact_phone}
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Address</p>
                <p className="text-sm text-gray-500">{organization.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
        <p className="text-gray-600 leading-relaxed">{organization.description}</p>
      </div>
    </div>
  );
}
