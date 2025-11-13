/**
 * Organization Detail Page
 * View details of a specific organization
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  BuildingOfficeIcon,
  ArrowLeftIcon,
  PencilIcon,
  UserGroupIcon,
  BookOpenIcon,
  CalendarIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
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
  address: string;
  industry: string;
  size: string;
  domain: string;
  logo_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count: number;
  course_count: number;
}

export default function OrganizationDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orgId = params?.orgId as string;
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    if (orgId && user?.role === 'super_admin') {
      loadOrganization();
    }
  }, [orgId, user]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiClient.getOrganization(orgId);
      
      // Handle different response structures
      let orgData: Organization | null = null;
      if (response.data) {
        if (response.data.id) {
          orgData = response.data;
        } else if (response.data.organization) {
          orgData = response.data.organization;
        } else if (response.data.data) {
          orgData = response.data.data;
        }
      }
      
      if (!orgData) {
        throw new Error('Organization not found');
      }
      
      setOrganization(orgData);
    } catch (error: any) {
      console.error('Error loading organization:', error);
      const errorMessage = error?.response?.data?.detail || 'Failed to load organization. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    router.push(`/admin/organizations/${orgId}/edit`);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user || user.role !== 'super_admin') {
    return null;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => router.push('/admin/organizations')}
            className="mt-4 text-red-600 hover:text-red-800 underline"
          >
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-6">
        <Breadcrumb />
        <div className="text-center py-12">
          <p className="text-gray-600">Organization not found</p>
          <button
            onClick={() => router.push('/admin/organizations')}
            className="mt-4 text-indigo-600 hover:text-indigo-800 underline"
          >
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/organizations')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-600">Organization Details</p>
          </div>
        </div>
        <button
          onClick={handleEdit}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit Organization
        </button>
      </div>

      {/* Organization Details */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-16 w-16">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />
                </div>
              )}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{organization.name}</h2>
              <p className="text-sm text-gray-500">{organization.industry || 'No industry specified'}</p>
              <span className={`inline-flex mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                organization.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {organization.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Description */}
          {organization.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
              <p className="text-sm text-gray-900">{organization.description}</p>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {organization.contact_email && (
                <div className="flex items-center space-x-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{organization.contact_email}</p>
                  </div>
                </div>
              )}
              {organization.contact_phone && (
                <div className="flex items-center space-x-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{organization.contact_phone}</p>
                  </div>
                </div>
              )}
              {organization.website && (
                <div className="flex items-center space-x-3">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Website</p>
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      {organization.website}
                    </a>
                  </div>
                </div>
              )}
              {organization.address && (
                <div className="flex items-center space-x-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="text-sm text-gray-900">{organization.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <UserGroupIcon className="h-8 w-8 text-indigo-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{organization.user_count || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <BookOpenIcon className="h-8 w-8 text-indigo-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Total Courses</p>
                    <p className="text-2xl font-semibold text-gray-900">{organization.course_count || 0}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center">
                  <CalendarIcon className="h-8 w-8 text-indigo-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(organization.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {organization.size && (
              <div>
                <p className="text-xs text-gray-500">Organization Size</p>
                <p className="text-sm text-gray-900">{organization.size}</p>
              </div>
            )}
            {organization.domain && (
              <div>
                <p className="text-xs text-gray-500">Domain</p>
                <p className="text-sm text-gray-900">{organization.domain}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

